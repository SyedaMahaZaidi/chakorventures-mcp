#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { convert } from "html-to-text";
import { z } from "zod";

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
  
// Connect MCP server
const transport = new StdioServerTransport();
await server.connect(transport);
