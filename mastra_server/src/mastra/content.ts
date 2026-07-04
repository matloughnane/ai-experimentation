import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Loads the per-community background markdown (content/<communityId>.md).
 *
 * The file is injected into the community agent's instructions as trusted
 * background for general questions — live data (events, businesses, hours)
 * still always comes from the API tools.
 *
 * Resolution: COMMUNITY_CONTENT_DIR env var if set; otherwise walk upward
 * from process.cwd() looking for a `content/` directory. The walk matters
 * because `mastra dev` runs with cwd deep inside the project
 * (src/mastra/public) and `mastra build` runs from .mastra/output — both
 * sit below the project root where content/ lives. A missing file is not
 * an error — the agent simply runs without background info (logged so it
 * isn't silently absent in production).
 */
function findContentDir(): string | null {
  if (process.env.COMMUNITY_CONTENT_DIR) return process.env.COMMUNITY_CONTENT_DIR;
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, "content");
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function loadCommunityInfo(communityId: string): string {
  const dir = findContentDir();
  if (!dir) {
    console.warn(`loadCommunityInfo: no content/ directory found (cwd: ${process.cwd()}) — set COMMUNITY_CONTENT_DIR; agents will run without community background`);
    return "";
  }
  const file = path.join(dir, `${communityId}.md`);
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    console.warn(`loadCommunityInfo: no background file for "${communityId}" (looked for ${file}) — agent will run without community background`);
    return "";
  }
}
