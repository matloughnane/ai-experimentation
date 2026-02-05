import { createScorer } from '@mastra/core/evals';
import { z } from 'zod';

// Tool call appropriateness scorer for ferry agent
const toolCallAppropriatenessScorer = createScorer({
  id: 'ferry-tool-call-appropriateness',
  name: 'Ferry Tool Call Appropriateness',
  description: 'Evaluates whether the ferry agent uses the right tools for the given query',
  type: 'agent',
})
  .preprocess(({ run }) => {
    const messages = run?.messages || [];
    const toolCalls = run?.toolCalls || [];

    const userQuery = messages.find(m => m.role === 'user')?.content || '';
    const toolsUsed = toolCalls.map((call: any) => call.toolName).filter(Boolean);

    return {
      userQuery,
      toolsUsed,
      toolCallCount: toolCalls.length,
    };
  })
  .generateScore(({ results }) => {
    const processed = results?.preprocessStepResult || {};
    const { userQuery = '', toolsUsed = [], toolCallCount = 0 } = processed;

    // Check if appropriate tools were used based on query content
    const queryLower = userQuery.toLowerCase();
    let score = 1.0;
    let deductions = 0;

    // Check date parsing tool usage
    if (queryLower.includes('today') || queryLower.includes('tomorrow') ||
        queryLower.includes('next') || queryLower.includes('this')) {
      if (!toolsUsed.includes('parse-date')) {
        deductions += 0.3;
      }
    }

    // Check ferry tool usage
    if (queryLower.includes('ferry') || queryLower.includes('available') ||
        queryLower.includes('departure')) {
      if (!toolsUsed.includes('check-ferry')) {
        deductions += 0.4;
      }
    }

    // Check weather tool usage when appropriate
    if (queryLower.includes('weather') || queryLower.includes('conditions')) {
      if (!toolsUsed.includes('get-weather')) {
        deductions += 0.2;
      }
    }

    // Penalize excessive tool calls
    if (toolCallCount > 5) {
      deductions += 0.1;
    }

    score = Math.max(0, score - deductions);
    return score;
  })
  .generateReason(({ score, results }) => {
    const processed = results?.preprocessStepResult || {};
    const { toolsUsed = [], toolCallCount = 0 } = processed;

    if (score === 1.0) {
      return 'Perfect tool usage - all appropriate tools were called for the given query.';
    }
    if (score >= 0.7) {
      return `Good tool usage with minor issues. Tools used: ${toolsUsed.join(', ')}. Total calls: ${toolCallCount}.`;
    }
    if (score >= 0.4) {
      return `Some important tools were missed. Tools used: ${toolsUsed.join(', ') || 'none'}. Consider the query context more carefully.`;
    }
    return `Poor tool usage. Many required tools were not called. Only used: ${toolsUsed.join(', ') || 'none'}.`;
  });

// Date parsing accuracy scorer
const dateParsingAccuracyScorer = createScorer({
  id: 'date-parsing-accuracy',
  name: 'Date Parsing Accuracy',
  description: 'Evaluates how accurately the agent parses natural language dates',
  type: 'agent',
  judge: {
    model: 'google/gemini-2.5-pro',
    instructions: `
      You are evaluating the accuracy of date parsing in a ferry booking agent.

      Score the agent based on:
      1. Correct interpretation of relative dates (today, tomorrow, next Monday)
      2. Proper handling of time specifications
      3. Appropriate default time assumptions when not specified
      4. Correct timestamp generation

      Return a score between 0 and 1:
      - 1.0: Perfect date parsing
      - 0.7-0.9: Minor issues (e.g., wrong default time)
      - 0.4-0.6: Significant errors (e.g., wrong day)
      - 0.0-0.3: Major failures or no parsing
    `,
  },
})
  .preprocess(({ run }) => {
    const messages = run?.messages || [];
    const toolCalls = run?.toolCalls || [];

    const userQuery = messages.find(m => m.role === 'user')?.content || '';
    const dateToolCalls = toolCalls.filter((call: any) => call.toolName === 'parse-date');

    return {
      userQuery,
      dateToolCalls,
      parsedDates: dateToolCalls.map((call: any) => call.result),
    };
  })
  .analyze(({ results }) => {
    const preprocessed = results?.preprocessStepResult || {};
    const { userQuery = '', dateToolCalls = [], parsedDates = [] } = preprocessed;

    return {
      instructions: 'Analyze the date parsing accuracy based on the user query and parsed results',
      outputSchema: z.object({
        correctParsing: z.boolean(),
        issues: z.array(z.string()),
        accuracy: z.number().min(0).max(1),
      }),
      createPrompt: () => `
        Analyze the accuracy of date parsing:
        User Query: "${userQuery}"
        Date Tool Calls: ${JSON.stringify(dateToolCalls, null, 2)}
        Parsed Dates: ${JSON.stringify(parsedDates, null, 2)}

        Evaluate:
        1. Was the date correctly interpreted?
        2. Was the appropriate default time used if not specified?
        3. Is the timestamp accurate?

        Return JSON with:
        - correctParsing: boolean
        - issues: array of any parsing problems found
        - accuracy: number between 0 and 1
      `,
    };
  })
  .generateScore(({ results }) => {
    const analyzeResult = results?.analyzeStepResult || {};
    return analyzeResult.accuracy || 0;
  })
  .generateReason(({ results, score }) => {
    const analyzeResult = results?.analyzeStepResult || {};

    if (score === 1.0) {
      return 'Perfect date parsing - all dates were correctly interpreted.';
    }

    const issues = analyzeResult.issues?.join(', ') || 'unspecified issues';
    return `Date parsing accuracy: ${(score * 100).toFixed(0)}%. Issues found: ${issues}`;
  });

