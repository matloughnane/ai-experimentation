"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader } from "lucide-react";
import { useState } from "react";
import { WeatherCard } from "./weather-card";

export function ChatUI() {
  const [inputValue, setInputValue] = useState("");
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "http://localhost:4111/chat/weatherAgent",
    }),
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage({ text: inputValue });
  };

  return (
    <div>
      <div>
        {messages.map((message) => (
          <div key={message.id}>
            {message.parts.map((part, index) => {
              // Handle user text messages
              if (part.type === "text" && message.role === "user") {
                return <p key={index}>{part.text}</p>;
              }

              // Handle weather tool output
              if (part.type === "tool-weatherTool") {
                switch (part.state) {
                  case "input-available":
                    return <Loader key={index} />;
                  case "output-available":
                    return (
                      <p key={index} className="text-[12px]">
                        {JSON.stringify(part.output, null, 2)}
                      </p>
                    );
                  // return (
                  //   <WeatherCard
                  //     key={index}
                  //     {...(typeof part.output === "object" && part.output
                  //       ? part.output
                  //       : {})}
                  //   />
                  // );
                  case "output-error":
                    return <div key={index}>Error: {part.errorText}</div>;
                  default:
                    return null;
                }
              }

              return null;
            })}
          </div>
        ))}
      </div>
      <form onSubmit={handleFormSubmit}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Name of the city"
        />
      </form>
    </div>
  );
}
