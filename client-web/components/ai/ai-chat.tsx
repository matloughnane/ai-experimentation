"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useState, useRef, useEffect } from "react";

export default function AIChat() {
  const { messages, sendMessage, addToolResult } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),

    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,

    // run client-side tools that are automatically executed:
    async onToolCall({ toolCall }) {
      // Check if it's a dynamic tool first for proper type narrowing
      if (toolCall.dynamic) {
        return;
      }

      if (toolCall.toolName === "getLocation") {
        const cities = ["New York", "Los Angeles", "Chicago", "San Francisco"];

        // No await - avoids potential deadlocks
        addToolResult({
          tool: "getLocation",
          toolCallId: toolCall.toolCallId,
          output: cities[Math.floor(Math.random() * cities.length)],
        });
      }
    },
  });
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="w-full max-w-2xl h-full mx-auto flex flex-col bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold py-4 border-b px-6">AI Chat</h1>
      <ScrollArea
        className="flex-1 max-h-[calc(100vh-140px)]"
        ref={scrollAreaRef}
      >
        <div className="space-y-6 p-6 w-full">
          {messages?.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold shadow-sm ${
                  message.role === "user" ? "bg-blue-600" : "bg-emerald-600"
                }`}
              >
                {message.role === "user" ? "User" : "AI"}
              </div>

              {/* Message Content */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-gray-100 text-gray-900 rounded-bl-md"
                }`}
              >
                {message.parts.map((part, index) => {
                  switch (part.type) {
                    // render text parts as simple text:
                    case "text":
                      return <span key={index}>{part.text}</span>;
                    case "step-start":
                      // show step boundaries as horizontal lines:
                      return index > 0 ? (
                        <div key={index} className="text-gray-500">
                          {/* <hr className="my-2 border-gray-300" /> */}
                        </div>
                      ) : null;
                    // for tool parts, use the typed tool part names:
                    case "tool-askForConfirmation": {
                      const callId = part.toolCallId;

                      switch (part.state) {
                        case "input-streaming":
                          return (
                            <div key={callId}>
                              Loading confirmation request...
                            </div>
                          );
                        case "input-available":
                          return (
                            <div key={callId}>
                              {(part.input as { message: string }).message}
                              <div>
                                <button
                                  onClick={() =>
                                    addToolResult({
                                      tool: "askForConfirmation",
                                      toolCallId: callId,
                                      output: "Yes, confirmed.",
                                    })
                                  }
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() =>
                                    addToolResult({
                                      tool: "askForConfirmation",
                                      toolCallId: callId,
                                      output: "No, denied",
                                    })
                                  }
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          );
                        case "output-available":
                          return (
                            <div key={callId}>
                              Location access allowed: {part.output as string}
                            </div>
                          );
                        case "output-error":
                          return (
                            <div key={callId}>Error: {part.errorText}</div>
                          );
                      }
                      break;
                    }

                    case "tool-getLocation": {
                      const callId = part.toolCallId;

                      switch (part.state) {
                        case "input-streaming":
                          return (
                            <div key={callId}>
                              Preparing location request...
                            </div>
                          );
                        case "input-available":
                          return <div key={callId}>Getting location...</div>;
                        case "output-available":
                          return (
                            <div key={callId}>
                              Location: {(part.output as string) ?? ""}
                            </div>
                          );
                        case "output-error":
                          return (
                            <div key={callId}>
                              Error getting location: {part.errorText}
                            </div>
                          );
                      }
                      break;
                    }

                    // case "tool-getWeatherInformation": {
                    //   const callId = part.toolCallId;

                    //   switch (part.state) {
                    //     case "input-streaming":
                    //       return (
                    //         <pre key={callId}>{JSON.stringify(part, null, 2)}</pre>
                    //       );
                    //     case "input-available":
                    //       return (
                    //         <div key={callId}>
                    //           Getting weather information for{" "}
                    //           {(part.input as { city: string }).city}...
                    //         </div>
                    //       );
                    //     case "output-available":
                    //       return (
                    //         <div key={callId}>
                    //           Weather in {(part.input as { city: string }).city}:{" "}
                    //           {part.output as string}
                    //         </div>
                    //       );
                    //     case "output-error":
                    //       return (
                    //         <div key={callId}>
                    //           Error getting weather for{" "}
                    //           {(part.input as { city: string }).city}:{" "}
                    //           {part.errorText as string}
                    //         </div>
                    //       );
                    //   }
                    //   break;
                    // }

                    // Dynamic tools use generic `dynamic-tool` type
                    case "dynamic-tool":
                      return (
                        <div key={index}>
                          <h4>Tool: {part.toolName}</h4>
                          {part.state === "input-streaming" && (
                            <pre>{JSON.stringify(part.input, null, 2)}</pre>
                          )}
                          {part.state === "output-available" && (
                            <pre>{JSON.stringify(part.output, null, 2)}</pre>
                          )}
                          {part.state === "output-error" && (
                            <div>Error: {part.errorText}</div>
                          )}
                        </div>
                      );

                    default:
                      return (
                        <span key={index} className="font-mono">
                          Message Type: {part.type}
                        </span>
                      );
                  }
                })}
                {/* <pre className="text-xs bg-gray-100 p-2 rounded-md mt-2">
                {JSON.stringify(message, null, 2)}
              </pre> */}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t bg-gray-50 p-4 rounded-b-lg">
        <div className="w-full max-w-2xl mx-auto flex flex-row gap-3">
          <Input
            className="flex-1"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim() !== "") {
                sendMessage({ text: input });
                setInput("");
              }
            }}
          />
          <Button
            className="px-6"
            onClick={() => {
              if (input.trim() == "") {
                return;
              }
              sendMessage({ text: input });
              setInput("");
            }}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
