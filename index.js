
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "chakorventures-mcp",
  version: "1.0.0"
});

server.registerTool(
  "get_company_info",
  {
    description: "Get basic information about Chakor Ventures"
  },
  async () => ({
    content: [{
      type: "text",
      text: "Chakor Ventures is a real estate company in Pakistan."
    }]
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
