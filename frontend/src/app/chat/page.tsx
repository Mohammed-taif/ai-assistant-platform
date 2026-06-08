"use client";

import {
  useEffect,
  useState,
  useRef,
} from "react";

import ReactMarkdown from "react-markdown";
import { Copy } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useRouter } from "next/navigation";
import {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation,
  savePartial,
} from "@/services/api";

export default function ChatPage() {

  const router = useRouter();
  const stopRef = useRef(false);
  const conversationIdRef = useRef<number | null>(null); // ✅ only once
  const currentTextRef = useRef("");

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    loadConversations();
  }, []);

  const loadConversations = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const data = await getConversations(token);
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      console.log("Conversation load failed");
    }
  };

  const loadConversation = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const data = await getConversation(id, token);
      conversationIdRef.current = id;
      setConversationId(id);
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      console.log("Chat load failed");
    }
  };

  const handleNewChat = () => {
    conversationIdRef.current = null;
    setConversationId(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (id: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await deleteConversation(id, token);
      if (conversationIdRef.current === id) {
        conversationIdRef.current = null;
        setConversationId(null);
        setMessages([]);
      }
      loadConversations();
    } catch {
      console.log("Delete failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  };

  const send = async () => {
    if (!input.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    stopRef.current = false;
    currentTextRef.current = "";

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    const messageToSend = input;
    setInput("");
    setLoading(true);
    setIsStreaming(true); // ✅ show Stop button immediately

    try {
      const currentConvId = conversationIdRef.current;

      const response = await sendMessage(messageToSend, token, currentConvId || undefined);

      // ✅ If stopped while waiting for API response, bail out
      if (stopRef.current) {
        setLoading(false);
        setIsStreaming(false);
        return;
      }

      const reply = response.reply;

      if (!currentConvId && response.conversation_id) {
        conversationIdRef.current = response.conversation_id;
        setConversationId(response.conversation_id);
        loadConversations();
      }

      let currentText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setLoading(false);

      const words = reply.split(" ");
      for (let i = 0; i < words.length; i++) {
        if (stopRef.current) break;

        currentText += (i === 0 ? "" : " ") + words[i];
        currentTextRef.current = currentText;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: currentText };
          return updated;
        });

        await new Promise((resolve) => setTimeout(resolve, 35));
      }

      setIsStreaming(false);

    } catch {
      setLoading(false);
      setIsStreaming(false);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: AI not responding" }]);
    }
  };

  return (
    <main className="flex h-screen bg-slate-900">

      {/* SIDEBAR */}
      <div className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <button
            onClick={handleNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((chat: any, index: number) => (
            <div
              key={chat.id}
              className="sidebar-chat flex items-center border-b border-slate-800"
            >
              <button
                onClick={() => loadConversation(chat.id)}
                className="flex-1 text-left p-4 text-white hover:bg-slate-800"
              >
                Chat #{index + 1}
              </button>
              <button
                onClick={() => handleDeleteConversation(chat.id)}
                className="text-red-400 px-3"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col">

        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-white text-xl font-bold">AI Chat Assistant</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`message-fade p-3 rounded-xl max-w-[80%] text-white ${
                msg.role === "user" ? "bg-blue-600 ml-auto" : "bg-slate-700"
              }`}
            >
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    code(props) {
                      const { children, className } = props;
                      const match = /language-(\w+)/.exec(className || "");
                      const codeString = String(children).replace(/\n$/, "");
                      return match ? (
                        <div className="relative">
                          <button
                            onClick={() => navigator.clipboard.writeText(codeString)}
                            className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded"
                          >
                            <Copy size={16} />
                          </button>
                          <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div">
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className="bg-slate-800 px-1 py-0.5 rounded">{children}</code>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {loading && (
            <div className="bg-slate-700 text-white p-3 rounded-xl w-fit animate-pulse">
              AI is thinking...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isStreaming && send()}
            placeholder="Type a message..."
            className="flex-1 p-3 rounded-lg bg-slate-700 text-white outline-none"
          />

          {isStreaming ? (
            <button
              onClick={async () => {
                stopRef.current = true;
                setLoading(false);
                setIsStreaming(false);

                const token = localStorage.getItem("token");
                const convId = conversationIdRef.current;
                if (token && convId && currentTextRef.current) {
                  await savePartial(convId, currentTextRef.current, token);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={send}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </main>
  );
}