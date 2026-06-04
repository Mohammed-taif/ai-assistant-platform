"use client";

import { useState, useEffect, useRef } from "react";
import { sendMessage, getHistory } from "@/services/api";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 🔥 Auto scroll to bottom
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🔥 Load chat history
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    if (!token || !username) return;

    const data = await getHistory(username, token);

    const formatted = data.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    setMessages(formatted);
  };

  // 🔥 Send message
  const send = async () => {
    if (!input.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const userMessage = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);

    const messageToSend = input;
    setInput("");

    setLoading(true);

    try {
      const res = await sendMessage(messageToSend, token);

      const aiMessage = {
        role: "assistant",
        content: res.reply,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: AI not responding",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900">

      <div className="w-full max-w-2xl h-[80vh] bg-slate-800 rounded-2xl flex flex-col">

        {/* Header */}
        <div className="p-4 border-b border-slate-700 text-white font-bold">
          AI Chat Assistant
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg max-w-xs text-white ${
                msg.role === "user"
                  ? "bg-blue-600 ml-auto"
                  : "bg-slate-700"
              }`}
            >
              {msg.content}
            </div>
          ))}

          {/* 🔥 Typing indicator */}
          {loading && (
            <div className="bg-slate-700 text-white p-3 rounded-lg w-fit">
              AI is thinking...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-700 flex gap-2">
          <input
            className="flex-1 p-2 rounded bg-slate-700 text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type message..."
            onKeyDown={(e) => e.key === "Enter" && send()}
          />

          <button
            onClick={send}
            className="bg-blue-600 px-4 py-2 rounded text-white"
          >
            Send
          </button>
        </div>

      </div>
    </main>
  );
}