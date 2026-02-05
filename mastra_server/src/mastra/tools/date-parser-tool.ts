import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const dateParserTool = createTool({
  id: 'parse-date',
  description: 'Parse natural language dates and times into timestamps',
  inputSchema: z.object({
    dateString: z.string().describe('Natural language date (e.g., "today", "tomorrow", "next Monday", "January 15th")'),
    timeString: z.string().optional().describe('Optional time (e.g., "3pm", "14:30", "morning")'),
  }),
  outputSchema: z.object({
    timestamp: z.number().describe('Unix timestamp in milliseconds'),
    dateFormatted: z.string().describe('Human-readable date format'),
    inferredTime: z.string().describe('The time used (either specified or default)'),
  }),
  execute: async (inputData) => {
    console.log('\n📅 DATE PARSER REQUEST:', {
      dateString: inputData.dateString,
      timeString: inputData.timeString || '(not specified)',
    });

    const result = parseDate(inputData.dateString, inputData.timeString);

    console.log('📅 DATE PARSER RESULT:', {
      timestamp: result.timestamp,
      dateFormatted: result.dateFormatted,
      inferredTime: result.inferredTime,
    });

    return result;
  },
});

function parseDate(dateString: string, timeString?: string): {
  timestamp: number;
  dateFormatted: string;
  inferredTime: string;
} {
  const now = new Date();
  const normalizedInput = dateString.toLowerCase().trim();

  let targetDate: Date;
  let timeWasInferred = false;

  // Handle relative dates
  let useCurrentTime = false;
  switch (normalizedInput) {
    case 'today':
      targetDate = new Date(now);
      useCurrentTime = true; // For today, use the actual current time
      break;
    case 'tomorrow':
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
      break;
    case 'yesterday':
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - 1);
      break;
    default:
      // Handle "next [day]" patterns
      if (normalizedInput.startsWith('next ')) {
        const dayName = normalizedInput.substring(5);
        targetDate = getNextWeekday(dayName);
      }
      // Handle "this [day]" patterns
      else if (normalizedInput.startsWith('this ')) {
        const dayName = normalizedInput.substring(5);
        targetDate = getThisWeekday(dayName);
      }
      // Try to parse as a regular date
      else {
        targetDate = new Date(dateString);
        if (isNaN(targetDate.getTime())) {
          // If parsing fails, try more formats
          targetDate = parseFlexibleDate(dateString);
        }
      }
  }

  // Handle time parsing
  let inferredTime: string;
  if (timeString) {
    const parsedTime = parseTime(timeString);
    targetDate.setHours(parsedTime.hours, parsedTime.minutes, 0, 0);
    timeWasInferred = false;
  } else if (useCurrentTime) {
    // For "today", keep the current time (don't change it)
    // This way we don't show ferries that have already sailed
    timeWasInferred = false; // Current time is intentional, not inferred
  } else {
    // For future dates, set early morning time (7:00 AM) to show all ferries
    targetDate.setHours(7, 0, 0, 0);
    timeWasInferred = true;
  }

  // Get the actual time from the targetDate
  const actualHours = targetDate.getHours();
  const actualMinutes = targetDate.getMinutes();
  inferredTime = `${String(actualHours).padStart(2, '0')}:${String(actualMinutes).padStart(2, '0')}`;

  // Add note if time was defaulted
  if (timeWasInferred) {
    inferredTime += ' (default early morning)';
  } else if (useCurrentTime && !timeString) {
    inferredTime += ' (current time)';
  }

  const dateFormatted = targetDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    timestamp: targetDate.getTime(),
    dateFormatted,
    inferredTime,
  };
}

function getNextWeekday(dayName: string): Date {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = days.indexOf(dayName.toLowerCase());

  if (targetDay === -1) {
    throw new Error(`Invalid day name: ${dayName}`);
  }

  const today = new Date();
  const currentDay = today.getDay();
  let daysToAdd = targetDay - currentDay;

  // If the target day is today or in the past this week, add 7 days
  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  const result = new Date(today);
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

function getThisWeekday(dayName: string): Date {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = days.indexOf(dayName.toLowerCase());

  if (targetDay === -1) {
    throw new Error(`Invalid day name: ${dayName}`);
  }

  const today = new Date();
  const currentDay = today.getDay();
  const daysToAdd = targetDay - currentDay;

  const result = new Date(today);
  result.setDate(result.getDate() + daysToAdd);
  return result;
}

function parseTime(timeString: string): { hours: number; minutes: number } {
  const normalized = timeString.toLowerCase().trim();

  // Handle named times
  const namedTimes: Record<string, { hours: number; minutes: number }> = {
    'morning': { hours: 9, minutes: 0 },
    'noon': { hours: 12, minutes: 0 },
    'afternoon': { hours: 14, minutes: 0 },
    'evening': { hours: 18, minutes: 0 },
    'night': { hours: 20, minutes: 0 },
  };

  if (namedTimes[normalized]) {
    return namedTimes[normalized];
  }

  // Handle 12-hour format with am/pm
  const ampmMatch = normalized.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1]);
    const minutes = parseInt(ampmMatch[2] || '0');
    const period = ampmMatch[3];

    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }

    return { hours, minutes };
  }

  // Handle 24-hour format
  const timeMatch = normalized.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return {
      hours: parseInt(timeMatch[1]),
      minutes: parseInt(timeMatch[2]),
    };
  }

  // Handle hour only (assume it's in 24-hour format or with pm for afternoon)
  const hourMatch = normalized.match(/^(\d{1,2})$/);
  if (hourMatch) {
    const hour = parseInt(hourMatch[1]);
    // Assume afternoon for hours 1-6 without AM/PM
    if (hour >= 1 && hour <= 6) {
      return { hours: hour + 12, minutes: 0 };
    }
    return { hours: hour, minutes: 0 };
  }

  // Default to morning if parsing fails
  return { hours: 9, minutes: 0 };
}

function parseFlexibleDate(dateString: string): Date {
  const now = new Date();
  const year = now.getFullYear();

  // Try parsing with current year
  const patterns = [
    // Month day format: "January 15", "Jan 15", "15 January"
    /(\w+)\s+(\d{1,2})/,
    /(\d{1,2})\s+(\w+)/,
    // Numeric formats: "1/15", "15/1", "01-15"
    /(\d{1,2})[\/\-](\d{1,2})/,
  ];

  for (const pattern of patterns) {
    const match = dateString.match(pattern);
    if (match) {
      // Try different interpretations
      const attempts = [
        new Date(`${match[0]} ${year}`),
        new Date(`${year} ${match[0]}`),
        new Date(`${match[0]}, ${year}`),
      ];

      for (const attempt of attempts) {
        if (!isNaN(attempt.getTime())) {
          return attempt;
        }
      }
    }
  }

  // If all else fails, return today
  return now;
}