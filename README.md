
# Chakor Ventures MCP

**Pakistan Real Estate, Property Investment & Financial Utilities for AI Assistants**

[![npm](https://img.shields.io/npm/v/chakorventures-mcp)](https://www.npmjs.com/package/chakorventures-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/Protocol-MCP-blue)](https://modelcontextprotocol.io)

Chakor Ventures MCP is a Model Context Protocol (MCP) server that provides reusable tools for Pakistan's real estate, property investment, construction planning, financial calculations, postal-code lookup, and publicly available property information.

Developed by [Chakor Ventures](https://chakorventures.com/), it enables MCP-compatible AI assistants to perform structured calculations and retrieve information through standardized tools.

**Current Version:** `1.0.4`  
**Total MCP Tools:** `12`  
**Transport:** `stdio`  
**Runtime:** Node.js  
**Distribution:** npm  
**License:** MIT

The server is designed for:

- Property buyers and sellers
- Real estate investors
- Construction professionals and contractors
- Property consultants and developers
- Financial and property analysts
- AI assistant developers
- Users researching Pakistan's real estate market

The calculation and lookup utilities can be used independently of Chakor Ventures' own properties and development projects.

---

## Features

Chakor Ventures MCP exposes 12 tools across four functional categories.

### 1. Property & Financial Calculators

| MCP Tool | Description |
|---|---|
| `convert_area_units` | Convert between Marla, Kanal, square feet, square yards, acres, and supported area units, including custom Marla sizes. |
| `convert_number_system` | Convert between ones, thousands, lakh, crore, million, and billion. |
| `calculate_property_roi` | Estimate compounded investment growth, nominal return on investment, and inflation-adjusted returns. |
| `estimate_property_tax` | Estimate Pakistan property purchase tax, sale tax, and capital gains tax under the calculator's implemented rules. |
| `estimate_income_tax` | Estimate Pakistan income tax using the supported financial-year rules and taxpayer categories. |

### 2. Construction & Material Estimators

| MCP Tool | Description |
|---|---|
| `estimate_construction_cost` | Estimate residential construction costs using supported city, property size, building configuration, and construction assumptions. |
| `estimate_brick_cost` | Estimate brick quantities, wastage allowances, and material costs based on plot area, city, and building type. |

### 3. Pakistan Postal Code Utilities

| MCP Tool | Description |
|---|---|
| `lookup_pakistan_postal_code` | Look up Pakistan postal codes by supported city and locality using a bundled dataset. |

### 4. Company & Website Information

| MCP Tool | Description |
|---|---|
| `get_company_info` | Retrieve basic information about Chakor Ventures. |
| `get_latest_news` | Retrieve recently published articles from the Chakor Ventures website. |
| `get_chakor_mcp_page` | Retrieve information from the official Chakor Ventures MCP webpage. |
| `search_chakor_website` | Search publicly available website content through supported WordPress search functionality. |

The server combines **8 general-purpose calculators and lookup utilities** with **4 company and website information tools**.

---

## Example Use Cases

AI assistants connected to this MCP server can help users with requests such as:

### Property Area Conversion

- Convert 10 Marla into square feet.
- Convert 1 Kanal into Marla.
- Calculate the equivalent square-yard area of a property.
- Convert land measurements using a custom Marla size.

### Financial Number Conversion

- Convert PKR 14 crore into millions.
- Convert 1.5 billion into crore.
- Convert 250 lakh into crore.

### Property Investment Analysis

- Calculate an illustrative five-year return on a PKR 10 million investment using an assumed 12% annual growth rate.
- Compare nominal and inflation-adjusted investment returns.
- Calculate projected property value using supplied assumptions.

### Property Tax Estimation

- Estimate property purchase taxes under the implemented calculator model.
- Estimate property sale-related taxes.
- Estimate capital gains tax based on the supported acquisition and sale rules.

### Income Tax Estimation

- Estimate annual income tax for a supported tax year.
- Calculate estimated monthly income tax.
- Examine income tax calculations based on the supported income classifications.

### Construction Cost Estimation

- Estimate the construction cost of a residential house in Lahore.
- Estimate residential building costs using supported city and area inputs.
- Compare supported construction configurations.

### House Brick Cost Estimation

- Estimate bricks required for a 5 Marla single-storey house.
- Estimate brick costs for a 6.5 Marla house in Lahore.
- Compare material cost ranges for supported Pakistani cities.
- Estimate the additional bricks required for wastage.

### Postal Code Lookup

- Find postal codes for supported Pakistani localities.
- Search the bundled postal-code reference data.

### Website Information

- Retrieve recent real estate articles from Chakor Ventures.
- Search public website content.
- Retrieve basic company information.

---

## Installation

### Requirements

Before installing, ensure your system has:

- Node.js
- npm
- An MCP-compatible client supporting local `stdio` servers
- An internet connection for initial npm installation and web-backed tools

### Option A — Run Directly with npx

Run the published package without a separate global installation:

```bash
npx -y chakorventures-mcp@1.0.4
```

This launches the MCP server using standard input/output transport.

The server waits for requests from an MCP-compatible client.

### Option B — Install Globally

Install the published package:

```bash
npm install -g chakorventures-mcp@1.0.4
```

Launch the MCP server:

```bash
chakorventures-mcp
```

On Windows PowerShell, the executable may also be launched using:

```powershell
chakorventures-mcp.cmd
```

### Verify the Installed Version

Check the latest published npm version:

```bash
npm view chakorventures-mcp version
```

Expected for this release:

```text
1.0.4
```

Check the globally installed version:

```bash
npm list -g chakorventures-mcp
```

---

## MCP Client Configuration

Chakor Ventures MCP currently supports the `stdio` transport.

The examples below apply to MCP-compatible clients that support an `mcpServers` JSON configuration structure.

Configuration locations and formats vary between applications.

### Windows — Recommended npx Configuration

```json
{
  "mcpServers": {
    "chakorventures": {
      "command": "npx.cmd",
      "args": [
        "-y",
        "chakorventures-mcp@1.0.4"
      ]
    }
  }
}
```

This configuration runs the published npm package directly.

### macOS / Linux — npx Configuration

```json
{
  "mcpServers": {
    "chakorventures": {
      "command": "npx",
      "args": [
        "-y",
        "chakorventures-mcp@1.0.4"
      ]
    }
  }
}
```

### Windows — Global Installation Configuration

If the package is installed globally, use:

```json
{
  "mcpServers": {
    "chakorventures": {
      "command": "chakorventures-mcp.cmd",
      "args": []
    }
  }
}
```

The global npm executable must be available on the system PATH.

### Connecting an MCP Client

1. Install or configure the published MCP package.
2. Add the appropriate configuration to your MCP-compatible application.
3. Restart or reconnect the MCP client as required.
4. Open the application's MCP tool discovery interface.
5. Confirm that all 12 tools are available.
6. Execute a calculator or lookup tool to verify the connection.

For security and reliability, use the documented configuration mechanism of your specific MCP client.

---

## Testing with MCP Inspector

The MCP Inspector can be used to inspect, connect to, and execute MCP tools.

Launch Inspector against the published npm package:

```bash
npx @modelcontextprotocol/inspector npx -y chakorventures-mcp@1.0.4
```

Follow the local URL displayed in the terminal.

Inside MCP Inspector:

1. Connect to the server.
2. Open the Tools section.
3. List available tools.
4. Verify that 12 tools are registered.
5. Select a tool and provide valid input.
6. Execute it and inspect the returned response.

### Example: House Brick Calculator

Tool:

```text
estimate_brick_cost
```

Example input:

```json
{
  "area": 6.5,
  "unit": "marla",
  "city": "lahore",
  "building": "single"
}
```

Illustrative expected result under the release's reference data:

| Calculation | Result |
|---|---|
| Base bricks | 18,200–26,000 |
| Bricks including wastage | 19,110–28,600 |
| Lahore reference price | PKR 16–19 per brick |
| Estimated brick material cost | PKR 305,760–543,400 |

The example is based on the calculator's published reference assumptions, not a live construction-material quotation.

Actual market costs may vary.

---

## Technical Architecture

| Component | Technology |
|---|---|
| Runtime | Node.js |
| Protocol | Model Context Protocol |
| MCP SDK | `@modelcontextprotocol/sdk` |
| Transport | Standard input/output (`stdio`) |
| Schema validation | Zod |
| Programming language | JavaScript (ES modules) |
| Public website retrieval | WordPress REST API |
| Postal-code reference | Bundled `postal-codes.json` dataset |
| Distribution | npm |
| Source control | GitHub |

### Main Project Files

```text
chakorventures-mcp/
├── index.js
├── package.json
├── package-lock.json
├── postal-codes.json
├── server.json
├── README.md
└── LICENSE
```

Some local installations may also include development utilities and other supporting files.

### How It Works

An MCP-compatible AI application connects to the server through `stdio`.

The server registers tools with names, descriptions, and input schemas.

When an AI client invokes a supported tool:

1. The request is received through the MCP transport.
2. The tool validates the provided inputs.
3. The relevant calculation, lookup, or website retrieval is performed.
4. A structured result is returned through MCP.
5. The AI client can use the result to answer the user's request.

The general-purpose calculators operate locally using the implemented formulas and reference data.

Website-backed tools may require outbound HTTPS requests.

---

## Data Sources, Calculation Methods & Limitations

### Area Conversions

Area conversion results depend on the selected measurement units and applicable Marla size.

Marla measurements can vary by region and convention. Users should verify the measurement standard relevant to their property.

### Property ROI

ROI calculations use the assumptions and methodology implemented by the selected tool.

Projected returns are estimates, not guarantees.

Real estate investments involve market risk, transaction costs, maintenance expenses, taxes, and liquidity considerations.

### Construction Cost Estimation

Construction estimates use the calculator's implemented pricing assumptions and supported inputs.

These estimates are not live contractor quotations.

Actual construction costs depend on:

- Location
- Land and building configuration
- Structural requirements
- Materials and finishing specifications
- Labour costs
- Project duration
- Market conditions

A professional construction estimate may require architectural drawings, structural designs, and a detailed bill of quantities.

### House Brick Cost Estimation

The brick estimator uses reference brick-price ranges and estimated brick requirements.

The current model supports:

- Plot area
- Marla and Kanal input units
- Supported Pakistani cities
- Single-storey and double-storey building options
- Estimated brick quantities
- Additional bricks for wastage
- Estimated material cost ranges

The estimate does not necessarily include transport, labour, mortar, taxes, or site-specific construction requirements.

Brick sizes, masonry design, and market prices can materially affect actual requirements.

### Property Tax Estimation

The property tax calculator provides illustrative calculations using the rules implemented in this software.

It may include calculations relating to:

- Property acquisition or purchase taxes
- Property sale or transfer taxes
- Capital gains tax

The implemented website-based methodology should not be interpreted as independent confirmation of current Federal Board of Revenue requirements.

Tax rates, acquisition dates, taxpayer classifications, exemptions, and legal treatment can change.

Users should verify applicable requirements against official sources or consult qualified tax professionals.

### Income Tax Estimation

The income tax calculator uses the financial-year rules and income classifications implemented in the released tool.

Tax obligations depend on current legislation, exemptions, income categories, and taxpayer circumstances.

Results should be treated as estimates only.

### Postal Codes

Postal-code results depend on the accuracy and coverage of the bundled dataset.

The source dataset may be incomplete, contain outdated entries, or require future revisions.

For official postal correspondence, confirm the relevant postal code with Pakistan Post.

### Website Information

Company news and public website content are retrieved from Chakor Ventures' publicly available sources.

Availability depends on the website, network connectivity, and supported WordPress endpoints.

---

## Privacy & Security

Chakor Ventures MCP is designed to run as a local `stdio` server.

Calculator inputs are processed by the running server according to the selected tool implementation.

Some tools perform outbound HTTPS requests to retrieve public website information.

Users and application developers should:

- Review the source code before deployment in sensitive environments.
- Use trusted MCP clients.
- Keep Node.js and dependencies updated.
- Review calculator assumptions before making important decisions.
- Avoid submitting confidential information unnecessarily.

Running a local MCP server does not itself create a publicly accessible hosted MCP endpoint.

---

## Release Information

### Version 1.0.4

The current npm release provides 12 MCP tools.

This release includes:

- Property area unit conversion
- Financial number conversion
- Property ROI estimation
- Residential construction cost estimation
- Pakistan postal-code lookup
- Property tax estimation
- Income tax estimation
- House brick cost estimation
- Four company and website information tools

The npm release has been published and the server metadata submitted successfully to the official MCP Registry.

**Official MCP Registry name:**

```text
io.github.SyedaMahaZaidi/chakorventures-mcp
```

**npm package:**

```text
chakorventures-mcp
```

**npm version:**

```text
1.0.4
```

### GitHub MCP Registry

The GitHub MCP Registry is a separately curated directory.

Publication in npm or the official MCP Registry does not automatically constitute inclusion in the GitHub MCP Registry.

GitHub directory inclusion is subject to its separate review process.

---

## Official Website & Resources

**Official Website:**  
https://chakorventures.com/

**MCP Information Page:**  
https://chakorventures.com/mcp/

**npm Package:**  
https://www.npmjs.com/package/chakorventures-mcp

**GitHub Repository:**  
https://github.com/SyedaMahaZaidi/chakorventures-mcp

**Official MCP Registry:**  
https://registry.modelcontextprotocol.io/

**MCP Documentation:**  
https://modelcontextprotocol.io/

---

## Development & Contributions

Development and maintenance are managed through the project's GitHub repository.

Users and developers may report problems, suggest improvements, and propose enhancements through the repository's available contribution channels.

Potential future improvements include:

- Expanded Pakistan property reference data
- Additional construction estimators
- Updated tax-year calculation models
- Additional financial analysis utilities
- Broader property-market integrations
- Improved validation and error handling
- Optional remotely hosted MCP transport

Future functionality is not included in v1.0.4 unless separately released and documented.

---

## License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for the complete license terms.

Copyright © 2026 Chakor Ventures.

---

## Disclaimer

Chakor Ventures MCP provides general information, reference data, and illustrative calculations.

It does not provide professional financial, investment, tax, legal, engineering, construction, or property valuation advice.

All results depend on the inputs, reference data, and calculation methodologies used.

Users are responsible for independently verifying critical information before making financial, legal, investment, tax, property, or construction decisions.

Chakor Ventures does not guarantee the accuracy, completeness, or suitability of estimates for a particular transaction or project.
