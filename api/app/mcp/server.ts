// import { Server } from "@modelcontextprotocol/sdk/server/index";
// import {
//   CallToolRequestSchema,
//   ListToolsRequestSchema,
// } from "@modelcontextprotocol/sdk/types";

// let serverStartTime: Date;

// export const createMCPServer = () => {
//   serverStartTime = new Date();

//   const server = new Server(
//     {
//       name: "express-uptime-server",
//       version: "1.0.0",
//     },
//     {
//       capabilities: {
//         tools: {},
//       },
//     }
//   );

//   server.setRequestHandler(ListToolsRequestSchema, async () => {
//     return {
//       tools: [
//         {
//           name: "get_server_uptime",
//           description: "Get the amount of time the server has been running",
//           inputSchema: {
//             type: "object",
//             properties: {},
//           },
//         },
//       ],
//     };
//   });

//   server.setRequestHandler(CallToolRequestSchema, async (request) => {
//     switch (request.params.name) {
//       case "get_server_uptime": {
//         const uptimeSeconds = process.uptime();
//         const uptimeMs = Date.now() - serverStartTime.getTime();

//         return {
//           content: [
//             {
//               type: "text",
//               text: JSON.stringify(
//                 {
//                   uptime_seconds: uptimeSeconds,
//                   uptime_milliseconds: uptimeMs,
//                   server_start_time: serverStartTime.toISOString(),
//                   current_time: new Date().toISOString(),
//                   formatted_uptime: formatUptime(uptimeSeconds),
//                 },
//                 null,
//                 2
//               ),
//             },
//           ],
//         };
//       }
//       default:
//         throw new Error(`Unknown tool: ${request.params.name}`);
//     }
//   });

//   return server;
// };

// function formatUptime(seconds: number): string {
//   const days = Math.floor(seconds / 86400);
//   const hours = Math.floor((seconds % 86400) / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
//   const secs = Math.floor(seconds % 60);

//   const parts = [];
//   if (days > 0) parts.push(`${days}d`);
//   if (hours > 0) parts.push(`${hours}h`);
//   if (minutes > 0) parts.push(`${minutes}m`);
//   if (secs > 0) parts.push(`${secs}s`);

//   return parts.join(" ") || "0s";
// }



// THIS IS THE SSE LOGIC
// THIS DOESNT WORK WITH A STREAMABLE MCP SERVER

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  Notification,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  LoggingMessageNotification,
  ToolListChangedNotification,
  JSONRPCNotification,
  JSONRPCError,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "crypto";
import { Request, Response } from "express";

const SESSION_ID_HEADER_NAME = "mcp-session-id";
const JSON_RPC = "2.0";

export class MCPServer {
  server: Server;

  // to support multiple simultaneous connections
  transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  private toolInterval: NodeJS.Timeout | undefined;
  // private getAlertsToolName = "get-alerts";
  // private getForecastToolName = "get-forecast";
  private getUptimeToolName = "get-uptime";

  constructor(server: Server) {
    this.server = server;
    this.setupTools();
  }

  async handleGetRequest(req: Request, res: Response) {
    // if server does not offer an SSE stream at this endpoint.
    // res.status(405).set('Allow', 'POST').send('Method Not Allowed')

    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    if (!sessionId || !this.transports[sessionId]) {
      res
        .status(400)
        .json(
          this.createErrorResponse("Bad Request: invalid session ID or method.")
        );
      return;
    }

    console.log(`Establishing SSE stream for session ${sessionId}`);
    const transport = this.transports[sessionId];
    await transport.handleRequest(req, res);
    await this.streamMessages(transport);

    return;
  }

  async handlePostRequest(req: Request, res: Response) {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    try {
      // reuse existing transport
      if (sessionId && this.transports[sessionId]) {
        transport = this.transports[sessionId];
        await transport.handleRequest(req, res, req.body);
        return;
      }

      // create new transport
      if (!sessionId && this.isInitializeRequest(req.body)) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
        });

        await this.server.connect(transport);
        await transport.handleRequest(req, res, req.body);

        // session ID will only be available (if in not Stateless-Mode)
        // after handling the first request
        const sessionId = transport.sessionId;
        if (sessionId) {
          this.transports[sessionId] = transport;
        }

