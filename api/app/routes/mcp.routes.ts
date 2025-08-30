// import { Router, type Request, type Response } from "express";
// import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";
// import { createMCPServer } from "../mcp/server";

// const router: Router = Router();
// const mcpServer = createMCPServer();

// router.all("/mcp", async (req: Request, res: Response) => {
//   try {
//     const transport = new StreamableHTTPServerTransport(req, res);
//     await mcpServer.connect(transport);
//   } catch (error) {
//     console.error("MCP connection error:", error);
//     if (!res.headersSent) {
//       res.status(500).json({ error: "MCP server error" });
//     }
//   }
// });

// export default router;