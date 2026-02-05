import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// Step 1: Parse the travel date
const parseTravelDate = createStep({
  id: 'parse-travel-date',
  description: 'Parse natural language date into timestamp',
  inputSchema: z.object({
    dateString: z.string(),
    timeString: z.string().optional(),
  }),
  outputSchema: z.object({
    timestamp: z.number(),
    formattedDate: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('ferry-agent');
    if (!agent) {
      throw new Error('Ferry agent not found');
    }

    const result = await agent.generate({
      messages: [
        {
          role: 'user',
          content: `Parse this date and time using the dateParserTool: Date: "${inputData.dateString}"${
            inputData.timeString ? `, Time: "${inputData.timeString}"` : ''
          }. Return only the timestamp and formatted date.`,
        },
      ],
    });

    // Extract timestamp and formatted date from the response
    const text = result.text || '';
    const timestampMatch = text.match(/timestamp[:\s]+(\d+)/i);
    const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();

    const formattedDate = new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      timestamp,
      formattedDate,
    };
  },
});

// Step 2: Check ferry availability
const checkFerryAvailability = createStep({
  id: 'check-ferry',
  description: 'Check ferry availability for the specified journey',
  inputSchema: z.object({
    timestamp: z.number(),
    formattedDate: z.string(),
    journey: z.string(),
  }),
  outputSchema: z.object({
    available: z.boolean(),
    departures: z.array(z.object({
      time: z.string(),
      available: z.boolean(),
    })).optional(),
    message: z.string(),
    journey: z.string(),
    date: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('ferry-agent');
    if (!agent) {
      throw new Error('Ferry agent not found');
    }

    const result = await agent.generate({
      messages: [
        {
          role: 'user',
          content: `Check ferry availability using ferryTool for journey: ${inputData.journey} on timestamp: ${inputData.timestamp}. Provide availability status and departure times.`,
        },
      ],
    });

    // Parse the agent's response to extract ferry information
    const text = result.text || '';
    const available = text.toLowerCase().includes('available');

    return {
      available,
      departures: [],
      message: text,
      journey: inputData.journey,
      date: inputData.formattedDate,
    };
  },
});

// Step 3: Check weather conditions
const checkWeatherConditions = createStep({
  id: 'check-weather',
  description: 'Check weather conditions for both locations',
  inputSchema: z.object({
    available: z.boolean(),
    departures: z.array(z.object({
      time: z.string(),
      available: z.boolean(),
    })).optional(),
    message: z.string(),
    journey: z.string(),
    date: z.string(),
  }),
  outputSchema: z.object({
    ferryInfo: z.object({
      available: z.boolean(),
      departures: z.array(z.object({
        time: z.string(),
        available: z.boolean(),
      })).optional(),
      message: z.string(),
      journey: z.string(),
      date: z.string(),
    }),
    weatherInfo: z.object({
      burtonport: z.string(),
      arranmore: z.string(),
      recommendation: z.string(),
    }),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('ferry-agent');
    if (!agent) {
      throw new Error('Ferry agent not found');
    }

    const weatherResult = await agent.generate({
      messages: [
        {
          role: 'user',
          content: `Check weather conditions using weatherTool for both Burtonport and Arranmore Island. Provide weather information and travel recommendations based on conditions.`,
        },
      ],
    });

    const weatherText = weatherResult.text || '';

    // Extract weather information from the response
    const weatherInfo = {
      burtonport: 'Weather information for Burtonport',
      arranmore: 'Weather information for Arranmore Island',
      recommendation: extractWeatherRecommendation(weatherText, inputData.available),
    };

    return {
      ferryInfo: inputData,
      weatherInfo,
    };
  },
});

// Step 4: Generate comprehensive trip recommendation
const generateTripRecommendation = createStep({
  id: 'generate-recommendation',
  description: 'Generate a comprehensive trip recommendation',
  inputSchema: z.object({
    ferryInfo: z.object({
      available: z.boolean(),
      departures: z.array(z.object({
        time: z.string(),
        available: z.boolean(),
      })).optional(),
      message: z.string(),
      journey: z.string(),
      date: z.string(),
    }),
    weatherInfo: z.object({
      burtonport: z.string(),
      arranmore: z.string(),
      recommendation: z.string(),
    }),
  }),
  outputSchema: z.object({
    recommendation: z.string(),
    ferryStatus: z.string(),
    weatherSummary: z.string(),
    alternativeSuggestions: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const { ferryInfo, weatherInfo } = inputData;

    // Generate ferry status summary
    const ferryStatus = ferryInfo.available
      ? `Ferries are available for ${ferryInfo.journey} on ${ferryInfo.date}.`
      : `No ferries available for ${ferryInfo.journey} on ${ferryInfo.date}.`;

    // Generate weather summary
    const weatherSummary = `Weather conditions: ${weatherInfo.recommendation}`;

    // Generate comprehensive recommendation
    const recommendation = generateComprehensiveRecommendation(ferryInfo, weatherInfo);

    // Generate alternative suggestions if needed
    const alternativeSuggestions = !ferryInfo.available
      ? 'Consider checking availability for different dates or times. Weekend services may have different schedules.'
      : undefined;

    return {
      recommendation,
      ferryStatus,
      weatherSummary,
      alternativeSuggestions,
    };
  },
});

// Helper function to extract weather recommendation
function extractWeatherRecommendation(weatherText: string, ferryAvailable: boolean): string {
  if (weatherText.toLowerCase().includes('storm') || weatherText.toLowerCase().includes('severe')) {
    return 'Weather conditions may affect ferry service. Check with operator for updates.';
  }
  if (weatherText.toLowerCase().includes('rain') || weatherText.toLowerCase().includes('wind')) {
    return 'Some weather concerns but ferry service typically operates. Dress appropriately.';
  }
  if (ferryAvailable) {
    return 'Weather conditions appear suitable for ferry travel.';
  }
  return 'Weather conditions noted for your travel date.';
}

// Helper function to generate comprehensive recommendation
function generateComprehensiveRecommendation(
  ferryInfo: any,
  weatherInfo: any
): string {
  const parts = [];

  if (ferryInfo.available) {
    parts.push(`✅ Ferry service is available for your journey ${ferryInfo.journey} on ${ferryInfo.date}.`);

    if (ferryInfo.departures && ferryInfo.departures.length > 0) {
      const availableDepartures = ferryInfo.departures.filter((d: any) => d.available);
      if (availableDepartures.length > 0) {
        parts.push(`Available departure times: ${availableDepartures.map((d: any) => d.time).join(', ')}`);
      }
    }
  } else {
    parts.push(`❌ Unfortunately, no ferry service is available for ${ferryInfo.journey} on ${ferryInfo.date}.`);
    parts.push('Consider checking alternative dates or contacting the ferry operator directly.');
  }

  parts.push(`\nWeather: ${weatherInfo.recommendation}`);

  if (ferryInfo.available && !weatherInfo.recommendation.includes('severe')) {
    parts.push('\n💡 Tip: Arrive at the terminal 15-20 minutes before departure for smooth boarding.');
  }

  return parts.join('\n');
}

// Create the workflow
const ferryWorkflow = createWorkflow({
  id: 'ferry-workflow',
  inputSchema: z.object({
    dateString: z.string(),
    timeString: z.string().optional(),
    journey: z.string(),
  }),
  outputSchema: z.object({
    recommendation: z.string(),
    ferryStatus: z.string(),
    weatherSummary: z.string(),
    alternativeSuggestions: z.string().optional(),
  }),
})
  .then(parseTravelDate)
  .then(checkFerryAvailability)
  .then(checkWeatherConditions)
  .then(generateTripRecommendation);

ferryWorkflow.commit();

export { ferryWorkflow };