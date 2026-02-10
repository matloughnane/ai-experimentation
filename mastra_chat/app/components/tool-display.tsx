"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink, Loader2, Sparkles } from "lucide-react";

interface ToolDisplayProps {
  type: string;
  state: string;
  output?: any;
}

/** Strip the "tool-" prefix to get the raw tool name */
function getToolName(type: string): string {
  return type.startsWith("tool-") ? type.slice(5) : type;
}

const JOURNEY_CODE_MAP: Record<string, string> = {
  "Burtonport to Arranmore Island": "dm",
  "Arranmore Island to Burtonport": "dt",
};

/** Parse the formatted date string (e.g. "Friday, February 06, 2026") to epoch ms with hours set to 12:00 */
function toEpoch(dateStr: string): number {
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return 0;
  parsed.setHours(12, 0, 0, 0);
  return parsed.getTime();
}

function buildBookingUrl(journey: string, time: number, date: string): string {
  const journeyCode = JOURNEY_CODE_MAP[journey] ?? journey;
  const params = new URLSearchParams({
    journey: journeyCode,
    time: String(time),
    date: String(toEpoch(date)),
  });
  return `https://thearranmoreferry.com/tickets?${params.toString()}`;
}

export function FerryBookingButtons({ output }: { output: any }) {
  const departures: any[] = output?.departures ?? [];
  const available = departures.filter((d) => d.available);
  if (available.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2 ml-8">
      {available.map((dep) => (
        <a
          key={dep.time}
          href={buildBookingUrl(output.journey, dep.originalTime ?? 0, output.date)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {dep.time}
          <ExternalLink className="size-3" />
        </a>
      ))}
    </div>
  );
}

function PageCard({ page, onAction }: { page: any; onAction?: (pageId: string) => void }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/60">
      <a
        href={`https://webapp.seoarainnmhor.com/page/${page.uid}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
      >
        {page.photoUrl && (
          <img
            src={page.photoUrl}
            alt={page.name}
            className="size-10 rounded-md object-cover shrink-0"
          />
        )}
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{page.name}</div>
          {page.slogan && (
            <div className="text-xs text-muted-foreground truncate">
              {page.slogan}
            </div>
          )}
        </div>
        <ExternalLink className="size-3 shrink-0 ml-auto text-muted-foreground" />
      </a>
      {onAction && (
        <button
          type="button"
          onClick={() => onAction(page.id)}
          className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          View
        </button>
      )}
    </div>
  );
}

export function CommunityPageCards({ output, onPageAction }: { output: any; onPageAction?: (pageId: string) => void }) {
  const pages: any[] = output?.pages ?? [];
  if (pages.length === 0) return null;

  return (
    <div className={`grid gap-2 mt-2 ml-8 ${pages.length === 1 ? "grid-cols-1 max-w-sm" : "grid-cols-1 sm:grid-cols-2"}`}>
      {pages.map((page) => (
        <PageCard key={page.id} page={page} onAction={onPageAction} />
      ))}
    </div>
  );
}

export function ToolDisplay({ type, state, output }: ToolDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const toolName = getToolName(type);

  const isPending = state === "pending";
  const isStreaming = state === "streaming";
  const isComplete = state === "output-available";

  if (!isPending && !isStreaming && !isComplete) return null;

  const isLoading = isPending || isStreaming;

  return (
    <div className="my-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm rounded-full px-3 py-1.5 bg-muted/60 hover:bg-muted transition-colors"
      >
        <ChevronRight
          className={`size-3.5 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        {isLoading ? (
          <Loader2 className="size-3.5 animate-spin text-amber-500" />
        ) : (
          <Sparkles className="size-3.5 text-amber-500" />
        )}
        <code className="text-xs">{toolName}</code>
        {isLoading && (
          <span className="text-xs text-muted-foreground">running...</span>
        )}
      </button>

      {expanded && isComplete && output != null && (
        <pre className="mt-1 ml-8 text-xs bg-muted/40 rounded-lg p-3 overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap break-words">
          {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  );
}
