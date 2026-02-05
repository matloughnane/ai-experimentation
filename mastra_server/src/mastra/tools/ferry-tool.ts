import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface FerryAvailabilityResponse {
  status: number;
  date: number;
  journey: string;
  data?: Array<{
    time: number;  // Time as integer (e.g., 745 = 7:45 AM, 1315 = 1:15 PM)
    type: string;
    locked: boolean;
    rerouted: boolean;
    deckSpaceAvails: number;
    passengerAvails: number;
  }>;
  error: number;
  message: string;
}

const JOURNEY_CODES = {
  'departing_burtonport': 'dm',
  'departing_arranmore': 'dt',
  'to_arranmore': 'dm',
  'to_burtonport': 'dt',
  'from_burtonport': 'dm',
  'from_arranmore': 'dt',
} as const;

export const ferryTool = createTool({
  id: 'check-ferry',
  description: 'Check ferry availability between Burtonport and Arranmore Island',
  inputSchema: z.object({
    journey: z.enum(['departing_burtonport', 'departing_arranmore', 'to_arranmore', 'to_burtonport', 'from_burtonport', 'from_arranmore'])
      .describe('Journey direction: departing_burtonport (mainland to island) or departing_arranmore (island to mainland)'),
    timestamp: z.number().describe('Date/time as Unix timestamp in milliseconds'),
  }),
  outputSchema: z.object({
    available: z.boolean().describe('Whether ferries are available'),
    journey: z.string().describe('Human-readable journey description'),
    date: z.string().describe('Formatted date of query'),
    departures: z.array(z.object({
      time: z.string(),
      available: z.boolean(),
      capacity: z.number().optional(),
      deckSpace: z.number().optional(),
      locked: z.boolean().optional(),
      rerouted: z.boolean().optional(),
    })).optional().describe('List of departure times and availability'),
    message: z.string().optional().describe('Additional information or error message'),
  }),
  execute: async (inputData) => {
    return await checkFerryAvailability(inputData.journey, inputData.timestamp);
  },
});

async function checkFerryAvailability(
  journey: keyof typeof JOURNEY_CODES,
  timestamp: number
): Promise<{
  available: boolean;
  journey: string;
  date: string;
  departures?: Array<{
    time: string;
    available: boolean;
    capacity: number;
    deckSpace: number;
    locked: boolean;
    rerouted: boolean;
  }>;
  message?: string;
}> {
  const journeyCode = JOURNEY_CODES[journey];
  const journeyDescription = getJourneyDescription(journey);
  const date = new Date(timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const requestBody = {
    journey: journeyCode,
    date: timestamp,
  };

  console.log('\n🚢 FERRY API REQUEST:', {
    url: 'https://api.thearranmoreferry.com/v2/availability',
    method: 'POST',
    journey: `${journey} (${journeyCode})`,
    journeyDescription,
    date: formattedDate,
    timestamp,
    body: requestBody,
  });

  try {
    const response = await fetch('https://api.thearranmoreferry.com/v2/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('🚢 FERRY API RESPONSE STATUS:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ FERRY API ERROR:', `Status ${response.status}`);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json() as FerryAvailabilityResponse;

    console.log('🚢 FERRY API RESPONSE DATA:', JSON.stringify(data, null, 2));

    // Check if we have ferry data
    if (data.error !== 0 || !data.data || data.data.length === 0) {
      return {
        available: false,
        journey: journeyDescription,
        date: formattedDate,
        message: data.message || 'No ferry services available for this date',
      };
    }

    // Process the response data
    const ferryDepartures = data.data || [];

    // Check if this is for today
    const requestDate = new Date(timestamp);
    const now = new Date();
    const isToday = requestDate.toDateString() === now.toDateString();
    const currentTimeMinutes = isToday ? (now.getHours() * 60 + now.getMinutes()) : 0;

    // Format departure times and availability
    const allDepartures = ferryDepartures.map(departure => {
      // Convert integer time to readable format (e.g., 745 -> "7:45 AM")
      const timeStr = departure.time.toString().padStart(4, '0');
      const hours = parseInt(timeStr.substring(0, timeStr.length - 2));
      const minutes = parseInt(timeStr.substring(timeStr.length - 2));
      const departureTimeMinutes = hours * 60 + parseInt(minutes);

      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      const formattedTime = `${displayHours}:${minutes} ${period}`;

      // Check availability based on space
      const isAvailable = !departure.locked &&
                         (departure.deckSpaceAvails > 0 || departure.passengerAvails > 0);

      // For today, mark as unavailable if the ferry has already sailed
      const hasSailed = isToday && departureTimeMinutes <= currentTimeMinutes;

      return {
        time: formattedTime,
        available: isAvailable && !hasSailed,
        capacity: departure.passengerAvails,
        deckSpace: departure.deckSpaceAvails,
        locked: departure.locked,
        rerouted: departure.rerouted,
        hasSailed,
        originalTime: departure.time, // Keep for debugging
      };
    });

    // Filter out ferries that have already sailed if it's today
    const formattedDepartures = isToday
      ? allDepartures.filter(d => !d.hasSailed)
      : allDepartures;

    if (isToday && allDepartures.length > formattedDepartures.length) {
      const sailedCount = allDepartures.length - formattedDepartures.length;
      console.log(`⏰ Filtered out ${sailedCount} ferries that have already sailed today`);
      const sailedFerries = allDepartures.filter(d => d.hasSailed);
      console.log(`   Sailed ferries: ${sailedFerries.map(f => f.time).join(', ')}`);
    }

    // Overall availability - at least one departure has space
    const available = formattedDepartures.some(dep => dep.available);

    const result = {
      available,
      journey: journeyDescription,
      date: formattedDate,
      departures: formattedDepartures.length > 0 ? formattedDepartures : undefined,
      message: generateAvailabilityMessage(available, formattedDepartures),
    };

    console.log('✅ FERRY TOOL RESULT:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ FERRY TOOL ERROR:', errorMessage);

    const errorResult = {
      available: false,
      journey: journeyDescription,
      date: formattedDate,
      message: `Failed to check ferry availability: ${errorMessage}`,
    };

    console.log('❌ FERRY TOOL ERROR RESULT:', JSON.stringify(errorResult, null, 2));
    return errorResult;
  }
}

function getJourneyDescription(journey: keyof typeof JOURNEY_CODES): string {
  const descriptions = {
    'departing_burtonport': 'Burtonport to Arranmore Island',
    'departing_arranmore': 'Arranmore Island to Burtonport',
    'to_arranmore': 'Burtonport to Arranmore Island',
    'to_burtonport': 'Arranmore Island to Burtonport',
    'from_burtonport': 'Burtonport to Arranmore Island',
    'from_arranmore': 'Arranmore Island to Burtonport',
  };
  return descriptions[journey];
}

function generateAvailabilityMessage(
  available: boolean,
  departures: Array<{ time: string; available: boolean; capacity: number; deckSpace: number; locked: boolean; rerouted: boolean }>
): string {
  if (!available && departures.length === 0) {
    return 'No ferry services scheduled for this date';
  }

  if (!available && departures.length > 0) {
    const allBooked = departures.every(d => !d.available);
    if (allBooked) {
      return 'All ferry departures are fully booked for this date';
    }
  }

  if (available && departures.length > 0) {
    const availableDepartures = departures.filter(d => d.available);
    const availableCount = availableDepartures.length;
    const totalCount = departures.length;

    // Create detailed message with available times
    const availableTimes = availableDepartures.map(d => d.time).join(', ');

    return `${availableCount} of ${totalCount} departures have availability. Available times: ${availableTimes}`;
  }

  return 'Ferry service status checked';
}