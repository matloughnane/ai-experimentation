import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const google = createGoogleGenerativeAI({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_AI_API ?? "",
  });

  const anthropic = createAnthropic({
    apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API ?? "",
  });

  const result = streamText({
    // model: google("gemini-2.0-flash-exp"),
    model: anthropic("claude-sonnet-4-20250514"),
    messages: convertToModelMessages(messages),
    tools: {
      // server-side tool with execute function:
      getWeatherInformation: {
        description: "show the weather in a given city to the user",
        inputSchema: z.object({ city: z.string() }),
        execute: async ({}: { city: string }) => {
          const weatherOptions = ["sunny", "cloudy", "rainy", "snowy", "windy"];
          return weatherOptions[
            Math.floor(Math.random() * weatherOptions.length)
          ];
        },
      },
      getArranmoreFerryTimes: {
        description: "Get the times of the ferries from Arranmore Island",
        inputSchema: z.object({}),
        execute: async () => {
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
            (ferry: any) =>
              ferry.months.includes(month) && ferry.days.includes(day)
          );
          const content = [
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
          ];
          return content;
        },
      },
      getBridgitPlatforms: {
        description: "Get available platforms on Bridgit on https://hibridgit.com",
        inputSchema: z.object({}),
        execute: async () => {
          try {
            const platforms = await fetch(
              "https://api.hibridgit.com/platforms"
            );
            const platformsData = (await platforms.json()) as any;
            // console.error("PlatformsData:", platformsData);
            const content = [
              {
                type: "text",
                text: `Bridgit platforms: ${platformsData.data
                  .map(
                    (platform: any) =>
                      `${platform.name} - ${platform.description}`
                  )
                  .join(", ")}`,
              },
            ];
            return content;
          } catch (error) {
            console.error("Error getting Bridgit platforms:", error);
            return [
              {
                type: "text",
                text: "Error getting Bridgit platforms",
              },
            ];
          }
        },
      },
      // client-side tool that starts user interaction:
      askForConfirmation: {
        description: "Ask the user for confirmation.",
        inputSchema: z.object({
          message: z.string().describe("The message to ask for confirmation."),
        }),
      },
      // client-side tool that is automatically executed on the client:
      getLocation: {
        description:
          "Get the user location. Always ask for confirmation before using this tool.",
        inputSchema: z.object({}),
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
