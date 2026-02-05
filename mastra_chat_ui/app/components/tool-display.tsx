import { CheckCircle2, Clock, Loader2 } from "lucide-react";

interface ToolDisplayProps {
  type: string;
  state: string;
  output?: any;
}

const toolInfo = {
  "tool-day-interpreter": {
    name: "Day Interpreter",
    icon: "📆",
    pendingText: "Interpreting day reference...",
    streamingText: "Calculating the correct date...",
    getCompletedText: (output: any) => {
      if (output?.isValid) {
        return output.interpretation || `${output.dayName}, ${output.date}`;
      }
      return "Day interpreted";
    },
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
  },
  "tool-parse-date": {
    name: "Date Parser",
    icon: "📅",
    pendingText: "Understanding your date request...",
    streamingText: "Parsing the date and time...",
    getCompletedText: (output: any) => {
      if (output?.timestamp) {
        return new Date(output.timestamp).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: output.includeTime ? "numeric" : undefined,
          minute: output.includeTime ? "numeric" : undefined,
        });
      }
      return "Date parsed";
    },
    bgColor: "bg-green-50",
    textColor: "text-green-600",
  },
  "tool-check-ferry": {
    name: "Ferry Checker",
    icon: "🚢",
    pendingText: "Preparing to check ferry availability...",
    streamingText: "Checking Arranmore Ferry schedules...",
    getCompletedText: (output: any) => {
      const availableCount = output?.departures?.filter((d: any) => d.available).length || 0;
      const totalCount = output?.departures?.length || 0;
      if (totalCount > 0) {
        return `Found ${availableCount} available departure${availableCount !== 1 ? "s" : ""} out of ${totalCount} on ${output?.date}`;
      }
      return output?.message || "Ferry availability checked";
    },
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
};

export function ToolDisplay({ type, state, output }: ToolDisplayProps) {
  const tool = toolInfo[type as keyof typeof toolInfo];

  if (!tool) return null;

  const isPending = state === "pending";
  const isStreaming = state === "streaming";
  const isComplete = state === "output-available";

  if (!isPending && !isStreaming && !isComplete) return null;

  const getIcon = () => {
    if (isPending || isStreaming) {
      return <Loader2 className="size-4 animate-spin" />;
    }
    return <CheckCircle2 className="size-4" />;
  };

  const getText = () => {
    if (isPending) return tool.pendingText;
    if (isStreaming) return tool.streamingText;
    if (isComplete) return tool.getCompletedText(output);
    return "";
  };

  const getStyles = () => {
    if (isPending || isStreaming) {
      return "bg-muted/50 text-muted-foreground";
    }
    return `${tool.bgColor} ${tool.textColor}`;
  };

  return (
    <div className={`flex items-center gap-2 text-sm p-3 rounded-lg my-2 ${getStyles()}`}>
      {getIcon()}
      <span>
        {tool.icon} {tool.name}: {getText()}
      </span>
    </div>
  );
}