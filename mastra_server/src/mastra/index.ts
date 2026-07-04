import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import {
  Observability,
  DefaultExporter,
  CloudExporter,
  SensitiveDataFilter,
} from "@mastra/observability";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { weatherAgent } from "./agents/weather-agent";
import {
  toolCallAppropriatenessScorer,
  completenessScorer,
  translationScorer,
} from "./scorers/weather-scorer";
import { ferryWorkflow } from "./workflows/ferry-workflow";
import { ferryAgent } from "./agents/ferry-agent";
import { createCommunityAgent } from "./agents/community-agent";
import { createPostAgent } from "./agents/post-agent";
import {
  toolCallAppropriatenessScorer as ferryToolCallScorer,
  dateParsingAccuracyScorer,
  responseCompletenessScorer,
} from "./scorers/ferry-scorer";
import { chatRoute } from "@mastra/ai-sdk";

// -- Community agents --
const seoarainnmhor = createCommunityAgent({
  id: 'seoarainnmhor',
  name: 'Seo Árainn Mhór',
  apiBase: process.env.SEOARAINNMHOR_API || 'http://localhost:5100',
});

const inisoirrbeo = createCommunityAgent({
  id: 'inisoirrbeo',
  name: 'Inis Oírr Beo',
  apiBase: process.env.INISOIRRBEO_API || 'http://localhost:5200',
});

const bluewayarranmore = createCommunityAgent({
  id: 'bluewayarranmore',
  name: 'Blueway Arranmore',
  apiBase: process.env.BLUEWAYARRANMORE_API || 'http://localhost:4100',
});

// -- Post-creation agents --
const seoarainnmhorPosts = createPostAgent({ id: 'seoarainnmhor-posts', name: 'Seo Árainn Mhór' });
const inisoirrbeoPosts = createPostAgent({ id: 'inisoirrbeo-posts', name: 'Inis Oírr Beo' });
const bluewayarranmorePosts = createPostAgent({ id: 'bluewayarranmore-posts', name: 'Blueway Arranmore' });

export const mastra = new Mastra({
  workflows: {
    weatherWorkflow,
    ferryWorkflow,
  },
  agents: {
    weatherAgent,
    ferryAgent,
    seoarainnmhor,
    inisoirrbeo,
    bluewayarranmore,
    'seoarainnmhor-posts': seoarainnmhorPosts,
    'inisoirrbeo-posts': inisoirrbeoPosts,
    'bluewayarranmore-posts': bluewayarranmorePosts,
  },
  scorers: {
    toolCallAppropriatenessScorer,
    completenessScorer,
    translationScorer,
    ferryToolCallScorer,
    dateParsingAccuracyScorer,
    responseCompletenessScorer,
  },
  storage: new LibSQLStore({
    id: "mastra-storage",
    // Must be file-backed (not :memory:): since @mastra/core 1.49 the orchestration
    // worker uses its own connection, and every :memory: connection gets a separate
    // empty database — the scheduled notification dispatcher then fails with
    // "no such table: mastra_workflow_snapshot" every minute.
    url: "file:../mastra.db",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
  server: {
    cors: {
      origin: '*',
      allowHeaders: ['Content-Type', 'Authorization', 'x-mastra-client-type', 'User-Agent'],
    },
    // maxSteps: the default (5) is exhausted by tool rounds alone on multi-day
    // queries ("what's on this week?" = dayInterpreter + dateParser per day),
    // ending the stream with no text. Allow enough steps for tools + answer.
    apiRoutes: [chatRoute({ path: "/chat/:agentId", defaultOptions: { maxSteps: 15 } })],
  },
});
