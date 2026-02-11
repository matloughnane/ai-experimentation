"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Fragment, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { CopyIcon, ExternalLinkIcon, GlobeIcon, RefreshCcwIcon } from "lucide-react";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Loader } from "@/components/ai-elements/loader";
import { DefaultChatTransport } from "ai";
import { ToolDisplay, FerryBookingButtons, CommunityPageCards } from "./tool-display";
import { config } from "@/lib/config";

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) {
    return null;
  }
  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
};
const models = [
  {
    name: "GPT 4o",
    value: "openai/gpt-4o",
  },
  {
    name: "Deepseek R1",
    value: "deepseek/deepseek-r1",
  },
];
const handlePageAction = (pageId: string) => {
  console.log("Page action triggered for ID:", pageId);
};

const ChatBotDemo = () => {
  const [input, setInput] = useState("");
  const [model, setModel] = useState<string>(models[0].value);
  const [webSearch, setWebSearch] = useState(false);
  const { messages, sendMessage, status, regenerate } = useChat({
    transport: new DefaultChatTransport({
      api: config.agentApiUrl,
    }),
  });
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      console.log("catch has attach");
      return;
    }
    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: message.files,
      },
      {
        body: {
          //   model: model,
          //   webSearch: webSearch,
        },
      },
    );
    setInput("");
  };
  return (
    <div
      className="max-w-4xl mx-auto p-4 sm:p-6 relative size-full h-dvh sm:h-[95vh] rounded-lg"
      style={{ backgroundColor: config.appBgColor }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 pb-3 border-b border-border/40 mb-3">
          <img
            src={`${config.appFaviconPath}/apple-touch-icon.png`}
            alt={config.appTitle}
            className="size-10 rounded-lg shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1
              className="font-bold text-xl leading-tight"
              style={{ color: config.appPrimaryColor }}
            >
              {config.appTitle}
            </h1>
            <p className="text-sm text-muted-foreground">{config.appDescription}</p>
          </div>
          {config.appWebsite && (
            <a
              href={config.appWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              Website
              <ExternalLinkIcon className="size-3" />
            </a>
          )}
        </div>
        <Conversation className="flex-1 min-h-0">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === "assistant" &&
                  message.parts.filter((part) => part.type === "source-url")
                    .length > 0 && (
                    <Sources>
                      <SourcesTrigger
                        count={
                          message.parts.filter(
                            (part) => part.type === "source-url",
                          ).length
                        }
                      />
                      {message.parts
                        .filter((part) => part.type === "source-url")
                        .map((part, i) => (
                          <SourcesContent key={`${message.id}-${i}`}>
                            <Source
                              key={`${message.id}-${i}`}
                              href={part.url}
                              title={part.url}
                            />
                          </SourcesContent>
                        ))}
                    </Sources>
                  )}
                {message.parts.map((part, i) => {
                  if (part.type.startsWith("tool-")) {
                    if (!config.showToolsOutput) return null;
                    const toolPart = part as unknown as {
                      type: string;
                      state: string;
                      output?: unknown;
                    };
                    return (
                      <ToolDisplay
                        key={i}
                        type={toolPart.type}
                        state={toolPart.state}
                        output={toolPart.output}
                      />
                    );
                  }
                  switch (part.type) {
                    case "text":
                      return (
                        <Message key={`${message.id}-${i}`} from={message.role}>
                          <MessageContent>
                            <MessageResponse>{part.text}</MessageResponse>
                          </MessageContent>
                          {message.role === "assistant" &&
                            i === messages.length - 1 && (
                              <MessageActions>
                                <MessageAction
                                  onClick={() => regenerate()}
                                  label="Retry"
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </MessageAction>
                                <MessageAction
                                  onClick={() =>
                                    navigator.clipboard.writeText(part.text)
                                  }
                                  label="Copy"
                                >
                                  <CopyIcon className="size-3" />
                                </MessageAction>
                              </MessageActions>
                            )}
                        </Message>
                      );
                    case "reasoning":
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={
                            status === "streaming" &&
                            i === message.parts.length - 1 &&
                            message.id === messages.at(-1)?.id
                          }
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    default:
                      return null;
                  }
                })}
                {message.role === "assistant" &&
                  message.parts
                    .filter((part) => {
                      const toolPart = part as unknown as { type: string; state: string; output?: any };
                      return (
                        toolPart.type.startsWith("tool-") &&
                        toolPart.type.toLowerCase().includes("ferry") &&
                        toolPart.state === "output-available" &&
                        toolPart.output != null
                      );
                    })
                    .map((part, i) => {
                      const toolPart = part as unknown as { output: any };
                      return <FerryBookingButtons key={`ferry-buttons-${i}`} output={toolPart.output} />;
                    })}
                {message.role === "assistant" &&
                  (status === "ready" || message.id !== messages[messages.length - 1]?.id) &&
                  message.parts
                    .filter((part) => {
                      const toolPart = part as unknown as { type: string; state: string; output?: any };
                      return (
                        toolPart.type.startsWith("tool-") &&
                        toolPart.type.includes("communityPagesByCategory") &&
                        toolPart.state === "output-available" &&
                        toolPart.output != null
                      );
                    })
                    .map((part, i) => {
                      const toolPart = part as unknown as { output: any };
                      return <CommunityPageCards key={`community-pages-${i}`} output={toolPart.output} onPageAction={handlePageAction} />;
                    })}
              </div>
            ))}
            {(() => {
              const showLoader =
                status === "submitted" ||
                (!config.showToolsOutput &&
                  status === "streaming" &&
                  messages.length > 0 &&
                  (() => {
                    const lastMsg = messages[messages.length - 1];
                    return (
                      lastMsg.role === "assistant" &&
                      !lastMsg.parts.some((p) => p.type === "text")
                    );
                  })());
              if (!showLoader) return null;
              return (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader />
                  <span>Thinking...</span>
                </div>
              );
            })()}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <PromptInput onSubmit={handleSubmit} className="shrink-0 mt-2" globalDrop multiple>
          <PromptInputHeader>
            <PromptInputAttachmentsDisplay />
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              placeholder={config.appPlaceholder}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              {/* <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments />
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>
              <PromptInputButton
                variant={webSearch ? "default" : "ghost"}
                onClick={() => setWebSearch(!webSearch)}
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
              <PromptInputSelect
                onValueChange={(value) => {
                  setModel(value);
                }}
                value={model}
              >
                <PromptInputSelectTrigger>
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {models.map((model) => (
                    <PromptInputSelectItem
                      key={model.value}
                      value={model.value}
                    >
                      {model.name}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect> */}
            </PromptInputTools>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
};
export default ChatBotDemo;
