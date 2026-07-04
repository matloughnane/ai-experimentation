import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Structured output of a successfully validated post draft.
 * The Flutter app pattern-matches on the `post_draft` key in the tool's
 * output — this shape is a binding contract with the client, mirroring the
 * existing `{"pages": [...]}` convention used by the community tools.
 */
export const postDraftSchema = z.object({
  title: z.string(),
  title_ie: z.string(),
  content: z.string(),
  content_ie: z.string(),
  link: z.string(),
  show_calendar: z.number().int(),
  start_date: z.string(),
  end_date: z.string(),
  start_time: z.number().int(),
  end_time: z.number().int(),
  location: z.string(),
  status: z.number().int(),
  local_board: z.number().int(),
  audience: z.number().int(),
  notification_status: z.number().int(),
  show_author: z.literal(0),
  author: z.literal(''),
});

// Deliberately permissive at the zod layer — see the note on `execute` below.
// Field-level rules (cross-field requirements, date/time formats, ranges) are
// enforced explicitly in `execute` so the agent gets an actionable `{error}`
// message instead of an opaque zod parse failure.
//
// Note: the 0/1(/2) fields use plain `z.number()` rather than
// `z.union([z.literal(0), z.literal(1)])`, and `author` uses plain `z.string()`
// rather than `z.literal('')`. Gemini's function-calling schema rejects both
// numeric `enum` values and empty-string `enum` values (confirmed via live
// smoke test: "(TYPE_STRING), 0" for numeric enums, "enum[0]: cannot be empty"
// for the empty-string enum). Allowed values are validated explicitly in
// `execute` instead, and `author`/`show_author` are always forced to '' / 0
// in the returned post_draft regardless of what the model sends.
const postDraftInputSchema = z.object({
  title: z.string().optional().default(''),
  title_ie: z.string().optional().default(''),
  content: z.string().optional().default(''),
  content_ie: z.string().optional().default(''),
  link: z.string().optional().default(''),
  show_calendar: z.number().int().optional().default(0).describe('0 = not an event, 1 = event'),
  start_date: z.string().describe('YYYY-MM-DD'),
  end_date: z.string().describe('YYYY-MM-DD'),
  start_time: z.number().int().optional().default(1200).describe('HHMM, e.g. 1930 = 7:30pm'),
  end_time: z.number().int().optional().default(1200).describe('HHMM, e.g. 1930 = 7:30pm'),
  location: z.string().optional().default(''),
  status: z.number().int().describe('0 = draft, 1 = publish'),
  local_board: z.number().int().optional().default(0).describe('0 or 1'),
  audience: z.number().int().optional().default(0).describe('0, 1, or 2'),
  notification_status: z.number().int().optional().default(0).describe('0 or 1'),
  show_author: z.number().int().optional().default(0).describe('Always 0 — do not ask the user for this'),
  author: z.string().optional().default('').describe('Always empty — do not ask the user for this'),
});

const outputSchema = z.union([
  z.object({ error: z.string() }),
  z.object({ post_draft: postDraftSchema }),
]);

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function isValidHHMM(value: number): boolean {
  if (!Number.isInteger(value) || value < 0 || value > 2359) return false;
  return (value % 100) < 60;
}

function isValidLinkOrEmpty(value: string): boolean {
  if (value === '') return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isOneOf(value: number, allowed: number[]): boolean {
  return allowed.includes(value);
}

export const postDraftTool = createTool({
  id: 'emit_post_draft',
  description: 'Emit a structured post draft once the admin has confirmed all details. The Flutter app renders and creates the post from this output — this tool does NOT write anything itself.',
  inputSchema: postDraftInputSchema,
  outputSchema,
  execute: async (inputData) => {
    const input = inputData as z.infer<typeof postDraftInputSchema>;
    console.log('\n📝 EMIT POST DRAFT REQUEST:', JSON.stringify(input, null, 2));

    const title = input.title.trim();
    const titleIe = input.title_ie.trim();
    const content = input.content.trim();
    const contentIe = input.content_ie.trim();
    const location = input.location.trim();

    if (title === '' && titleIe === '') {
      return { error: 'Provide at least a title (English or Irish) before I can save the draft.' };
    }

    if (content === '' && contentIe === '') {
      return { error: 'Provide at least some content (English or Irish) before I can save the draft.' };
    }

    if (!isValidLinkOrEmpty(input.link)) {
      return { error: `"${input.link}" doesn't look like a valid URL — please provide a full URL (e.g. https://example.com) or leave it blank.` };
    }

    if (!isOneOf(input.show_calendar, [0, 1])) {
      return { error: `show_calendar must be 0 or 1, got ${input.show_calendar}.` };
    }

    if (!isOneOf(input.status, [0, 1])) {
      return { error: `status must be 0 (draft) or 1 (publish), got ${input.status}.` };
    }

    if (!isOneOf(input.local_board, [0, 1])) {
      return { error: `local_board must be 0 or 1, got ${input.local_board}.` };
    }

    if (!isOneOf(input.audience, [0, 1, 2])) {
      return { error: `audience must be 0, 1, or 2, got ${input.audience}.` };
    }

    if (!isOneOf(input.notification_status, [0, 1])) {
      return { error: `notification_status must be 0 or 1, got ${input.notification_status}.` };
    }

    if (!isValidDateString(input.start_date)) {
      return { error: `start_date must be in YYYY-MM-DD format, got "${input.start_date}".` };
    }

    if (!isValidDateString(input.end_date)) {
      return { error: `end_date must be in YYYY-MM-DD format, got "${input.end_date}".` };
    }

    if (!isValidHHMM(input.start_time)) {
      return { error: `start_time must be a 24-hour HHMM value between 0000 and 2359 with a minutes portion under 60 (e.g. 1930 for 7:30pm), got ${input.start_time}.` };
    }

    if (!isValidHHMM(input.end_time)) {
      return { error: `end_time must be a 24-hour HHMM value between 0000 and 2359 with a minutes portion under 60 (e.g. 1930 for 7:30pm), got ${input.end_time}.` };
    }

    if (input.show_calendar === 1 && location === '') {
      return { error: 'This is an event (show_calendar=1), so it needs a location — please ask the user where it\'s happening.' };
    }

    const post_draft = {
      title,
      title_ie: titleIe,
      content,
      content_ie: contentIe,
      link: input.link,
      show_calendar: input.show_calendar,
      start_date: input.start_date,
      end_date: input.end_date,
      start_time: input.start_time,
      end_time: input.end_time,
      location,
      status: input.status,
      local_board: input.local_board,
      audience: input.audience,
      notification_status: input.notification_status,
      show_author: 0 as const,
      author: '' as const,
    };

    console.log('✅ POST DRAFT RESULT:', JSON.stringify(post_draft, null, 2));
    return { post_draft };
  },
});
