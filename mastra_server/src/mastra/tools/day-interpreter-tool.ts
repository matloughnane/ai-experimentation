import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Tool to interpret colloquial day terms and return the correct date
 * Handles terms like "Friday", "next Monday", "tomorrow", etc.
 */
export const dayInterpreterTool = createTool({
  id: 'day-interpreter',
  description: 'Interprets colloquial day terms and returns the corresponding date',
  inputSchema: z.object({
    dayTerm: z.string().describe('The day term to interpret (e.g., "Friday", "next Monday", "tomorrow")'),
    referenceDate: z.string().optional().describe('Reference date in ISO format (defaults to today)'),
  }),
  execute: async ({ dayTerm, referenceDate }) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Use provided reference date or today
    const today = referenceDate ? new Date(referenceDate) : new Date();
    const todayDayIndex = today.getDay();

    // Normalize the input
    const normalizedTerm = dayTerm.toLowerCase().trim();

    // Handle special cases
    if (normalizedTerm === 'today') {
      return {
        date: today.toISOString().split('T')[0],
        dayName: days[todayDayIndex],
        isValid: true,
      };
    }

    if (normalizedTerm === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        date: tomorrow.toISOString().split('T')[0],
        dayName: days[tomorrow.getDay()],
        isValid: true,
      };
    }

    if (normalizedTerm === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        date: yesterday.toISOString().split('T')[0],
        dayName: days[yesterday.getDay()],
        isValid: true,
      };
    }

    // Check if it's a day name (with or without "next")
    const isNext = normalizedTerm.includes('next ');
    const dayNameOnly = normalizedTerm.replace('next ', '').replace('this ', '');

    // Find the target day index
    const targetDayIndex = days.findIndex(day => day.toLowerCase() === dayNameOnly);

    if (targetDayIndex === -1) {
      // Try partial match
      const partialMatch = days.findIndex(day => day.toLowerCase().startsWith(dayNameOnly));
      if (partialMatch === -1) {
        return {
          date: null,
          dayName: null,
          isValid: false,
          error: `Could not interpret "${dayTerm}" as a valid day`,
        };
      }
    }

    const finalTargetIndex = targetDayIndex !== -1 ? targetDayIndex :
      days.findIndex(day => day.toLowerCase().startsWith(dayNameOnly));

    // Calculate days until target
    let daysToAdd = finalTargetIndex - todayDayIndex;

    // If it's a past day in the current week or today, move to next week
    if (daysToAdd <= 0 && !isNext) {
      daysToAdd += 7;
    }

    // If "next" is specified, always go to next week's occurrence
    if (isNext) {
      daysToAdd = daysToAdd <= 0 ? daysToAdd + 7 : daysToAdd + 7;
    }

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysToAdd);

    return {
      date: targetDate.toISOString().split('T')[0],
      dayName: days[finalTargetIndex],
      isValid: true,
      daysFromToday: daysToAdd,
      interpretation: `${days[finalTargetIndex]}, ${targetDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })}`,
    };
  },
});