"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      {
        role: "user",
        content: input,
      },
    ];

    setMessages(newMessages);
    setInput("");

    // Backend connection will go here later
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="w-full max-w-3xl h-[80vh] bg-slate-800 rounded-2xl shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="border-b border-slate-700 p-4">
          <h1 className="text-2xl font-bold text-white">
            🤖 AI Assistant
          </h1>

          <p className="text-sm text-gray-400 mt-1">
            {messages.length} messages
          </p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl max-w-md text-white ${
                  msg.role === "user"
                    ? "bg-blue-600"
                    : "bg-slate-700"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-700 text-white px-4 py-2 rounded-2xl">
                AI is thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-700 p-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && sendMessage()
            }
            placeholder="Type your message..."
            className="flex-1 rounded-xl bg-slate-700 text-white px-4 py-3 outline-none"
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white px-6 py-3 rounded-xl transition"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}