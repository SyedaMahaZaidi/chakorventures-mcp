# Chakor Ventures MCP

**Pakistan Real Estate, Property Investment & Financial Utilities for AI Assistants**

Chakor Ventures MCP is a Model Context Protocol (MCP) server providing reusable tools for property calculations, financial analysis, construction cost estimation, postal-code lookup, and publicly available real estate information in Pakistan.

Developed by [Chakor Ventures](https://chakorventures.com/), the project is designed for homebuyers, property investors, real estate professionals, construction planners, developers, and compatible AI applications.

## Features

The server provides reusable utilities that can be applied independently of Chakor Ventures' own properties or developments.

### Real Estate & Financial Utilities

The following seven utilities have been implemented in the development version and are being prepared for the next public release.

| MCP Tool | Function |
|---|---|
| `convert_area_units` | Convert Marla, Kanal, square feet, square yards, and acres with custom Marla sizes. |
| `convert_number_system` | Convert between ones, thousands, lakh, crore, million, and billion. |
| `calculate_property_roi` | Estimate compounded investment growth, nominal ROI, and inflation-adjusted ROI. |
| `estimate_construction_cost` | Estimate construction expenses using covered area, material rates, labour rates, and contingency. |
| `lookup_pakistan_postal_code` | Search Pakistan postal codes by city and locality using a compiled JSON dataset. |
| `estimate_property_tax` | Calculate illustrative property purchase, sale, and capital gains taxes using supplied tax rates. |
| `estimate_income_tax` | Estimate Pakistan salaried income tax using selected FY 2025–26 or FY 2026–27 rules. |

### Company & Website Information

These tools are available in the published v1.0.2 package.

| MCP Tool | Function |
|---|---|
| `get_company_info` | Retrieve basic Chakor Ventures company information. |
| `get_latest_news` | Retrieve recent publicly available articles from the Chakor Ventures WordPress website. |
| `get_chakor_mcp_page` | Retrieve information published on the official Chakor Ventures MCP webpage. |
| `search_chakor_website` | Search public articles, pages, and available inventory through WordPress search. |

## Example Use Cases

Compatible AI assistants can use these tools to help answer questions such as:

- How many square feet are in 20 Marla using a 225-square-foot Marla?
- Convert PKR 14 crore into millions.
- What is the estimated five-year growth of a PKR 10 million investment at an assumed annual return of 12%?
- Estimate construction costs for a 2,000-square-foot house using specified material and labour rates.
- Find the postal code for a locality in Pakistan.
- Calculate an illustrative property transfer tax at a supplied rate.
- Estimate annual and monthly salaried income tax for a selected tax year.

## Installation

**Requirements**

- Node.js
- npm
- An MCP-compatible client that supports stdio servers

The currently published npm package is version `1.0.2`. It contains the four company and WordPress information tools. The seven additional utilities will become publicly available after the next release.

Install the current published package:

```bash
npm install -g chakorventures-mcp@1.0.2
```

Launch the server:

```bash
chakorventures-mcp
```

The server uses the Model Context Protocol standard input/output (stdio) transport.

## Example MCP Client Configuration

For Windows, after globally installing the package:

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

This example applies to MCP clients supporting the `mcpServers` configuration format. Configuration locations and formats differ between clients.

After connecting, the client can discover and execute the tools exposed by the installed server version.

## Technical Architecture

- **Runtime:** Node.js
- **Protocol:** Model Context Protocol
- **SDK:** `@modelcontextprotocol/sdk`
- **Transport:** stdio
- **Input validation:** Zod
- **Content retrieval:** WordPress REST API
- **Postal-code source:** JSON dataset compiled from Chakor Ventures' published CSV

The general-purpose calculation tools run locally in the MCP server. WordPress-backed tools retrieve public content over HTTPS.

## Data Sources & Accuracy

The server uses a combination of calculation formulas, user-supplied inputs, a compiled postal-code dataset, and publicly available WordPress content.

Construction cost estimates use rates supplied by the user and are not live contractor quotations.

ROI projections assume the compounding methodology described by the tool and do not automatically account for all property ownership costs.

Property tax and income tax functionality is intended for informational estimates. Applicable laws, rates, taxpayer classifications, exemptions, and assessment rules must be verified against official tax sources before relying on results.

Postal-code coverage depends on the imported dataset, which may be incomplete or require updates.

## Official Website & Resources

- **Chakor Ventures:** https://chakorventures.com/
- **MCP Information:** https://chakorventures.com/mcp/
- **npm Package:** https://www.npmjs.com/package/chakorventures-mcp
- **MCP Registry:** https://registry.modelcontextprotocol.io/v0.1/servers?search=chakorventures-mcp
- **GitHub Repository:** https://github.com/SyedaMahaZaidi/chakorventures-mcp

## Development Status

The published release is v1.0.2.

An expanded development version includes seven additional general-purpose utilities. These are being tested and documented before a new npm and MCP Registry release.

## License

A license file will be added after approval of the project's open-source licensing terms by Chakor Ventures.

## Disclaimer

This software provides information and illustrative calculations. It does not constitute financial, tax, legal, construction, or investment advice. Users should verify important decisions against official sources and qualified professionals.

Copyright © Chakor Ventures.
