#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { convert } from "html-to-text";
import { z } from "zod";
import { readFileSync } from "node:fs";

const server = new McpServer({
  name: "chakorventures-mcp",
  version: "1.0.1"
});

// =====================================================
// 1. COMPANY INFORMATION
// =====================================================

server.registerTool(
  "get_company_info",
  {
    description: "Get basic information about Chakor Ventures"
  },
  async () => ({
    content: [{
      type: "text",
      text: "Chakor Ventures is a real estate company in Pakistan. Website: https://chakorventures.com/"
    }]
  })
);

// =====================================================
// 2. LATEST WORDPRESS NEWS
// =====================================================

server.registerTool(
  "get_latest_news",
  {
    description:
      "Get the latest published real estate news from the Chakor Ventures website"
  },
  async () => {
    try {
      const response = await fetch(
        "https://chakorventures.com/wp-json/wp/v2/posts?per_page=5"
      );

      if (!response.ok) {
        throw new Error(
          `WordPress API returned ${response.status}`
        );
      }

      const posts = await response.json();

      const news = posts.map(post => ({
        title: post.title.rendered,
        date: post.date,
        url: post.link
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify(news, null, 2)
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Unable to retrieve news: ${error.message}`
        }]
      };
    }
  }
);

// =====================================================
// 3. CHAKOR MCP PAGE
// =====================================================

server.registerTool(
  "get_chakor_mcp_page",
  {
    description:
      "Retrieve official Chakor Ventures MCP page information from the company website"
  },
  async () => {
    try {
      const response = await fetch(
        "https://chakorventures.com/wp-json/wp/v2/pages?slug=mcp"
      );

      if (!response.ok) {
        throw new Error(
          `WordPress API returned ${response.status}`
        );
      }

      const pages = await response.json();

      if (!pages.length) {
        throw new Error(
          "MCP page not found in WordPress API"
        );
      }

      const page = pages[0];

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            title: page.title.rendered,
            url: page.link,
            content: convert(
              page.content.rendered,
              {
                wordwrap: false,
                selectors: [
                  {
                    selector: "a",
                    options: {
                      linkBrackets: false
                    }
                  }
                ]
              }
            )
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Unable to retrieve MCP page: ${error.message}`
        }]
      };
    }
  }
);

// =====================================================
// 4. SEARCH CHAKOR WEBSITE
// =====================================================

