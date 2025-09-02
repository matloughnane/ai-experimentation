# Web Client

A Next.js chat client for AI with MCP (Model Context Protocol) integration.

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm, npm, or yarn

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Required environment variables:
```env
NEXT_PUBLIC_GOOGLE_AI_API=your_google_ai_api_key
NEXT_PUBLIC_ANTHROPIC_API=your_anthropic_api_key
```

### Development

Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Features

- AI chat interface with streaming responses
- MCP server integration for tool calling
- Support for Google AI and Anthropic models
- Real-time message streaming
- Tool execution and result display

### Project Structure

- `app/` - Next.js app router pages and API routes
- `components/` - React components including chat interface
- `lib/` - Utility functions and MCP client setup
