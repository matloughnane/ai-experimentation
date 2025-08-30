// MODIFIED FROM
// https://github.com/mcp-use/mcp-use-ts/blob/main/examples/http_example.ts
// 

/**
 * HTTP Example for mcp-use.
 *
 * This example demonstrates how to use the mcp-use library with MCPClient
 * to connect to an MCP server running on a specific HTTP port.
 *
 * Before running this example, you need to start the Playwright MCP server
 * in another terminal with:
 *
 *     npx @playwright/mcp@latest --port 8931
 *
 * This will start the server on port 8931. Resulting in the config you find below.
 * Of course you can run this with any server you want at any URL.
 *
 * Special thanks to https://github.com/microsoft/playwright-mcp for the server.
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { config } from "dotenv";
import { MCPAgent, MCPClient } from "mcp-use";
import * as readline from "readline/promises";

// Load environment variables from .env file
config();

async function main() {
  const config = { mcpServers: { http: { url: process.env.MCP_URL } } };

  // Create MCPClient from config
  const client = MCPClient.fromDict(config);

  // Create LLM
  const llm = new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    temperature: 0,
    apiKey: process.env.ANTHROPIC_API,
  });

  // Create agent with the client
  const agent = new MCPAgent({
    llm,
    client,
    maxSteps: 30,
  });

  // Create readline interface for interactive input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("MCP CLI Client - Type your prompts below (type 'exit' to quit):");
  console.log("=".repeat(60));

  try {
    while (true) {
      const prompt = await rl.question("\n> ");
      
      if (prompt.toLowerCase().trim() === 'exit') {
        break;
      }

      if (!prompt.trim()) {
        continue;
      }

      console.log("\nResponse:");
      console.log("-".repeat(40));

      try {
        // GET THE RESPONSE FROM THE AGENT
        const result = await agent.run(prompt, 30);
        
        // DISPLAY THE RESPONSE
        const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
        console.log(content);
        
        console.log("-".repeat(40));
      } catch (error) {
        console.error("Error processing prompt:", error);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    rl.close();
    await agent.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
