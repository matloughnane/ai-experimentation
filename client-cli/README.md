# MCP CLI Client

A command-line interface client for interacting with MCP (Model Context Protocol) servers using the `mcp-use` library and Anthropic's Claude model.

## Overview

This CLI client demonstrates how to:
- Connect to an MCP server via HTTP
- Use Claude Sonnet 4 as the language model
- Create an interactive chat interface in the terminal
- Process user prompts through the MCP agent

## Prerequisites

1. **Environment Variables**: Create a `.env` file in this directory with:
   ```env
   MCP_URL=http://localhost:8931
   ANTHROPIC_API=your_anthropic_api_key_here
   ```

2. **MCP Server**: You need an MCP server running. See ./api for a working example:

```bash
pnpm dev
```

3. **Dependencies**: Install the required packages:
   ```bash
   pnpm install
   ```

## Usage

1. Run the CLI client:
   ```bash
   npx tsx app.ts
   ```

2. Start chatting! Type your prompts and press Enter. The agent will process your request through the MCP server and return Claude's response.

3. Type `exit` to quit the application.

## Example Session

```
MCP CLI Client - Type your prompts below (type 'exit' to quit):
============================================================

> What can you help me with?

Response:
----------------------------------------
I can help you interact with various tools and services through the MCP server...
----------------------------------------

> exit
```

## Key Features

- **Interactive Terminal Interface**: Real-time chat with Claude through MCP
- **Error Handling**: Graceful error handling for both network and processing errors
- **Clean Exit**: Properly closes connections when exiting
- **Flexible Configuration**: Easy to configure different MCP servers via environment variables

## Dependencies

- `@langchain/anthropic`: Integration with Anthropic's Claude models
- `mcp-use`: MCP client library for connecting to MCP servers
- `dotenv`: Environment variable management
- `readline/promises`: Interactive command-line interface

## Architecture

The application follows this flow:
1. User input → Readline interface
2. Prompt → MCP Agent
3. Agent → Claude LLM + MCP Server tools
4. Response → Terminal output

This creates a powerful CLI that combines the reasoning capabilities of Claude with the tool access provided by MCP servers.
