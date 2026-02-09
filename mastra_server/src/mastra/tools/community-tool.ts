import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const COMMUNITY_API_BASE =process.env.COMMUNITY_API ||  'http://localhost:5100';
const COMMUNITY_NAME = process.env.COMMUNITY_NAME || 'the community';

// --- Categories Tool ---

export const communityCategoriesTools = createTool({
  id: 'get-community-categories',
  description: 'Get all community categories (e.g. Things To Do, Food & Drink, Accommodation, Events Calendar)',
  inputSchema: z.object({}),
  outputSchema: z.object({
    categories: z.array(z.object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
    })),
    count: z.number(),
    message: z.string(),
  }),
  execute: async () => {
    console.log('\n🏘️ COMMUNITY CATEGORIES REQUEST');
    console.log(`${COMMUNITY_API_BASE}/categories`);

    try {
      const response = await fetch(`${COMMUNITY_API_BASE}/categories`);

      console.log('🏘️ COMMUNITY CATEGORIES RESPONSE STATUS:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json() as {
        categories: Array<{
          id: string;
          name: string;
          color: string;
          status: number;
          deleted: number;
        }>;
      };

      const categories = (data.categories || [])
        .filter(c => c.status === 1 && c.deleted === 0)
        .map(c => ({
          id: c.id,
          name: c.name,
          color: c.color,
        }));

      const result = {
        categories,
        count: categories.length,
        message: categories.length > 0
          ? `Found ${categories.length} categories in ${COMMUNITY_NAME}`
          : 'No categories found',
      };

      console.log('✅ COMMUNITY CATEGORIES RESULT:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ COMMUNITY CATEGORIES ERROR:', errorMessage);

      return {
        categories: [],
        count: 0,
        message: `Failed to fetch categories: ${errorMessage}`,
      };
    }
  },
});

// --- Pages by Category Tool ---

export const communityPagesByCategoryTool = createTool({
  id: 'get-community-pages-by-category',
  description: 'Get community pages/businesses for a specific category',
  inputSchema: z.object({
    categoryId: z.string().describe('The category ID to fetch pages for'),
    categoryName: z.string().describe('The category name (for display purposes)'),
    pageName: z.string().optional().describe('Optional: filter results to a specific page by name (case-insensitive partial match). Use this when the user asks about a specific place within a known category.'),
  }),
  outputSchema: z.object({
    pages: z.array(z.object({
      id: z.string(),
      uid: z.string(),
      name: z.string(),
      slogan: z.string().optional(),
      description: z.string().optional(),
      photoUrl: z.string().optional(),
    })),
    categoryName: z.string(),
    count: z.number(),
    message: z.string(),
  }),
  execute: async ({ categoryId, categoryName, pageName }) => {
    console.log(`${COMMUNITY_API_BASE}/page/category/${categoryId}`);
    console.log('\n📄 COMMUNITY PAGES REQUEST:', { categoryId, categoryName, pageName });

    try {
      const response = await fetch(`${COMMUNITY_API_BASE}/page/category/${categoryId}`);

      console.log('📄 COMMUNITY PAGES RESPONSE STATUS:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json() as {
        pages: Array<{
          id: string;
          uid: string;
          name: string;
          slogan?: string;
          description?: string;
          photos?: Array<{
            file_name: string;
            primary_photo: number;
          }>;
        }>;
      };

      let pages = (data.pages || []).map(p => {
        const primaryPhoto = p.photos?.find(ph => ph.primary_photo === 1) ?? p.photos?.[0];
        const photoUrl = primaryPhoto
          ? `${COMMUNITY_API_BASE}/images/page/md/${primaryPhoto.file_name}.webp`
          : undefined;
        return {
          id: p.id,
          uid: p.uid,
          name: p.name,
          slogan: p.slogan || undefined,
          description: p.description || undefined,
          photoUrl,
        };
      });

      if (pageName) {
        const filterLower = pageName.toLowerCase();
        pages = pages.filter(p => p.name.toLowerCase().includes(filterLower));
      }

      const result = {
        pages,
        categoryName,
        count: pages.length,
        message: pages.length > 0
          ? `Found ${pages.length} place(s) in ${categoryName}`
          : `No places found in ${categoryName}`,
      };

      console.log('✅ COMMUNITY PAGES RESULT:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ COMMUNITY PAGES ERROR:', errorMessage);

      return {
        pages: [],
        categoryName,
        count: 0,
        message: `Failed to fetch pages for ${categoryName}: ${errorMessage}`,
      };
    }
  },
});

// --- Events Tool ---

function formatEventTime(time: number | null | undefined): string | undefined {
  if (time === null || time === undefined) return undefined;
  const timeStr = time.toString().padStart(4, '0');
  const hours = parseInt(timeStr.substring(0, timeStr.length - 2));
  const minutes = timeStr.substring(timeStr.length - 2);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes} ${period}`;
}

export const communityEventsTool = createTool({
  id: 'get-community-events',
  description: 'Search for upcoming community events within a date range',
  inputSchema: z.object({
    startTimestamp: z.number().describe('Start of date range as Unix timestamp in milliseconds (use 0 for today)'),
    endTimestamp: z.number().describe('End of date range as Unix timestamp in milliseconds (use 0 for one month from now)'),
  }),
  outputSchema: z.object({
    events: z.array(z.object({
      id: z.string(),
      title: z.string(),
      content: z.string().optional(),
      startDate: z.string(),
      startTime: z.string().optional(),
      endDate: z.string(),
      endTime: z.string().optional(),
      location: z.string().optional(),
    })),
    count: z.number(),
    dateRange: z.string(),
    message: z.string(),
  }),
  execute: async ({ startTimestamp, endTimestamp }) => {
    console.log('\n📅 COMMUNITY EVENTS REQUEST:', { startTimestamp, endTimestamp });

    try {
      const response = await fetch(`${COMMUNITY_API_BASE}/events/${startTimestamp}/${endTimestamp}`);

      console.log('📅 COMMUNITY EVENTS RESPONSE STATUS:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json() as {
        status: number;
        events: Array<{
          id: string;
          title: string;
          content?: string;
          start_date: string;
          start_time?: number;
          end_date: string;
          end_time?: number;
          location?: string;
        }>;
        start_date: string;
        end_date: string;
      };

      const events = (data.events || []).map(e => ({
        id: e.id,
        title: e.title,
        content: e.content || undefined,
        startDate: new Date(e.start_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        startTime: formatEventTime(e.start_time),
        endDate: new Date(e.end_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        endTime: formatEventTime(e.end_time),
        location: e.location || undefined,
      }));

      const rangeStart = data.start_date
        ? new Date(data.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
        : 'today';
      const rangeEnd = data.end_date
        ? new Date(data.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
        : 'one month from now';

      const result = {
        events,
        count: events.length,
        dateRange: `${rangeStart} to ${rangeEnd}`,
        message: events.length > 0
          ? `Found ${events.length} events between ${rangeStart} and ${rangeEnd}`
          : `No events found between ${rangeStart} and ${rangeEnd}`,
      };

      console.log('✅ COMMUNITY EVENTS RESULT:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ COMMUNITY EVENTS ERROR:', errorMessage);

      return {
        events: [],
        count: 0,
        dateRange: 'unknown',
        message: `Failed to fetch events: ${errorMessage}`,
      };
    }
  },
});