        return;
      }

      res
        .status(400)
        .json(
          this.createErrorResponse("Bad Request: invalid session ID or method.")
        );
      return;
    } catch (error) {
      console.error("Error handling MCP request:", error);
      res.status(500).json(this.createErrorResponse("Internal server error."));
      return;
    }
  }

  async cleanup() {
    this.toolInterval?.close();
    await this.server.close();
  }

  private setupTools() {
    // Define available tools
    const setToolSchema = () =>
      this.server.setRequestHandler(ListToolsRequestSchema, async () => {
        const getUptimeTool = {
          name: this.getUptimeToolName,
          description: "Get the amount of time the server has been running",
          inputSchema: {
            type: "object",
            properties: {
              state: {
                type: "string",
                description: "Two-letter state code (e.g. CA, NY)",
              },
            },
            required: ["state"],
          },
        };

        return {
          tools: [getUptimeTool],
        };
      });

    setToolSchema();

    // set tools dynamically, changing 5 second
    this.toolInterval = setInterval(async () => {
      setToolSchema();
      // to notify client that the tool changed
      Object.values(this.transports).forEach((transport) => {
        const notification: ToolListChangedNotification = {
          method: "notifications/tools/list_changed",
        };
        this.sendNotification(transport, notification);
      });
    }, 5000);

    // handle tool calls
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request, extra) => {
        const args = request.params.arguments;
        const toolName = request.params.name;
        console.log("Received request for tool with argument:", toolName, args);

        if (!args) {
          console.log("arguments undefined");
          throw new Error("arguments undefined");
        }

        if (!toolName) {
          console.log("tool name undefined");
          throw new Error("tool name undefined");
        }

        if (toolName === this.getUptimeToolName) {
          console.log("get uptime tool");
          const uptimeSeconds = process.uptime();
          console.log("uptimeSeconds", uptimeSeconds);

          if (!uptimeSeconds) {
            console.log("uptimeSeconds is undefined");
            return {
              content: [
                {
                  type: "text",
                  text: "Failed to retrieve alerts data",
                },
              ],
            };
          }

          console.log("uptimeSeconds is defined");
          return {
            content: [
              {
                type: "text",
                text: uptimeSeconds,
              },
            ],
          };
        }

        // if (toolName === this.getForecastToolName) {
        //   const latitude = args.latitude as number;
        //   const longitude = args.longitude as number;
        //   // Get grid point data
        //   const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(
        //     4
        //   )},${longitude.toFixed(4)}`;
        //   const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

        //   if (!pointsData) {
        //     return {
        //       content: [
        //         {
        //           type: "text",
        //           text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
        //         },
        //       ],
        //     };
        //   }

        //   const forecastUrl = pointsData.properties?.forecast;
        //   if (!forecastUrl) {
        //     return {
        //       content: [
        //         {
        //           type: "text",
        //           text: "Failed to get forecast URL from grid point data",
        //         },
        //       ],
        //     };
        //   }

        //   // Get forecast data
        //   const forecastData = await makeNWSRequest<ForecastResponse>(
        //     forecastUrl
        //   );
        //   if (!forecastData) {
        //     return {
        //       content: [
        //         {
        //           type: "text",
        //           text: "Failed to retrieve forecast data",
        //         },
        //       ],
        //     };
        //   }

        //   const periods = forecastData.properties?.periods || [];
        //   if (periods.length === 0) {
        //     return {
        //       content: [
        //         {
        //           type: "text",
        //           text: "No forecast periods available",
        //         },
        //       ],
        //     };
        //   }

        //   // Format forecast periods
        //   const formattedForecast = periods.map((period: ForecastPeriod) =>
        //     [
        //       `${period.name || "Unknown"}:`,
        //       `Temperature: ${period.temperature || "Unknown"}°${
        //         period.temperatureUnit || "F"
        //       }`,
        //       `Wind: ${period.windSpeed || "Unknown"} ${
        //         period.windDirection || ""
        //       }`,
        //       `${period.shortForecast || "No forecast available"}`,
        //       "---",
        //     ].join("\n")
        //   );

        //   const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join(
        //     "\n"
        //   )}`;

        //   return {
        //     content: [
        //       {
        //         type: "text",
        //         text: forecastText,
        //       },
        //     ],
        //   };
        // }

        console.log("tool not found");
        throw new Error("Tool not found");
      }
    );
  }

  // send message streaming message every second
  private async streamMessages(transport: StreamableHTTPServerTransport) {
    try {
      // based on LoggingMessageNotificationSchema to trigger setNotificationHandler on client
      const message: LoggingMessageNotification = {
        method: "notifications/message",
        params: { level: "info", data: "SSE Connection established" },
      };

      this.sendNotification(transport, message);

      let messageCount = 0;

      const interval = setInterval(async () => {
        messageCount++;

        const data = `Message ${messageCount} at ${new Date().toISOString()}`;

        const message: LoggingMessageNotification = {
          method: "notifications/message",
          params: { level: "info", data: data },
        };

        try {
          this.sendNotification(transport, message);

          if (messageCount === 2) {
            clearInterval(interval);

            const message: LoggingMessageNotification = {
              method: "notifications/message",
              params: { level: "info", data: "Streaming complete!" },
            };

            this.sendNotification(transport, message);
          }
        } catch (error) {
          console.error("Error sending message:", error);
          clearInterval(interval);
        }
      }, 1000);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  private async sendNotification(
    transport: StreamableHTTPServerTransport,
    notification: Notification
  ) {
    const rpcNotificaiton: JSONRPCNotification = {
      ...notification,
      jsonrpc: JSON_RPC,
    };
    await transport.send(rpcNotificaiton);
  }

  private createErrorResponse(message: string): JSONRPCError {
    return {
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: message,
      },
      id: randomUUID(),
    };
  }

  private isInitializeRequest(body: any): boolean {
    const isInitial = (data: any) => {
      const result = InitializeRequestSchema.safeParse(data);
      return result.success;
    };
    if (Array.isArray(body)) {
      return body.some((request) => isInitial(request));
    }
    return isInitial(body);
  }
}
