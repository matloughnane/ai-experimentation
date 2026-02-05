# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm dev         # Start Mastra development server with hot reload on port 4111
pnpm build       # Build the Mastra application
pnpm start       # Start production server
```

### Package Management
```bash
pnpm install     # Install dependencies (Node.js >= 22.13.0 required)
```

## Architecture

This is a Mastra AI framework project that provides:
- **Agents**: AI agents with specific instructions and tools (e.g., weatherAgent with Google Gemini model)
- **Tools**: Reusable functions that agents can call (e.g., weatherTool for fetching weather data)
- **Workflows**: Orchestrated sequences of agent actions
- **Scorers**: Evaluation functions for agent performance (toolCallAppropriatenessScorer, completenessScorer, translationScorer)
- **Observability**: Built-in tracing and monitoring via Mastra Studio and optional Mastra Cloud
- **Storage**: LibSQL-based storage for persistence (configurable for in-memory or file-based)

### Key Files
- `src/mastra/index.ts` - Main Mastra configuration and initialization
- `src/mastra/agents/` - Agent definitions with instructions and tool bindings
- `src/mastra/tools/` - Tool implementations using createTool from @mastra/core
- `src/mastra/workflows/` - Workflow definitions
- `src/mastra/scorers/` - Scorer implementations for agent evaluation

### API Integration
The server exposes a REST API with:
- Chat endpoint at `/chat/:agentId` using @mastra/ai-sdk
- Mastra Studio available at http://localhost:4111 for interactive testing

### Related Projects
This project is part of a larger AI experimentation workspace that includes:
- **mastra_chat_ui**: Next.js chat interface using @assistant-ui components
- **client-web**: Web client with MCP integration
- **api**: Express.js API with Model Context Protocol support