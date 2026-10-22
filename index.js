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

// Existing company information tool
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

// New WordPress news tool
server.registerTool(
  "get_latest_news",
  {
    description: "Get the latest published real estate news from the Chakor Ventures website"
  },
  async () => {
    try {
      const response = await fetch(
        "https://chakorventures.com/wp-json/wp/v2/posts?per_page=5"
      );

      if (!response.ok) {
        throw new Error(`WordPress API returned ${response.status}`);
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


server.registerTool(
    "get_chakor_mcp_page",
    {
      description: "Retrieve official Chakor Ventures MCP page information from the company website"
    },
    async () => {
      try {
        const response = await fetch(
          "https://chakorventures.com/wp-json/wp/v2/pages?slug=mcp"
        );
  
        if (!response.ok) {
          throw new Error(`WordPress API returned ${response.status}`);
        }
  
        const pages = await response.json();
  
        if (!pages.length) {
          throw new Error("MCP page not found in WordPress API");
        }
  
        const page = pages[0];
  
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              title: page.title.rendered,
              url: page.link,
              content: convert(page.content.rendered, {
                wordwrap: false,
                selectors: [
                  { selector: "a", options: { linkBrackets: false } }
                ]
              })
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
  

  server.registerTool(
    "search_chakor_website",
    {
      description: "Search public Chakor Ventures WordPress pages and articles",
      inputSchema: {
        query: z.string().min(2).describe("Search keyword")
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
          throw new Error(`WordPress API returned ${response.status}`);
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
  


  server.registerTool(
    "convert_number_system",
    {
      description:
        "Convert numerical values between ones, thousands, lakhs, crores, millions, and billions. Useful for Pakistani property prices and international financial figures.",
      inputSchema: {
        value: z.number().finite().describe("Number to convert"),
        from: z.enum([
          "ones", "thousand", "lakh", "crore", "million", "billion"
        ]),
        to: z.enum([
          "ones", "thousand", "lakh", "crore", "million", "billion"
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
            explanation: `${value} ${from} = ${result} ${to}`
          }, null, 2)
        }]
      };
    }
  );
 

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
      const nominalFV = investment *
        Math.pow(1 + annualReturn / 100, years);
  
      const realFV = nominalFV /
        Math.pow(1 + inflationRate / 100, years);
  
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
  
        futureValueNominal: Number(nominalFV.toFixed(2)),
  
        futureValueInTodaysMoney: Number(realFV.toFixed(2)),
  
        nominalROIPercent: Number(nominalROI.toFixed(2)),
  
        inflationAdjustedROIPercent: Number(realROI.toFixed(2)),
  
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
  

  server.registerTool(
    "estimate_construction_cost",
    {
      description:
        "Estimate house construction costs in Pakistan using covered area, construction type, material cost, labour cost, and contingency. Uses user-supplied rates rather than live market quotations.",
      inputSchema: {
        city: z.string().min(2)
          .describe("City, e.g. Islamabad, Lahore, Karachi"),
  
        coveredArea: z.number().positive()
          .describe("Total covered area in square feet"),
  
        constructionType: z.enum([
          "grey_structure", "complete"
        ]),
  
        constructionMode: z.enum([
          "with_material", "without_material"
        ]),
  
        materialRatePerSqft: z.number().nonnegative()
          .describe("Estimated material cost per sq ft in PKR"),
  
        labourRatePerSqft: z.number().nonnegative()
          .describe("Estimated labour cost per sq ft in PKR"),
  
        contingencyPercent: z.number()
          .min(0).max(100).default(10)
      }
    },
  
    async ({
      city,
      coveredArea,
      constructionType,
      constructionMode,
      materialRatePerSqft,
      labourRatePerSqft,
      contingencyPercent
    }) => {
      const materialCost =
        constructionMode === "with_material"
          ? coveredArea * materialRatePerSqft
          : 0;
  
      const labourCost =
        coveredArea * labourRatePerSqft;
  
      const subtotal = materialCost + labourCost;
  
      const contingency =
        subtotal * contingencyPercent / 100;
  
      const total = subtotal + contingency;
  
      const result = {
        city,
        constructionType,
        constructionMode,
        currency: "PKR",
        coveredAreaSqft: coveredArea,
        materialCost,
        labourCost,
        subtotal,
        contingencyPercent,
        contingency,
        estimatedTotalCost: total,
        estimatedCostPerSqft: total / coveredArea,
        note:
          "Uses supplied rates. City and construction type are descriptive; they do not automatically change the calculation. Rates must correspond to the selected construction type. This is an indicative estimate, not a contractor quotation."
      };
  
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    }
  );
  

  
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
        "Find Pakistan postal codes by city and optional locality using a verified local dataset. Returns matching locations and identifies when no record is available.",
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
      const areaQuery = area ? normalize(area) : "";
  
      const matches = pakistanPostalCodes.filter(item => {
        const cityMatch =
          normalize(item.city) === cityQuery;
  
        const areaMatch =
          !areaQuery ||
          normalize(item.area).includes(areaQuery);
  
        return cityMatch && areaMatch;
      });
  
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
              "Limited verified sample dataset. Not yet a complete Pakistan postal code directory.",
            note: matches.length
              ? "Verify the precise locality before mailing."
              : "No matching record in the local dataset. This does not mean the locality has no postal code."
          }, null, 2)
        }]
      };
    }
  );
  

  server.registerTool(
    "estimate_property_tax",
    {
      description:
        "Estimate Pakistan property purchase tax (236K), sale tax (236C), and optional capital gains tax using explicitly provided rates. Does not automatically determine current legal rates.",
      inputSchema: {
        propertyValue: z.number().nonnegative()
          .describe("Property value in PKR"),
  
        transaction: z.enum(["purchase", "sale"])
          .describe("Purchase or sale"),
  
        taxpayerStatus: z.enum([
          "filer", "late_filer", "non_filer"
        ]),
  
        overseasPakistani: z.boolean().default(false),
  
        propertyType: z.enum([
          "open_plot",
          "constructed_building",
          "flat"
        ]).default("open_plot"),
  
        advanceTaxRatePercent: z.number()
          .min(0).max(100)
          .describe("Applicable verified 236K or 236C rate in percent"),
  
        purchasePrice: z.number()
          .nonnegative().optional(),
  
        salePrice: z.number()
          .nonnegative().optional(),
  
        capitalGainsTaxRatePercent: z.number()
          .min(0).max(100).optional(),
  
        taxYear: z.string()
          .default("2026-27")
      }
    },
  
    async (input) => {
      const {
        propertyValue,
        transaction,
        taxpayerStatus,
        overseasPakistani,
        propertyType,
        advanceTaxRatePercent,
        purchasePrice,
        salePrice,
        capitalGainsTaxRatePercent,
        taxYear
      } = input;
  
      const round = n => Math.round(n * 100) / 100;
  
      const section = transaction === "purchase"
        ? "236K"
        : "236C";
  
      const advanceTax = round(
        propertyValue * advanceTaxRatePercent / 100
      );
  
      let capitalGain = null;
      let capitalGainsTax = null;
  
      if (
        purchasePrice !== undefined &&
        salePrice !== undefined
      ) {
        capitalGain = Math.max(
          0,
          salePrice - purchasePrice
        );
  
        if (
          transaction === "sale" &&
          capitalGainsTaxRatePercent !== undefined
        ) {
          capitalGainsTax = round(
            capitalGain *
            capitalGainsTaxRatePercent / 100
          );
        }
      }
  
      const totalEstimatedTax =
        advanceTax +
        (capitalGainsTax ?? 0);
  
      const result = {
        currency: "PKR",
        taxYear,
        transaction,
        section,
        taxpayerStatus,
        overseasPakistani,
        propertyType,
  
        propertyValue,
        advanceTaxRatePercent,
        advanceTax,
  
        capitalGain,
        capitalGainsTaxRatePercent:
          capitalGainsTaxRatePercent ?? null,
        capitalGainsTax,
  
        totalOfCalculatedTaxes:
          round(totalEstimatedTax),
  
        isCompleteTaxEstimate: false,
  
        note:
          "Rates must be verified against applicable FBR rules for the transaction date and taxpayer. No automatic overseas exemption, filer adjustment, holding-period calculation, or CGT eligibility determination is performed. Other taxes and duties may apply.",
  
        source:
          "https://www.fbr.gov.pk/"
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
  
      const slabs = taxYear === "2025-26"
        ? [
            { limit: 600000, base: 0, threshold: 0, rate: 0 },
            { limit: 1200000, base: 0, threshold: 600000, rate: 0.01 },
            { limit: 2200000, base: 6000, threshold: 1200000, rate: 0.11 },
            { limit: 3200000, base: 116000, threshold: 2200000, rate: 0.23 },
            { limit: 4100000, base: 346000, threshold: 3200000, rate: 0.30 },
            { limit: Infinity, base: 616000, threshold: 4100000, rate: 0.35 }
          ]
        : [
            { limit: 600000, base: 0, threshold: 0, rate: 0 },
            { limit: 1200000, base: 0, threshold: 600000, rate: 0.01 },
            { limit: 2200000, base: 6000, threshold: 1200000, rate: 0.11 },
            { limit: 3200000, base: 116000, threshold: 2200000, rate: 0.20 },
            { limit: 4100000, base: 316000, threshold: 3200000, rate: 0.25 },
            { limit: 5600000, base: 541000, threshold: 4100000, rate: 0.29 },
            { limit: 7000000, base: 976000, threshold: 5600000, rate: 0.32 },
            { limit: Infinity, base: 1424000, threshold: 7000000, rate: 0.35 }
          ];
  
      const slab = slabs.find(s => annualSalary <= s.limit);
  
      const baseTax = Math.max(
        0,
        slab.base +
        (annualSalary - slab.threshold) * slab.rate
      );
  
      const surchargeApplied =
        taxYear === "2025-26" &&
        annualSalary > 10000000;
  
      const surchargeAmount =
        surchargeApplied ? baseTax * 0.09 : 0;
  
      const annualTax = baseTax + surchargeAmount;
      const monthlyTax = annualTax / 12;
  
      const round = value => Number(value.toFixed(2));
  
      const result = {
        currency: "PKR",
        taxYear,
        category: "Salaried Individual",
  
        monthlyGrossSalary: round(monthlySalary),
        annualGrossSalary: round(annualSalary),
  
        applicableMarginalRatePercent: slab.rate * 100,
  
        annualTaxBeforeSurcharge: round(baseTax),
        surchargeApplied,
        surchargeAmount: round(surchargeAmount),
  
        annualTax: round(annualTax),
        monthlyTax: round(monthlyTax),
  
        monthlySalaryAfterTax: round(
          Math.max(0, monthlySalary - monthlyTax)
        ),
  
        annualSalaryAfterTax: round(
          Math.max(0, annualSalary - annualTax)
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
  
// Connect MCP server
const transport = new StdioServerTransport();
await server.connect(transport);
