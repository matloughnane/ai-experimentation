# Express API with MCP Integration

This is an Express.js API server with Model Context Protocol (MCP) integration, built with TypeScript. The server provides both standard REST endpoints and MCP-compatible endpoints for AI tool integration.

## Features

- 🚀 Express.js REST API with TypeScript
- 🔌 Model Context Protocol (MCP) server integration
- 🛠️ Two example MCP tools: `get-base` and `get-ferries`
- 🏥 Health check endpoints
- 🔄 Session management for MCP connections
- ⚡ Hot reload development setup

## Project Structure

```
api/
├── app/
│   ├── controllers/
│   │   └── healthcheck.controller.ts    # Health check logic
│   ├── mcp/
│   │   └── index.ts                     # MCP server setup and tools
│   ├── routes/
│   │   ├── healthcheck.routes.ts        # Health check routes
│   │   └── mcp.routes.ts                # MCP routes
│   └── index.ts                         # Express app configuration
├── server.ts                            # Server entry point
├── package.json                         # Dependencies and scripts
└── tsconfig.json                        # TypeScript configuration
```

## Setup Instructions

### 1. Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### 2. Install Dependencies

```bash
cd api
npm install
# or
pnpm install
```

### 3. Environment Configuration

Create a `.env` file in the `api/` directory (optional):

```bash
# Optional environment variables
PORT=3000
TITLE="Express API with MCP"
```

### 4. Development Server

Start the development server with hot reload:

```bash
npm run dev
# or
pnpm dev
```

The server will start on `http://localhost:3000` (or your configured PORT).

### 5. Production Build

To build and run for production:

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## API Endpoints

### REST Endpoints

- `GET /` - Health check (root endpoint)
- `GET /healthcheck` - Detailed health check with uptime and timestamp

### MCP Endpoints

- `POST /mcp` - MCP protocol endpoint for tool execution
- `GET /mcp` - Server-sent events for MCP notifications
- `DELETE /mcp` - Session termination

## Available MCP Tools

The server provides two example MCP tools:

1. **`get-base`** - Returns a simple base response
2. **`get-ferries`** - Fetches today's ferry schedules from Arranmore Ferry API

## Testing with MCP Inspector

The MCP Inspector is a powerful tool for testing and debugging MCP servers. Here's how to use it with this API:

### 1. Install MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

### 2. Start Your API Server

Make sure your API server is running:

```bash
cd api
npm run dev
```

The server should be running on `http://localhost:3000`.

### 3. Configure MCP Inspector

When the MCP Inspector opens in your browser, you'll need to configure it to connect to your API:

1. **Transport Type**: Select "HTTP"
2. **Server URL**: Enter `http://localhost:3000/mcp`
3. **Connect**: Click the connect button

### 4. Test Available Tools

Once connected, you should see the available tools in the inspector:

#### Testing `get-base` Tool
1. Select the `get-base` tool from the tools list
2. Click "Execute" (no parameters needed)
3. You should see the response: "This is the base request"

#### Testing `get-ferries` Tool
1. Select the `get-ferries` tool from the tools list
2. Click "Execute" (no parameters needed)
3. You should see today's ferry schedules for Arranmore Island

### 5. Inspector Features

The MCP Inspector provides several useful features for testing:

- **Tools Tab**: View and execute all available tools
- **Prompts Tab**: View available prompts (if any)
- **Resources Tab**: View available resources (if any)
- **Logs Tab**: See detailed communication logs between inspector and server
- **Raw Messages**: View the actual MCP protocol messages being exchanged

### 6. Debugging Tips

- **Check Logs**: Use the Logs tab to see detailed request/response information
- **Network Issues**: Ensure your API server is running and accessible
- **CORS**: The server includes basic CORS handling, but you may need to adjust for production
- **Session Management**: Each connection creates a new session with a unique ID

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   Error: listen EADDRINUSE: address already in use :::3000
   ```
   - Change the PORT in your `.env` file or kill the process using port 3000

2. **MCP Inspector Can't Connect**
   - Verify the API server is running on the correct port
   - Check that the URL in the inspector matches your server URL
   - Ensure no firewall is blocking the connection

3. **TypeScript Compilation Errors**
   ```bash
   npm run type-check
   ```
   - Run this command to check for TypeScript errors without running the server

### Development Commands

```bash
# Type checking only
npm run type-check

# Build for production
npm run build

# Start production server
npm start

# Development with hot reload
npm run dev
```

## MCP Protocol Details

This server implements the Model Context Protocol using:

- **Transport**: Streamable HTTP with session management
- **Session Management**: UUID-based session IDs with automatic cleanup
- **Tools**: Async tool execution with structured responses
- **Error Handling**: Proper MCP error response formatting

The server supports:
- Multiple concurrent sessions
- Session persistence across requests
- Proper cleanup on session termination
- Standard MCP initialization flow

## Next Steps

To extend this API:

1. **Add More Tools**: Create additional MCP tools in `/app/mcp/index.ts`
2. **Add Resources**: Implement MCP resources for data access
3. **Add Prompts**: Create reusable MCP prompts
4. **Database Integration**: Add database connectivity for persistent data
5. **Authentication**: Implement authentication for production use

## License

ISC
