import { PostHog } from "posthog-node";

export const phClient = new PostHog(process.env.POSTHOG_API_KEY ?? "", {
  host: "https://eu.i.posthog.com",
});
