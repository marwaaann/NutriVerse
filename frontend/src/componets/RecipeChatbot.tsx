import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, Bot, X, HelpCircle, AlertCircle } from "lucide-react";

interface RecipeChatbotProps {
  recipeId?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  message: string;
}

const SUGGESTED_QUESTIONS = [
  "What ingredients are used?",
  "How many calories?",
  "How much protein?",
  "How can I make this healthier?",
  "Which ingredient has the most calories?",
];

export const RecipeChatbot: React.FC<RecipeChatbotProps> = ({ recipeId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeRecipeId = recipeId || "general";

  // Reset messages when opened or closed
  useEffect(() => {
    setMessages([]);
    setChatError(null);
  }, [isOpen, activeRecipeId]);

  // WebSocket Connection
  useEffect(() => {
    if (!isOpen) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      setStatus("disconnected");
      return;
    }

    setStatus("connecting");
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const wsUrl = backendUrl.replace(/^http/, "ws");

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "CHAT_RESPONSE") {
          setIsTyping(false);
          setChatError(null);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", message: data.message },
          ]);
        } else if (data.type === "ERROR") {
          setIsTyping(false);
          setChatError(data.message);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
    };

    ws.onerror = () => {
      setStatus("disconnected");
    };

    return () => {
      ws.close();
    };
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, chatError]);

  const handleSendMessage = (text: string) => {
    if (!text.trim() || !socketRef.current || status !== "connected") return;

    setChatError(null);
    const payload = {
      type: "CHAT_MESSAGE",
      recipeId: activeRecipeId,
      message: text,
    };
    socketRef.current.send(JSON.stringify(payload));

    setMessages((prev) => [...prev, { role: "user", message: text }]);
    setInputMessage("");
    setIsTyping(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage(inputMessage);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-full p-4 shadow-xl transition-all hover:scale-105 duration-200 cursor-pointer"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        <span className="font-semibold text-sm">Ask AI</span>
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="p-4 bg-amber-500 dark:bg-amber-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <h3 className="font-bold text-sm">AI Recipe Assistant</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`h-2 w-2 rounded-full ${
                    status === "connected" ? "bg-green-300 animate-pulse" : status === "connecting" ? "bg-yellow-300 animate-pulse" : "bg-red-400"
                  }`} />
                  <span className="text-[10px] opacity-90 capitalize font-semibold">{status}</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-amber-600 dark:hover:bg-zinc-800/40 p-1 rounded transition-colors cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-50 dark:bg-zinc-950">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 dark:text-zinc-500 text-center p-4 space-y-2">
                <Bot className="h-10 w-10 opacity-50 text-amber-500" />
                <p className="text-xs leading-relaxed">
                  Hi! Ask me anything about this recipe's nutrition, substitute ingredients, or preparation steps.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2.5 max-w-[85%] ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-amber-500 text-white rounded-tr-none"
                      : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded-tl-none shadow-sm"
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))
            )}

            {/* Custom Inline Error Prompt */}
            {chatError && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto">
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-3 rounded-2xl rounded-tl-none shadow-sm space-y-2 text-xs">
                  <div className="flex items-center gap-1 text-red-750 dark:text-red-400 font-bold">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Sorry, I couldn't process that request.
                  </div>
                  <button
                    onClick={() => {
                      const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.message;
                      if (lastUserMsg) handleSendMessage(lastUserMsg);
                    }}
                    className="px-2.5 py-1 bg-red-650 hover:bg-red-750 text-white font-bold rounded text-[10px] transition cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
            
            {isTyping && (
              <div className="flex gap-2.5 max-w-[80%] mr-auto items-center text-zinc-400">
                <Bot className="h-4 w-4 animate-bounce text-amber-500" />
                <span className="text-xs font-semibold">Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 0 && (
            <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1 mb-1">
                <HelpCircle className="h-3 w-3" /> Suggested Questions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="text-[11px] bg-zinc-100 hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-650 dark:text-zinc-300 px-2.5 py-1 rounded-full text-left transition-colors cursor-pointer font-semibold border border-zinc-200/50 dark:border-zinc-850"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Panel */}
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={status !== "connected"}
              placeholder={status === "connected" ? "Ask a question..." : "Connecting..."}
              className="flex-1 border border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={status !== "connected" || !inputMessage.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg p-2 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

        </div>
      )}
    </>
  );
};
