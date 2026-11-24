// src/components/ChatPage.jsx
import { useState, useRef, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { parseActivityMessage, answerAboutLog } from "../gemini";
import { useEntries } from "../useEntries";
import ViewDoc from "./ViewDoc";

export default function ChatPage({ user }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "ai",
      text: `Hey ${user.displayName?.split(" ")[0] || "there"}! 👋 Tell me what you did today and I'll log it for you. For example: "I completed my EL project today at 4"`,
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { entries, loading, addEntry } = useEntries(user.uid);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function getCurrentDateTime() {
    return new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    // Add user message
    const userMsg = { id: Date.now().toString(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const parsed = await parseActivityMessage(text, getCurrentDateTime());

      // If Gemini extracted an activity, save it to Firestore
      if (parsed.subject && parsed.activity) {
        await addEntry({
          raw: text,
          subject: parsed.subject,
          activity: parsed.activity,
          date: parsed.date,
          time: parsed.time,
        });
      }

      // Show Gemini's reply
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_ai",
          role: "ai",
          text: parsed.reply,
          logged: !!(parsed.subject && parsed.activity),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_err",
          role: "ai",
          text: "⚠️ Something went wrong. Please check your Gemini API key.",
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-800/80 backdrop-blur border-b border-slate-700 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <span className="text-white font-bold text-lg tracking-tight">Tracker</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDoc(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>📄</span>
            <span>View Log</span>
          </button>
          <button
            onClick={() => signOut(auth)}
            title="Sign out"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* User pill */}
      <div className="flex justify-center pt-3">
        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-full px-3 py-1">
          {user.photoURL ? (
            <img src={user.photoURL} className="w-5 h-5 rounded-full" alt="avatar" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-bold">
              {(user.email?.[0] || "U").toUpperCase()}
            </div>
          )}
          <span className="text-slate-300 text-xs">{user.email}</span>
          {!loading && (
            <span className="text-slate-500 text-xs">· {entries.length} entries</span>
          )}
        </div>
      </div>

      {/* Chat messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 max-w-2xl w-full mx-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-slate-700 text-slate-100 rounded-bl-sm"
              }`}
            >
              {msg.text}
              {msg.logged && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-green-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Logged to your document
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input bar */}
      <footer className="sticky bottom-0 bg-slate-900/90 backdrop-blur border-t border-slate-700 px-4 py-3">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what you did today..."
            rows={1}
            className="flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-center text-slate-600 text-xs mt-1.5">Enter to send · Shift+Enter for new line</p>
      </footer>

      {/* View Document modal */}
      {showDoc && <ViewDoc entries={entries} onClose={() => setShowDoc(false)} />}
    </div>
  );
}
