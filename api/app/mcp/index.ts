import { Router, Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";

// Store transports for each session type
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

const mcpRouter: Router = Router();

// ... set up server resources, tools, and prompts ...
const server = new McpServer({
  name: "example-mcp-server",
  version: "1.0.0",
});

server.tool("get-base", "Get the base mcp request", {}, async ({}) => {
  return {
    content: [
      {
        type: "text",
        text: "This is the base request",
      },
    ],
  };
});

server.tool(
  "get-ferries",
  "Get todays ferries from the Arranmore Ferry",
  {},
  async ({}) => {
    const ferries = await fetch(
      "https://api.thearranmoreferry.com/v2/timetables"
    );
    const date = new Date();
    const month = date.getMonth();
    // console.error(`month: ${month}`);
    const day = date.getDay();
    // console.error(`day: ${day}`);
    const data = (await ferries.json()) as any;
    // console.error(data.data);
    const todayFerries = data.data.filter(
      (ferry: any) => ferry.months.includes(month) && ferry.days.includes(day)
    );
    // console.error(todayFerries);
    return {
      content: [
        {
          type: "text",
          text: `This is todays ferries for Departing Arranmore Island: ${todayFerries
            .filter((ferry: any) => ferry.journey === "dt")
            .map((ferry: any) => ferry.time)
            .sort((a: number, b: number) => a - b)
            .join(", ")}`,
        },
        {
          type: "text",
          text: `This is todays ferries for Departing Burtonport: ${todayFerries
            .filter((ferry: any) => ferry.journey === "dm")
            .map((ferry: any) => ferry.time)
            .sort((a: number, b: number) => a - b)
            .join(", ")}`,
        },
      ],
    };
  }
);

// Modern Streamable HTTP endpoint
mcpRouter.post("/", async (req, res) => {
  // Check for existing session ID
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId: string) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      },
      // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
      // locally, make sure to set:
      // enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    // Connect to the MCP server
    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
mcpRouter.get("/", handleSessionRequest);

// Handle DELETE requests for session termination
mcpRouter.delete("/", handleSessionRequest);

export default mcpRouter;

// process.on("SIGINT", async () => {
//   console.log("Shutting down MCP server...");
//   await server.cleanup();
//   process.exit(0);
// });
