import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { withTracing } from '@posthog/ai';
import { postDraftTool } from '../tools/post-draft-tool';
import { dateParserTool } from '../tools/date-parser-tool';
import { dayInterpreterTool } from '../tools/day-interpreter-tool';
import { phClient } from '../../posthog';

const google = createGoogleGenerativeAI();

export interface PostAgentConfig {
  id: string;
  name: string;
}

/**
 * Request context sent by the Flutter app with each chat request (see
 * `chatRoute` in index.ts). Read via `requestContext.get(...)` — the runtime
 * value is a `RequestContext` instance, not a plain object.
 */
export interface PostAgentRequestContext {
  page_id: string;
  page_name: string;
  community: string;
  today: string;
  default_language: string;
}

const tools = {
  emit_post_draft: postDraftTool,
  dateParserTool,
  dayInterpreterTool,
};

export function createPostAgent(config: PostAgentConfig) {
  const { id, name } = config;

  return new Agent<string, typeof tools, undefined, PostAgentRequestContext>({
    id,
    name: `${name} Post Assistant`,
    instructions: ({ requestContext }) => {
      const pageName = requestContext.get('page_name') || 'this page';
      const today = requestContext.get('today') || new Date().toISOString().slice(0, 10);

      return `
      You help the admin of page "${pageName}" on ${name} create a post. Gather info conversationally, ONE question at a time, with short warm replies.

      Today is ${today}. Resolve all relative dates (e.g. "next Friday") to an absolute YYYY-MM-DD date before emitting the draft — use dayInterpreterTool and dateParserTool for this, never guess.

      Gather the following, in order:
      1. What's the post about? Propose a title and content based on their answer.
      2. Is it an event? If yes, get the start/end date, start/end time, and location.
      3. Any link to include?
      4. Would they like an Irish version? Offer to translate the English text to Irish. If they decline, leave title_ie/content_ie empty.
      5. Should this publish now, or save as a draft?

      When show_calendar=0 (not an event), set start_date and end_date to today (${today}) and both times to 1200.

      Before calling emit_post_draft, summarize everything you're about to submit and get an explicit "yes" from the admin.

      ALWAYS include a short text reply alongside the tool call (e.g. "Here's your draft — review it below and tap Open in editor."). Never print the draft JSON in the text body — the app renders it from the tool output.

      Photos: tell the user they can add photos in the editor after confirming the draft. This agent cannot attach photos.

      If the user requests changes after seeing a draft, ask the necessary follow-up questions and call emit_post_draft again with the corrected fields.

      CRITICAL RULE — DATA INTEGRITY: never invent or assume details the user hasn't provided or confirmed (dates, times, locations, links, translations).
    `;
    },
    model: withTracing(google('gemini-2.5-flash'), phClient, {
      posthogDistinctId: id,
      posthogProperties: { communityName: name, agentType: 'post-agent' },
    }),
    tools,
    memory: new Memory(),
  });
}