// Response completeness scorer
const responseCompletenessScorer = createScorer({
  id: 'ferry-response-completeness',
  name: 'Ferry Response Completeness',
  description: 'Evaluates if the agent provides complete ferry information',
  type: 'agent',
})
  .preprocess(({ run }) => {
    const response = run?.response || '';
    const messages = run?.messages || [];
    const userQuery = messages.find(m => m.role === 'user')?.content || '';

    // Check for key information in response
    const hasAvailability = response.toLowerCase().includes('available') ||
                          response.toLowerCase().includes('not available');
    const hasDepartureTimes = response.includes(':') &&
                             (response.includes('am') || response.includes('pm') || response.includes(':00'));
    const hasJourneyDirection = response.toLowerCase().includes('burtonport') ||
                               response.toLowerCase().includes('arranmore');
    const hasDate = response.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)\b/i);
    const hasAlternatives = response.toLowerCase().includes('alternative') ||
                          response.toLowerCase().includes('consider') ||
                          response.toLowerCase().includes('instead');

    return {
      userQuery,
      hasAvailability,
      hasDepartureTimes,
      hasJourneyDirection,
      hasDate,
      hasAlternatives,
      responseLength: response.length,
    };
  })
  .generateScore(({ results }) => {
    const processed = results?.preprocessStepResult || {};
    const {
      hasAvailability = false,
      hasDepartureTimes = false,
      hasJourneyDirection = false,
      hasDate = false,
      responseLength = 0,
    } = processed;

    let score = 0;

    // Essential information (60% of score)
    if (hasAvailability) score += 0.3;
    if (hasJourneyDirection) score += 0.3;

    // Important details (30% of score)
    if (hasDepartureTimes) score += 0.15;
    if (hasDate) score += 0.15;

    // Response quality (10% of score)
    if (responseLength > 100) score += 0.1;

    return Math.min(1.0, score);
  })
  .generateReason(({ score, results }) => {
    const processed = results?.preprocessStepResult || {};
    const missing = [];
    if (!processed.hasAvailability) missing.push('availability status');
    if (!processed.hasJourneyDirection) missing.push('journey direction');
    if (!processed.hasDepartureTimes) missing.push('departure times');
    if (!processed.hasDate) missing.push('date information');

    if (score === 1.0) {
      return 'Complete response with all essential ferry information provided.';
    }
    if (score >= 0.6) {
      return `Good response but missing: ${missing.join(', ')}.`;
    }
    return `Incomplete response. Missing critical information: ${missing.join(', ')}.`;
  });

// Export all scorers
export const scorers = {
  toolCallAppropriatenessScorer,
  dateParsingAccuracyScorer,
  responseCompletenessScorer,
};

// Also export individually for direct import
export {
  toolCallAppropriatenessScorer,
  dateParsingAccuracyScorer,
  responseCompletenessScorer,
};