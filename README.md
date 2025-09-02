# API Experimentation

A small repo demo-ing different AI methodologies and techniques for connecting to existing express APIs.

# Express API with MCP Server - `./api`

This is an Express.js API server with Model Context Protocol (MCP) integration, built with TypeScript. The server provides both standard REST endpoints and MCP-compatible endpoints for AI tool integration.

- Express.js REST API with TypeScript
- Model Context Protocol (MCP) server integration
- Two example MCP tools: `get-base` and `get-ferries`
- Health check endpoints
- Session management for MCP connections
- Hot reload development setup

## Setting Up the API

Create a `.env` file in the `api/` directory (optional):

```bash
# Optional environment variables
PORT=3001
TITLE="Express API with MCP"
```
Start the development server with hot reload:

```bash
pnpm i
pnpm dev
```

The API will be available at `http://localhost:<PORT>`

## Testing the API - MCP Endpoints

```bash
npx @modelcontextprotocol/inspector
```

Configure MCP Inspector

When the MCP Inspector opens in your browser, you'll need to configure it to connect to your API:

1. **Transport Type**: Select "HTTP"
2. **Server URL**: Enter `http://localhost:<PORT>/mcp`
3. **Connect**: Click the connect button

# CLI Client with MCP Server - `./client-cli`

A command-line interface client for interacting with MCP (Model Context Protocol) servers using the `mcp-use` library and Anthropic's Claude model. This CLI demonstrates how to connect to MCP servers and create an interactive chat interface in the terminal.

- Interactive terminal chat interface with Claude Sonnet 4
- MCP server integration via HTTP
- Real-time prompt processing through MCP agent
- Error handling and graceful connection management
- Environment-based configuration

## Setting Up the CLI Client

Create a `.env` file in the `client-cli/` directory:

```bash
MCP_URL=http://localhost:3001/mcp
ANTHROPIC_API=your_anthropic_api_key_here
```

Install dependencies:

```bash
cd client-cli
pnpm install
```

## Running the CLI Client

1. Start the MCP server (see `./api` section above)

2. Run the CLI client:
   ```bash
   npx tsx app.ts
   ```

3. Start chatting! Type your prompts and press Enter. The agent will process your request through the MCP server and return Claude's response.

4. Type `exit` to quit the application.

## Example CLI Session

```
MCP CLI Client - Type your prompts below (type 'exit' to quit):
============================================================

> what tools are available?

Response:
----------------------------------------
18:26:48 [mcp-use] info: 🚀 Initializing MCP agent and connecting to services...
18:26:48 [mcp-use] info: 🔌 Found 0 existing sessions
18:26:48 [mcp-use] info: 🔄 No active sessions found, creating new ones...
18:26:49 [mcp-use] info: ✅ Created 1 new sessions
18:26:49 [mcp-use] info: 🛠️ Created 2 LangChain tools from client
18:26:49 [mcp-use] info: 🧰 Found 2 tools across all connectors
18:26:49 [mcp-use] info: ✨ Agent initialization complete
18:26:49 [mcp-use] info: 💬 Received query: 'what tools are available?'
18:26:49 [mcp-use] info: 🏁 Starting agent execution with max_steps=30
18:26:49 [mcp-use] info: 👣 Step 1/30
18:26:52 [mcp-use] info: ✅ Agent finished at step 1
18:26:52 [mcp-use] info: 🎉 Agent execution complete
[
  {
    "index": 0,
    "type": "text",
    "text": "Based on the available tools, I have access to the following:\n\n1. **get-base**: Get the base mcp request\n   - No parameters required\n\n2. **get-ferries**: Get todays ferries from the Arranmore Ferry\n   - No parameters required\n\nThese tools appear to be related to ferry services, specifically for the Arranmore Ferry. The first tool seems to provide basic MCP (Message Control Protocol) request information, while the second provides today's ferry schedule information for the Arranmore Ferry service.\n\nWould you like me to use either of these tools to get information for you?"
  }
]

> exit
```

# Web Client with MCP Server - `./client-web`

A Next.js chat client for AI with MCP (Model Context Protocol) integration. Provides a modern web interface for AI experimentation with streaming responses and tool execution.

- AI chat interface with streaming responses
- MCP server integration for tool calling
- Support for Google AI and Anthropic models
- Real-time message streaming
- Tool execution and result display

## Setting Up the Web Client

Create a `.env.local` file in the `client-web/` directory:

```bash
NEXT_PUBLIC_GOOGLE_AI_API=your_google_ai_api_key
NEXT_PUBLIC_ANTHROPIC_API=your_anthropic_api_key
```

Install dependencies:

```bash
cd client-web
pnpm install
```

## Running the Web Client

1. Start the MCP server (see `./api` section above)

2. Run the web client:
   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

4. Start chatting! The interface will connect to your MCP server and allow you to use available tools through the AI models.