server.registerTool(
  "search_chakor_website",
  {
    description:
      "Search public Chakor Ventures WordPress pages and articles",
    inputSchema: {
      query: z.string().min(2)
        .describe("Search keyword")
    }
  },
  async ({ query }) => {
    try {
      const url = new URL(
        "https://chakorventures.com/wp-json/wp/v2/search"
      );

      url.searchParams.set("search", query);
      url.searchParams.set("per_page", "10");

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `WordPress API returned ${response.status}`
        );
      }

      const results = await response.json();

      return {
        content: [{
          type: "text",
          text: JSON.stringify(
            results.map(item => ({
              title: item.title,
              url: item.url,
              type: item.subtype
            })),
            null,
            2
          )
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Search failed: ${error.message}`
        }]
      };
    }
  }
);

// =====================================================
// 5. AREA UNIT CONVERTER
// =====================================================

server.registerTool(
  "convert_area_units",
  {
    description:
      "Convert land area between Marla, Kanal, square feet, square yards and acres. Supports custom Marla sizes used in Pakistan.",
    inputSchema: {
      value: z.number().nonnegative(),

      from: z.enum([
        "marla", "kanal", "sqft", "sqyd", "acre"
      ]),

      to: z.enum([
        "marla", "kanal", "sqft", "sqyd", "acre"
      ]),

      marlaSize: z.number().positive().default(225)
    }
  },
  async ({ value, from, to, marlaSize }) => {
    const units = {
      marla: marlaSize,
      kanal: marlaSize * 20,
      sqft: 1,
      sqyd: 9,
      acre: 43560
    };

    const squareFeet = value * units[from];
    const result = squareFeet / units[to];

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          input: value,
          from,
          to,
          marlaSize,
          result: Number(result.toFixed(6))
        }, null, 2)
      }]
    };
  }
);

// =====================================================
// 6. NUMBER SYSTEM CONVERTER
// =====================================================

server.registerTool(
  "convert_number_system",
  {
    description:
      "Convert numerical values between ones, thousands, lakhs, crores, millions, and billions. Useful for Pakistani property prices and international financial figures.",
    inputSchema: {
      value: z.number().finite()
        .describe("Number to convert"),

      from: z.enum([
        "ones", "thousand", "lakh",
        "crore", "million", "billion"
      ]),

      to: z.enum([
        "ones", "thousand", "lakh",
        "crore", "million", "billion"
      ])
    }
  },
  async ({ value, from, to }) => {
    const multipliers = {
      ones: 1,
      thousand: 1000,
      lakh: 100000,
      crore: 10000000,
      million: 1000000,
      billion: 1000000000
    };

    const baseValue = value * multipliers[from];
    const result = baseValue / multipliers[to];

    if (!Number.isFinite(result)) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "The number is too large to convert."
        }]
      };
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          input: value,
          from,
          to,
          result,
          explanation:
            `${value} ${from} = ${result} ${to}`
        }, null, 2)
      }]
    };
  }
);

// =====================================================
// 7. PROPERTY ROI CALCULATOR
// =====================================================

server.registerTool(
  "calculate_property_roi",
  {
    description:
      "Calculate property investment returns, nominal future value, inflation-adjusted future value, and real ROI for investments in Pakistan.",

    inputSchema: {
      investment: z.number().positive()
        .describe("Initial investment amount in PKR"),

      years: z.number().int().min(1).max(100)
        .describe("Investment period in years"),

      annualReturn: z.number().min(-100).max(1000)
        .describe("Expected annual return percentage"),

      inflationRate: z.number().min(-99).max(1000)
        .describe("Expected annual inflation percentage")
    }
  },

  async ({
    investment,
    years,
    annualReturn,
    inflationRate
  }) => {
    const nominalFV =
      investment *
      Math.pow(1 + annualReturn / 100, years);

    const realFV =
      nominalFV /
      Math.pow(1 + inflationRate / 100, years);

    // Matches the existing WordPress PV formula.
    const pvAdjusted =
      nominalFV /
      Math.pow(
        1 + annualReturn / 100 - inflationRate / 100,
        years
      );

    const nominalROI =
      ((nominalFV - investment) / investment) * 100;

    const realROI =
      ((realFV - investment) / investment) * 100;

    const result = {
      currency: "PKR",
      initialInvestment: investment,
      investmentYears: years,
      annualReturnPercent: annualReturn,
      inflationRatePercent: inflationRate,

      futureValueNominal:
        Number(nominalFV.toFixed(2)),

      futureValueInTodaysMoney:
        Number(realFV.toFixed(2)),

      presentValueInflationAdjusted:
        Number(pvAdjusted.toFixed(2)),

      nominalROIPercent:
        Number(nominalROI.toFixed(2)),

      inflationAdjustedROIPercent:
        Number(realROI.toFixed(2)),

      methodology:
        "Assumes annual compounding, constant rates, no additional cash flows, taxes, or transaction costs.",

      note:
        "Illustrative projection only. Actual investment returns may differ."
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// =====================================================
// 8. HOUSE CONSTRUCTION COST CALCULATOR
// COMPLETE ORIGINAL WORDPRESS PRICING DATA
// =====================================================

const constructionSourceRates = [
  {
    marla: 3,
    covered: 1215,
    total: 6187000,
    psf: 5092,
    grey: 2698000,
    finish: 2887000,
    labour: 601000,

    rooms: {
      bedrooms: 3,
      bathrooms: 4,
      kitchens: 2,
      living: 2,
      drawing: 1
    },

    cat: {
      foundation: 2665000,
      wood: 1775000,
      electrical: 762000,
      plumbing: 515000,
      fittings: 471000
    },

    items: {
      plumbing: [
        ["AC Drainage System", 8860],
        ["Cold & Hot Water Supply", 30300],
        ["Drainage System Piping", 41490],
        ["Gas Piping", 38440],
        ["Insulation Armaflex", 19680],
        ["Pumps and Drains", 301000],
        ["UPVC Pipeline for Sewerage", 21000],
        ["Labour Cost", 53460]
      ],

      electrical: [
        ["Conduits & Accessories", 31580],
        ["Lights, Fans & Chandeliers", 230000],
        ["Switches and Back Boxes", 187000],
        ["Wires & Cables", 258000],
        ["Labour Cost", 55890]
      ],

      wood: [
        ["Metal Works", 187000],
        ["Paint and Ceiling Works", 336000],
        ["Tile Work", 639000],
        ["Wardrobes & Cabinets", 441000],
        ["Windows", 173000]
      ],

      fittings: [
        ["Bathroom", 378000],
        ["Geyser & Manhole", 37200],
        ["Kitchen", 55000]
      ],

      foundation: [
        ["Bricks, Cement, Sand & Crush", 1604000],
        ["Excavation & Steel Reinf.", 533000],
        ["Roof Insulation & Waterproof", 35980],
        ["Labour Cost", 492000]
      ]
    }
  },

  {
    marla: 5,
    covered: 2025,
    total: 9396000,
    psf: 4640,
    grey: 4705000,
    finish: 3689000,
    labour: 1002000,

    rooms: {
      bedrooms: 3,
      bathrooms: 4,
      kitchens: 2,
      living: 2,
      drawing: 1
    },

    cat: {
      foundation: 4870000,
      wood: 2462000,
      electrical: 925000,
      plumbing: 663000,
      fittings: 476000
    },

    items: {
      plumbing: [
        ["AC Drainage System", 14800],
        ["Cold & Hot Water Supply", 50360],
        ["Drainage System Piping", 68810],
        ["Gas Piping", 64630],
        ["Insulation Armaflex", 33240],
        ["Pumps and Drains", 306000],
        ["UPVC Pipeline for Sewerage", 35700],
        ["Labour Cost", 89100]
      ],

      electrical: [
        ["Conduits & Accessories", 48370],
        ["Lights, Fans & Chandeliers", 235000],
        ["Switches and Back Boxes", 187000],
        ["Wires & Cables", 361000],
        ["Labour Cost", 93150]
      ],

      wood: [
        ["Metal Works", 224000],
        ["Paint and Ceiling Works", 559000],
        ["Tile Work", 1065000],
        ["Wardrobes & Cabinets", 441000],
        ["Windows", 173000]
      ],

      fittings: [
        ["Bathroom", 378000],
        ["Geyser & Manhole", 42540],
        ["Kitchen", 55000]
      ],

      foundation: [
        ["Bricks, Cement, Sand & Crush", 3230000],
        ["Excavation & Steel Reinf.", 759000],
        ["Roof Insulation & Waterproof", 60320],
        ["Labour Cost", 820000]
      ]
    }
  },

  {
    marla: 10,
    covered: 3375,
    total: 15100000,
    psf: 4475,
    grey: 7823000,
    finish: 5609000,
    labour: 1671000,

    rooms: {
      bedrooms: 4,
      bathrooms: 5,
      kitchens: 2,
      living: 2,
      drawing: 1
    },

    cat: {
      foundation: 8315000,
      wood: 4001000,
      electrical: 1298000,
      plumbing: 908000,
      fittings: 581000
    },

    items: {
      plumbing: [
        ["AC Drainage System", 24620],
        ["Cold & Hot Water Supply", 84200],
        ["Drainage System Piping", 115000],
        ["Gas Piping", 107000],
        ["Insulation Armaflex", 55450],
        ["Pumps and Drains", 315000],
        ["UPVC Pipeline for Sewerage", 58800],
        ["Labour Cost", 149000]
      ],

      electrical: [
        ["Conduits & Accessories", 77370],
        ["Lights, Fans & Chandeliers", 270000],
        ["Switches and Back Boxes", 200000],
        ["Wires & Cables", 596000],
        ["Labour Cost", 155000]
      ],

      wood: [
        ["Metal Works", 287000],
        ["Paint and Ceiling Works", 932000],
        ["Tile Work", 2058000],
        ["Wardrobes & Cabinets", 518000],
        ["Windows", 206000]
      ],

      fittings: [
        ["Bathroom", 472000],
        ["Geyser & Manhole", 53220],
        ["Kitchen", 55000]
      ],

      foundation: [
        ["Bricks, Cement, Sand & Crush", 5583000],
        ["Excavation & Steel Reinf.", 1265000],
        ["Roof Insulation & Waterproof", 99850],
        ["Labour Cost", 1367000]
      ]
    }
  },

  {
    marla: 20,
    covered: 6300,
    total: 26000000,
    psf: 4134,
    grey: 13500000,
    finish: 9452000,
    labour: 3118000,

    rooms: {
      bedrooms: 5,
      bathrooms: 6,
      kitchens: 2,
      living: 2,
      drawing: 1
    },

    cat: {
      foundation: 14700000,
      wood: 7078000,
      electrical: 2063000,
      plumbing: 1440000,
      fittings: 790000
    },

    items: {
      plumbing: [
        ["AC Drainage System", 45900],
        ["Cold & Hot Water Supply", 157000],
        ["Drainage System Piping", 214000],
        ["Gas Piping", 201000],
        ["Insulation Armaflex", 103000],
        ["Pumps and Drains", 331000],
        ["UPVC Pipeline for Sewerage", 111000],
        ["Labour Cost", 277000]
      ],

      electrical: [
        ["Conduits & Accessories", 140000],
        ["Lights, Fans & Chandeliers", 335000],
        ["Switches and Back Boxes", 224000],
        ["Wires & Cables", 1074000],
        ["Labour Cost", 290000]
      ],

      wood: [
        ["Metal Works", 424000],
        ["Paint and Ceiling Works", 1739000],
        ["Tile Work", 4068000],
        ["Wardrobes & Cabinets", 594000],
        ["Windows", 253000]
      ],

      fittings: [
        ["Bathroom", 661000],
        ["Geyser & Manhole", 74570],
        ["Kitchen", 55000]
      ],

      foundation: [
        ["Bricks, Cement, Sand & Crush", 9263000],
        ["Excavation & Steel Reinf.", 2673000],
        ["Roof Insulation & Waterproof", 187000],
        ["Labour Cost", 2552000]
      ]
    }
  }
];

// =====================================================
// CONSTRUCTION COST TOOL REGISTRATION
// =====================================================

server.registerTool(
  "estimate_construction_cost",
  {
    description:
      "Estimate Pakistan house construction costs using Chakor Ventures April 2026 reference pricing. Automatically calculates grey structure material cost, finishing material cost, labour cost, cost per covered square foot, and detailed construction category breakdowns.",

    inputSchema: {
      city: z.enum([
        "lahore",
        "karachi",
        "islamabad"
      ]).describe("City where the property is located"),

      areaSize: z.number().positive()
        .describe("Plot area size"),

      areaUnit: z.enum([
        "marla",
        "kanal",
        "sqft",
        "sqyd",
        "sqm",
        "acre"
      ]).describe("Plot area measurement unit"),

      constructionType: z.enum([
        "grey_structure",
        "complete"
      ]).default("complete"),

      constructionMode: z.enum([
        "with_material",
        "without_material"
      ]).default("with_material"),

      coveredArea: z.number().positive().optional()
        .describe(
          "Optional total covered construction area in square feet"
        ),

      bedrooms: z.number().int().min(1).max(6).optional(),
      bathrooms: z.number().int().min(1).max(7).optional(),
      kitchens: z.number().int().min(1).max(4).optional(),
      livingRooms: z.number().int().min(1).max(4).optional(),
      drawingRooms: z.number().int().min(1).max(3).optional()
    }
  },

  async (input) => {
    const cityFactors = {
      lahore: 1.00,
      karachi: 0.95,
      islamabad: 1.08
    };

    const areaRanges = {
      sqft: [225, 449775],
      kanal: [0.15, 99.95],
      marla: [3, 1999],
      sqyd: [75, 49975],
      sqm: [63, 41979],
      acre: [0.02, 12.49]
    };

    const errorResult = message => ({
      isError: true,
      content: [{
        type: "text",
        text: message
      }]
    });

    const [minArea, maxArea] =
      areaRanges[input.areaUnit];

    if (
      input.areaSize < minArea ||
      input.areaSize > maxArea
    ) {
      return errorResult(
        `Area size must be between ${minArea} and ${maxArea} ${input.areaUnit}.`
      );
    }

    // Convert area to Marla.

    const marla = {
      marla: input.areaSize,
      kanal: input.areaSize * 20,
      sqft: input.areaSize / 225,
      sqyd: input.areaSize / 25,
      sqm: input.areaSize / 20.903,
      acre: input.areaSize * 160
    }[input.areaUnit];

    const clone = value =>
      JSON.parse(JSON.stringify(value));

    const interpolate = (a, b, factor) =>
      a + ((b - a) * factor);

    // Scale source rates and category items.

    function scaleRate(rate, factor) {
      const mainFields = [
        "covered",
        "total",
        "grey",
        "finish",
        "labour"
      ];

      for (const key of mainFields) {
        rate[key] *= factor;
      }

      for (const key of Object.keys(rate.cat)) {
        rate.cat[key] *= factor;
      }

      for (const rows of Object.values(rate.items)) {
        for (const row of rows) {
          row[1] *= factor;
        }
      }

      rate.psf = Math.round(
        rate.total / rate.covered
      );

      return rate;
    }

    // Interpolate reference house rates.

    function mixRates(a, b, factor, sizeMarla) {
      const output = {
        marla: sizeMarla,

        covered: interpolate(
          a.covered, b.covered, factor
        ),

        total: interpolate(
          a.total, b.total, factor
        ),

        psf: Math.round(
          interpolate(a.psf, b.psf, factor)
        ),

        grey: interpolate(
          a.grey, b.grey, factor
        ),

        finish: interpolate(
          a.finish, b.finish, factor
        ),

        labour: interpolate(
          a.labour, b.labour, factor
        ),

        rooms: {},
        cat: {},
        items: {}
      };

      for (const key of Object.keys(a.rooms)) {
        output.rooms[key] = Math.round(
          interpolate(
            a.rooms[key],
            b.rooms[key],
            factor
          )
        );
      }

      for (const key of Object.keys(a.cat)) {
        output.cat[key] = interpolate(
          a.cat[key],
          b.cat[key],
          factor
        );
      }

      for (
        const [category, rows] of
        Object.entries(a.items)
      ) {
        output.items[category] = rows.map(
          (row, index) => [
            row[0],
            interpolate(
              row[1],
              b.items[category][index][1],
              factor
            )
          ]
        );
      }

      return output;
    }

    // Find matching reference rate.

    function getReferenceRate(sizeMarla) {
      if (
        sizeMarla <=
        constructionSourceRates[0].marla
      ) {
        return clone(constructionSourceRates[0]);
      }

      for (
        let i = 0;
        i < constructionSourceRates.length - 1;
        i++
      ) {
        const first = constructionSourceRates[i];
        const second = constructionSourceRates[i + 1];

        if (
          sizeMarla >= first.marla &&
          sizeMarla <= second.marla
        ) {
          return mixRates(
            first,
            second,
            (sizeMarla - first.marla) /
              (second.marla - first.marla),
            sizeMarla
          );
        }
      }

      const lastRate = clone(
        constructionSourceRates[
          constructionSourceRates.length - 1
        ]
      );

      scaleRate(
        lastRate,
        sizeMarla / lastRate.marla
      );

      lastRate.marla = sizeMarla;
      return lastRate;
    }

    const referenceRate = getReferenceRate(marla);

    const coveredArea = input.coveredArea ??
      Math.round(referenceRate.covered);

    const defaultRooms = referenceRate.rooms;

    // Room configuration.

    const rooms = {
      bedrooms:
        input.bedrooms ?? defaultRooms.bedrooms,

      bathrooms:
        input.bathrooms ?? defaultRooms.bathrooms,

      kitchens:
        input.kitchens ?? defaultRooms.kitchens,

      living:
        input.livingRooms ?? defaultRooms.living,

      drawing:
        input.drawingRooms ?? defaultRooms.drawing
    };

    const roomFactor =
      1 +
      (rooms.bedrooms - defaultRooms.bedrooms) * 0.015 +
      (rooms.bathrooms - defaultRooms.bathrooms) * 0.018 +
      (rooms.kitchens - defaultRooms.kitchens) * 0.012 +
      (rooms.living - defaultRooms.living) * 0.008 +
      (rooms.drawing - defaultRooms.drawing) * 0.008;

    if (roomFactor <= 0) {
      return errorResult(
        "Invalid room configuration produced a non-positive adjustment factor."
      );
    }

    // City, covered area, room adjustments.

    const adjustmentFactor =
      (coveredArea / referenceRate.covered) *
      cityFactors[input.city] *
      roomFactor;

    const calculatedRate = scaleRate(
      clone(referenceRate),
      adjustmentFactor
    );

    calculatedRate.covered = coveredArea;

    // Preserve WordPress Without Material logic.

    const labourFactor =
      input.constructionMode === "without_material"
        ? 0.864
        : 1;

    calculatedRate.labour *= labourFactor;

    if (
      input.constructionType === "grey_structure"
    ) {
      calculatedRate.finish = 0;
    }

    calculatedRate.total =
      calculatedRate.grey +
      calculatedRate.finish +
      calculatedRate.labour;

    // Category labels.

    const categoryNames = {
      plumbing: "Plumbing Works",
      electrical: "Electrical Works",
      wood: "Wood, Metal and Tile Works",
      fittings: "Fittings & Fixtures",
      foundation: "Foundation & Structure"
    };

    const categoryKeys =
      input.constructionType === "grey_structure"
        ? [
            "plumbing",
            "electrical",
            "foundation"
          ]
        : [
            "plumbing",
            "electrical",
            "wood",
            "fittings",
            "foundation"
          ];

    // Detailed category breakdowns.

    const categoryBreakdown = categoryKeys.map(
      key => {
        const electricalFactor =
          input.constructionType === "grey_structure" &&
          key === "electrical"
            ? 0.19
            : 1;

        const categoryCost =
          calculatedRate.cat[key] *
          electricalFactor;

        const rows = calculatedRate.items[key] || [];

        const sourceTotal = rows.reduce(
          (total, row) => total + row[1],
          0
        ) || categoryCost;

        const detailedItems = rows.map(
          row => ({
            name: row[0],
            amountPKR: Math.round(
              categoryCost *
              (row[1] / sourceTotal)
            )
          })
        );

        return {
          category: categoryNames[key],
          amountPKR: Math.round(categoryCost),
          items: detailedItems
        };
      }
    );

    // Final calculations.

    const totalConstructionCost = Math.round(
      calculatedRate.total
    );

    const greyStructureMaterialCost = Math.round(
      calculatedRate.grey
    );

    const finishingMaterialCost = Math.round(
      calculatedRate.finish
    );

    const labourCost = Math.round(
      calculatedRate.labour
    );

    const pricePerCoveredSqft = Math.round(
      calculatedRate.total / coveredArea
    );

    const result = {
      currency: "PKR",
      pricingLastUpdated: "2026-04-30",
      city: input.city,
      plotArea: input.areaSize,
      plotAreaUnit: input.areaUnit,

      equivalentMarla:
        Number(marla.toFixed(4)),

      coveredAreaSqft: coveredArea,
      constructionType: input.constructionType,
      constructionMode: input.constructionMode,
      rooms,

      totalConstructionCost,
      greyStructureMaterialCost,
      finishingMaterialCost,
      labourCost,
      pricePerCoveredSqft,
      categoryBreakdown,

      notes: [
        "Based on Chakor Ventures April 2026 reference construction prices.",

        "These prices are estimates, not live market quotations.",

        "Covered area is calculated from the reference model unless explicitly supplied.",

        "For plots smaller than 3 Marla, the original methodology uses the 3 Marla reference model.",

        "Category breakdowns are separately modelled and may not reconcile exactly with the total construction cost.",

        ...(
          input.constructionMode ===
          "without_material"
            ? [
                "The existing website methodology applies a 0.864 labour multiplier but retains material costs. The result is not a labour-only estimate."
              ]
            : []
        ),

        "Final construction costs may vary according to materials, location, contractor and market conditions."
      ]
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// =====================================================
// 9. PAKISTAN POSTAL CODE LOOKUP
// =====================================================

// Requires postal-codes.json alongside index.js.

const pakistanPostalCodes = JSON.parse(
  readFileSync(
    new URL("./postal-codes.json", import.meta.url),
    "utf8"
  )
).map(item => ({
  city: String(item["City"] ?? "").trim(),
  area: String(item["Area Name"] ?? "").trim(),
  postalCode: String(item["Postal Code"] ?? "")
    .trim()
    .padStart(5, "0")
}));

server.registerTool(
  "lookup_pakistan_postal_code",
  {
    description:
      "Find Pakistan postal codes by city and optional locality using a local postal-code dataset. Returns matching locations and identifies when no record is available.",

    inputSchema: {
      city: z.string().min(2)
        .describe("City name, e.g. Islamabad"),

      area: z.string().optional()
        .describe("Optional locality, e.g. G-9 Markaz")
    }
  },

  async ({ city, area }) => {
    const normalize = value =>
      value.toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const cityQuery = normalize(city);

    const areaQuery =
      area ? normalize(area) : "";

    const matches = pakistanPostalCodes.filter(
      item => {
        const cityMatch =
          normalize(item.city) === cityQuery;

        const areaMatch =
          !areaQuery ||
          normalize(item.area).includes(areaQuery);

        return cityMatch && areaMatch;
      }
    );

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          city,
          area: area || null,
          found: matches.length > 0,
          totalMatches: matches.length,
          results: matches,

          source:
            "Pakistan Post National Post Code Directory",

          sourceUrl:
            "https://www.pakpost.gov.pk/postcodes.php",

          coverage:
            "Local postal-code dataset. Coverage and accuracy should be checked against Pakistan Post.",

          note: matches.length
            ? "Verify the precise locality before mailing."
            : "No matching record in the local dataset. This does not mean the locality has no postal code."
        }, null, 2)
      }]
    };
  }
);

// =====================================================
// 10. PROPERTY TAX CALCULATOR
// =====================================================


  server.registerTool(
    "estimate_property_tax",
    {
      description:
        "Calculate Pakistan property taxes using the Chakor Ventures WordPress FBR Property Tax Calculator FY 2025-26 methodology. Automatically returns Section 236K purchase advance tax, Section 236C sale advance tax, and Section 37 capital gains tax in one result. Uses the website's customised rates and simplified CGT rules, not independently verified current FBR rates.",

      inputSchema: {
        taxpayerStatus: z.enum([
          "filer",
          "late_filer",
          "non_filer"
        ]).describe(
          "Taxpayer status: Filer, Late Filer, or Non-Filer"
        ),

        acquisitionDate: z.string().optional()
          .describe(
            "Property acquisition date in YYYY-MM-DD format. Required to calculate CGT."
          ),

        propertyValue: z.number().nonnegative()
          .describe(
            "Property value according to FBR valuation in PKR"
          ),

        overseasPakistani: z.boolean().default(false)
          .describe(
            "Whether the taxpayer is an overseas Pakistani"
          ),

        primaryResidence: z.boolean().default(false)
          .describe(
            "Whether the property is the taxpayer's primary residence"
          ),

        propertyType: z.enum([
          "open_plot",
          "constructed_building",
          "flat"
        ]).default("open_plot")
          .describe(
            "Type of property for capital gains tax calculation"
          ),

        purchasePrice: z.number().nonnegative()
          .describe(
            "Original property purchase price in PKR"
          ),

        salePrice: z.number().nonnegative()
          .describe(
            "Property sale price in PKR"
          )
      }
    },

    async ({
      taxpayerStatus,
      acquisitionDate,
      propertyValue,
      overseasPakistani,
      primaryResidence,
      propertyType,
      purchasePrice,
      salePrice
    }) => {

      // ============================================
      // 1. HELPERS
      // ============================================

      const errorResult = message => ({
        isError: true,
        content: [{
          type: "text",
          text: message
        }]
      });

      const roundPKR = amount =>
        Math.round(amount);

      const formatPKR = amount =>
        Number(amount).toLocaleString("en-US", {
          maximumFractionDigits: 0
        });

      const formatPercent = rate => {
        return Number(
          (rate * 100).toFixed(3)
        ).toString() + "%";
      };

      const roundTo = (value, decimals) => {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
      };

      // ============================================
      // 2. DATE HANDLING
      // ============================================

      function parseDate(value) {
        if (!value) {
          return null;
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return null;
        }

        const parsedDate = new Date(
          value + "T00:00:00Z"
        );

        if (
          Number.isNaN(parsedDate.getTime()) ||
          parsedDate.toISOString().slice(0, 10) !== value
        ) {
          return null;
        }

        return parsedDate;
      }

      const acquired = acquisitionDate
        ? parseDate(acquisitionDate)
        : null;

      if (acquisitionDate && !acquired) {
        return errorResult(
          "Invalid acquisition date. Use YYYY-MM-DD."
        );
      }

      // The WordPress calculator uses the current date
      // in Pakistan to calculate the holding period.
      // No disposal date is required.

      const pakistanTodayString =
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Karachi",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).format(new Date());

      const todayParts =
        pakistanTodayString.split("-").map(Number);

      const today = new Date(Date.UTC(
        todayParts[0],
        todayParts[1] - 1,
        todayParts[2]
      ));

      // ============================================
      // 3. HOLDING PERIOD
      // ============================================

      function holdingPeriodYears(acquisition) {
        if (!acquisition) {
          return null;
        }

        if (acquisition > today) {
          return 0;
        }

        let years =
          today.getUTCFullYear() -
          acquisition.getUTCFullYear();

        let months =
          today.getUTCMonth() -
          acquisition.getUTCMonth();

        let days =
          today.getUTCDate() -
          acquisition.getUTCDate();

        if (days < 0) {
          const previousMonthDays =
            new Date(Date.UTC(
              today.getUTCFullYear(),
              today.getUTCMonth(),
              0
            )).getUTCDate();

          days += previousMonthDays;
          months -= 1;
        }

        if (months < 0) {
          months += 12;
          years -= 1;
        }

        const holding =
          years +
          (months / 12) +
          (days / 365);

        return roundTo(holding, 2);
      }

      const holdingYears =
        holdingPeriodYears(acquired);

      const holdingLabel =
        holdingYears === null
          ? "—"
          : holdingYears.toFixed(1) + " years";

      // ============================================
      // 4. TAXPAYER STATUS NORMALIZATION
      // ============================================

      const statusRaw = taxpayerStatus;

      // WordPress rule:
      // Overseas + Non-Filer uses Filer rates
      // for Sections 236K and 236C only.

      const statusFor236 =
        overseasPakistani &&
        statusRaw === "non_filer"
          ? "filer"
          : statusRaw;

      // ============================================
      // 5. SECTION 236K
      // ADVANCE TAX ON PROPERTY PURCHASE
      // ============================================

      function pickRate236K(value, status) {
        if (value <= 50000000) {
          const rates = {
            filer: 0.015,
            late_filer: 0.045,
            non_filer: 0.105
          };

          return {
            rate: rates[status],
            slab: "V ≤ 50,000,000"
          };
        }

        if (value <= 100000000) {
          const rates = {
            filer: 0.020,
            late_filer: 0.055,
            non_filer: 0.145
          };

          return {
            rate: rates[status],
            slab:
              "50,000,000 < V ≤ 100,000,000"
          };
        }

        const rates = {
          filer: 0.025,
          late_filer: 0.065,
          non_filer: 0.185
        };

        return {
          rate: rates[status],
          slab: "V > 100,000,000"
        };
      }

      const tax236KRate = pickRate236K(
        propertyValue,
        statusFor236
      );

      const tax236KAmount = roundPKR(
        propertyValue * tax236KRate.rate
      );

      const tax236K = {
        amount: tax236KAmount,
        rate: tax236KRate.rate,
        slab: tax236KRate.slab,
        calc:
          "(" +
          formatPKR(propertyValue) +
          " × " +
          formatPercent(tax236KRate.rate) +
          ")"
      };

      // ============================================
      // 6. SECTION 236C
      // TRANSFER / SALE OF PROPERTY
      // ============================================

      // Exact WordPress customised formula:
      // Flat 2.75% regardless of taxpayer status
      // or property valuation bracket.

      const tax236CRate = {
        rate: 0.0275,
        slab: "Flat rate"
      };

      const tax236CAmount = roundPKR(
        propertyValue * tax236CRate.rate
      );

      const tax236C = {
        amount: tax236CAmount,
        rate: tax236CRate.rate,
        slab: tax236CRate.slab,
        calc:
          "(" +
          formatPKR(propertyValue) +
          " × " +
          formatPercent(tax236CRate.rate) +
          ")"
      };

      // ============================================
      // 7. SECTION 37
      // CAPITAL GAINS TAX
      // ============================================

      const profit = Math.max(
        0,
        salePrice - purchasePrice
      );

      const cutoffDate = new Date(
        "2024-07-01T00:00:00Z"
      );

      let cgtAmount = null;
      let cgtRate = null;
      let cgtRule = "";
      let cgtNote = "";
      let cgtCalculation = "—";

      // ============================================
      // 8. MISSING ACQUISITION DATE
      // ============================================

      if (!acquired) {
        cgtRule =
          "Acquisition date required for CGT";

        cgtNote =
          "Enter acquisition date to calculate CGT.";
      }

      // ============================================
      // 9. ACQUIRED ON/AFTER 01 JULY 2024
      // ============================================

      else if (acquired >= cutoffDate) {
        cgtRule =
          "Acquired on/after 01-07-2024";

        if (statusRaw === "non_filer") {
          cgtAmount = null;
          cgtRate = null;

          cgtNote =
            "Non-Filer CGT uses standard income tax slabs (Schedule 1) — not included in this calculator yet.";
        } else {
          cgtRate = 0.15;

          cgtAmount = roundPKR(
            profit * cgtRate
          );

          cgtNote =
            "Filer/Late filer: Profit × 15%";

          cgtCalculation =
            "(Profit " +
            formatPKR(profit) +
            " × 15%)";
        }
      }

      // ============================================
      // 10. ACQUIRED BEFORE 01 JULY 2024
      // ============================================

      else {
        cgtRule =
          "Acquired before 01-07-2024 (example tiers)";

        // Exact WordPress exemption thresholds:
        // Flat: 2 years
        // Open plot / Constructed building: 6 years

        const threshold =
          propertyType === "flat"
            ? 2
            : 6;

        const isExempt =
          holdingYears >= threshold;

        // Exemption is checked before non-filer status,
        // matching the WordPress source.

        if (isExempt) {
          cgtRate = 0;
          cgtAmount = 0;

          cgtNote =
            "Held ≥ " +
            threshold +
            " years → 0%.";

          cgtCalculation =
            "(Profit " +
            formatPKR(profit) +
            " × 0%)";
        }

        else if (statusRaw === "non_filer") {
          cgtRate = null;
          cgtAmount = null;

          cgtNote =
            "Non-Filer CGT uses standard income tax slabs (Schedule 1) — not included in this calculator yet.";
        }

        else {
          // Exact website fallback methodology:
          // 15% for filer/late filer when the
          // exemption threshold is not reached.

          cgtRate = 0.15;

          cgtAmount = roundPKR(
            profit * cgtRate
          );

          cgtNote =
            "Held < " +
            threshold +
            " years → Profit × 15% (fallback until full tier table is provided).";

          cgtCalculation =
            "(Profit " +
            formatPKR(profit) +
            " × 15%)";
        }
      }

      const taxCGT = {
        applies: true,
        amount: cgtAmount,
        profit: profit,
        rate: cgtRate,
        rule: cgtRule,
        note: cgtNote,
        calc: cgtCalculation
      };

      // ============================================
      // 11. WORDPRESS INPUT SUMMARY
      // ============================================

      const inputSummary = {
        status_raw: statusRaw,
        status_236: statusFor236,
        value: propertyValue,
        overseas: overseasPakistani,
        primary_residence: primaryResidence,
        property_type: propertyType,
        purchase_price: purchasePrice,
        sale_price: salePrice,
        acquisition_date:
          acquisitionDate || "",
        holding_period_label: holdingLabel
      };

      // ============================================
      // 12. NOTES
      // ============================================

      const notes = [];

      if (
        statusRaw === "non_filer" &&
        overseasPakistani
      ) {
        notes.push(
          "Overseas + Non-Filer: 236K/236C uses Filer rates."
        );
      }

      // ============================================
      // 13. FINAL RESULT
      // SAME STRUCTURE AS WORDPRESS
      // ============================================

      const result = {
        inputs: inputSummary,

        taxes: {
          "236k": tax236K,
          "236c": tax236C,
          cgt: taxCGT
        },

        notes: notes
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    }
  );


// =====================================================
// 11. SALARIED INCOME TAX CALCULATOR
// =====================================================

server.registerTool(
  "estimate_income_tax",
  {
    description:
      "Estimate Pakistan salaried individual income tax for FY 2025-26 or FY 2026-27. Returns monthly tax, annual tax, net salary and applicable slab.",

    inputSchema: {
      monthlySalary: z.number().nonnegative()
        .describe("Monthly taxable salary in PKR"),

      taxYear: z.enum([
        "2025-26",
        "2026-27"
      ]).default("2026-27")
    }
  },

  async ({ monthlySalary, taxYear }) => {
    const annualSalary = monthlySalary * 12;

    if (!Number.isFinite(annualSalary)) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: "Invalid salary amount."
        }]
      };
    }

    const slabs =
      taxYear === "2025-26"
        ? [
            {
              limit: 600000,
              base: 0,
              threshold: 0,
              rate: 0
            },
            {
              limit: 1200000,
              base: 0,
              threshold: 600000,
              rate: 0.01
            },
            {
              limit: 2200000,
              base: 6000,
              threshold: 1200000,
              rate: 0.11
            },
            {
              limit: 3200000,
              base: 116000,
              threshold: 2200000,
              rate: 0.23
            },
            {
              limit: 4100000,
              base: 346000,
              threshold: 3200000,
              rate: 0.30
            },
            {
              limit: Infinity,
              base: 616000,
              threshold: 4100000,
              rate: 0.35
            }
          ]
        : [
            {
              limit: 600000,
              base: 0,
              threshold: 0,
              rate: 0
            },
            {
              limit: 1200000,
              base: 0,
              threshold: 600000,
              rate: 0.01
            },
            {
              limit: 2200000,
              base: 6000,
              threshold: 1200000,
              rate: 0.11
            },
            {
              limit: 3200000,
              base: 116000,
              threshold: 2200000,
              rate: 0.20
            },
            {
              limit: 4100000,
              base: 316000,
              threshold: 3200000,
              rate: 0.25
            },
            {
              limit: 5600000,
              base: 541000,
              threshold: 4100000,
              rate: 0.29
            },
            {
              limit: 7000000,
              base: 976000,
              threshold: 5600000,
              rate: 0.32
            },
            {
              limit: Infinity,
              base: 1424000,
              threshold: 7000000,
              rate: 0.35
            }
          ];

    const slab = slabs.find(
      s => annualSalary <= s.limit
    );

    const baseTax = Math.max(
      0,
      slab.base +
      (annualSalary - slab.threshold) * slab.rate
    );

    const surchargeApplied =
      taxYear === "2025-26" &&
      annualSalary > 10000000;

    const surchargeAmount =
      surchargeApplied
        ? baseTax * 0.09
        : 0;

    const annualTax =
      baseTax + surchargeAmount;

    const monthlyTax =
      annualTax / 12;

    const round = value =>
      Number(value.toFixed(2));

    const result = {
      currency: "PKR",
      taxYear,
      category: "Salaried Individual",

      monthlyGrossSalary:
        round(monthlySalary),

      annualGrossSalary:
        round(annualSalary),

      applicableMarginalRatePercent:
        slab.rate * 100,

      annualTaxBeforeSurcharge:
        round(baseTax),

      surchargeApplied,

      surchargeAmount:
        round(surchargeAmount),

      annualTax:
        round(annualTax),

      monthlyTax:
        round(monthlyTax),

      monthlySalaryAfterTax:
        round(
          Math.max(
            0,
            monthlySalary - monthlyTax
          )
        ),

      annualSalaryAfterTax:
        round(
          Math.max(
            0,
            annualSalary - annualTax
          )
        ),

      methodology:
        "Uses selected tax-year salaried income slabs. Assumes input is taxable salary, with no additional adjustments, credits or deductions.",

      disclaimer:
        "Indicative estimate only. Verify applicability, deductions and current rules with FBR or a qualified tax professional."
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);


  server.registerTool(
    "estimate_brick_cost",
    {
      description:
        "Estimate A-Class bricks required and their material cost for a house in Pakistan. Matches the Chakor Ventures House Brick Calculator methodology using September 2026 reference prices, single or double storey construction, interpolation, proportional scaling, and 5%-10% wastage.",

      inputSchema: {
        area: z.number().positive()
          .describe(
            "House area size. Minimum supported size is 0.1 Marla or 0.005 Kanal."
          ),

        unit: z.enum([
          "marla",
          "kanal"
        ]).default("marla")
          .describe("House area measurement unit"),

        city: z.enum([
          "lahore",
          "karachi",
          "islamabad",
          "rawalpindi",
          "faisalabad",
          "multan",
          "peshawar",
          "gujranwala",
          "quetta"
        ]).describe(
          "Pakistani city for A-Class brick pricing"
        ),

        building: z.enum([
          "single",
          "double"
        ]).default("single")
          .describe(
            "Building type: single storey or double storey"
          )
      }
    },

    async ({
      area,
      unit = "marla",
      city,
      building = "single"
    }) => {

      // ===========================================
      // 1. ORIGINAL SEPTEMBER 2026 BRICK PRICES
      // PKR PER A-CLASS BRICK
      // ===========================================

      const cities = {
        lahore: {
          min: 16,
          max: 19
        },
        karachi: {
          min: 17,
          max: 21
        },
        islamabad: {
          min: 17,
          max: 20
        },
        rawalpindi: {
          min: 17,
          max: 20
        },
        faisalabad: {
          min: 14,
          max: 17
        },
        multan: {
          min: 13,
          max: 16
        },
        peshawar: {
          min: 17,
          max: 21
        },
        gujranwala: {
          min: 14,
          max: 17
        },
        quetta: {
          min: 20,
          max: 25
        }
      };

      // ===========================================
      // 2. ORIGINAL BRICK QUANTITY REFERENCES
      // ===========================================

      const references = {
        single: [
          {
            marla: 3,
            min: 8000,
            max: 12000
          },
          {
            marla: 5,
            min: 14000,
            max: 20000
          },
          {
            marla: 10,
            min: 28000,
            max: 40000
          },
          {
            marla: 20,
            min: 50000,
            max: 70000
          }
        ],

        double: [
          {
            marla: 5,
            min: 28000,
            max: 38000
          }
        ]
      };

      // ===========================================
      // 3. ERROR RESPONSE HELPER
      // ===========================================

      const errorResult = message => ({
        isError: true,
        content: [{
          type: "text",
          text: message
        }]
      });

      // ===========================================
      // 4. CONVERT AREA INTO MARLA
      // ===========================================

      // Original WordPress conversion:
      // 1 Kanal = 20 Marla

      const marla =
        area * (unit === "kanal" ? 20 : 1);

      if (
        !Number.isFinite(marla) ||
        marla < 0.1
      ) {
        return errorResult(
          "Enter a valid area of at least 0.1 Marla and choose a building type."
        );
      }

      // ===========================================
      // 5. FIND REFERENCE QUANTITY
      // ===========================================

      const points = references[building];

      const exact = points.find(
        point =>
          Math.abs(point.marla - marla) < 1e-9
      );

      let quantity;

      if (exact) {

        quantity = {
          min: exact.min,
          max: exact.max,
          method: "reference",
          basis:
            `Supplied ${exact.marla} Marla reference range`
        };

      } else {

        let lower;
        let upper;

        for (const point of points) {
          if (point.marla > marla) {
            upper = point;
            break;
          }

          lower = point;
        }

        let min;
        let max;
        let method;
        let basis;

        // =========================================
        // 6. LINEAR INTERPOLATION
        // =========================================

        if (lower && upper) {

          const fraction =
            (marla - lower.marla) /
            (upper.marla - lower.marla);

          min =
            lower.min +
            (upper.min - lower.min) * fraction;

          max =
            lower.max +
            (upper.max - lower.max) * fraction;

          method = "interpolated";

          basis =
            `Interpolated between ${lower.marla} and ${upper.marla} Marla reference ranges`;

        } else {

          // =======================================
          // 7. PROPORTIONAL SCALING
          // =======================================

          // Double-storey calculations use the
          // supplied 5-Marla reference at all
          // non-reference house sizes.

          const reference = lower || upper;

          const ratio =
            marla / reference.marla;

          min = reference.min * ratio;
          max = reference.max * ratio;

          method = "scaled";

          basis =
            `Scaled from the ${reference.marla} Marla reference range`;
        }

        // Match WordPress quantity rounding.

        quantity = {
          min: Math.floor(
            min + Number.EPSILON * min
          ),
          max: Math.ceil(
            max - Number.EPSILON * max
          ),
          method,
          basis
        };
      }

      // ===========================================
      // 8. REQUIRED BRICKS BEFORE WASTAGE
      // ===========================================

      const required = {
        min: quantity.min,
        max: quantity.max
      };

      // ===========================================
      // 9. WASTAGE: 5% MIN, 10% MAX
      // ===========================================

      const wastagePercent = {
        min: 5,
        max: 10
      };

      // The original website rounds each
      // additional wastage quantity upward.

      const allowanceMin =
        required.min * 0.05;

      const allowanceMax =
        required.max * 0.10;

      const extraMin = Math.ceil(
        allowanceMin -
        Number.EPSILON * allowanceMin
      );

      const extraMax = Math.ceil(
        allowanceMax -
        Number.EPSILON * allowanceMax
      );

      const additional = {
        min: extraMin,
        max: extraMax
      };

      // ===========================================
      // 10. TOTAL BRICKS INCLUDING WASTAGE
      // ===========================================

      const total = {
        min: required.min + extraMin,
        max: required.max + extraMax
      };

      // Match the original safe integer checks.

      if (
        !Number.isSafeInteger(required.min) ||
        !Number.isSafeInteger(required.max) ||
        required.min <= 0 ||
        required.max <= 0 ||
        !Number.isSafeInteger(total.min) ||
        !Number.isSafeInteger(total.max)
      ) {
        return errorResult(
          "Brick quantity is outside the supported range."
        );
      }

      // ===========================================
      // 11. CITY BRICK PRICE
      // ===========================================

      const rate = cities[city];

      // ===========================================
      // 12. ESTIMATED BRICK MATERIAL COST
      // ===========================================

      const cost = {
        min: total.min * rate.min,
        max: total.max * rate.max
      };

      // ===========================================
      // 13. FINAL MCP RESPONSE
      // ===========================================

      const result = {
        currency: "PKR",

        priceReference: "September 2026",

        city,

        area,

        unit,

        equivalentMarla: marla,

        buildingType: building,

        requiredBricks: required,

        wastagePercent,

        additionalBricks: additional,

        totalBricksIncludingWastage: total,

        pricePerBrickPKR: rate,

        estimatedBrickCostPKR: cost,

        quantityMethod: quantity.method,

        quantityBasis: quantity.basis,

        notes: [
          "A-Class brick prices are indicative September 2026 rates.",
          "Quantities are planning estimates, not measured bills of quantities.",
          "5% wastage is added to the minimum quantity and 10% to the maximum, rounded upward.",
          "Single-storey non-reference areas are interpolated between reference sizes or scaled proportionally outside them.",
          "Double-storey calculations use the supplied 5 Marla reference, scaled proportionally for other sizes.",
          "Delivery, labour, mortar and taxes are excluded.",
          "Actual brick requirements depend on house layout, wall sizes, openings and construction plans."
        ]
      };

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    }
  );


// =====================================================
// CONNECT MCP SERVER
// =====================================================

const transport = new StdioServerTransport();

await server.connect(transport);

