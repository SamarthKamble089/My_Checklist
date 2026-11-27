// src/components/ChatPage.jsx
import { useState, useRef, useEffect } from "react";
import { signOut } from "firebase/auth";
import { collection, addDoc, query, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { parseActivityMessage, answerAboutLog } from "../gemini";
import { useEntries } from "../useEntries";
import ViewDoc from "./ViewDoc";
import ExportModal from "./ExportModal";

export default function ChatPage({ user }) {
  const defaultWelcome = {
    id: "welcome",
    role: "ai",
    text: `Hey ${user.displayName?.split(" ")[0] || "there"}! 👋 Tell me what you did today in plain English. I'll extract key action keywords with the exact date and time, and log them to your document! (e.g. "I completed my EL project today at 4")`,
  };

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`chat_${user.uid}`);
      return saved ? JSON.parse(saved) : [defaultWelcome];
    } catch {
      return [defaultWelcome];
    }
  });

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const { entries, loading, error: firestoreError, addEntry } = useEntries(user.uid);

  // Sync messages from Firestore & save to localStorage
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "users", user.uid, "messages"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          setMessages(list);
          try {
            localStorage.setItem(`chat_${user.uid}`, JSON.stringify(list));
          } catch {}
        }
      },
      (err) => {
        console.warn("Messages firestore snapshot note:", err);
      }
    );

    return unsub;
  }, [user.uid]);

  // Keep localStorage updated on message changes
  useEffect(() => {
    try {
      localStorage.setItem(`chat_${user.uid}`, JSON.stringify(messages));
    } catch {}
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, user.uid]);

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

  async function persistMessage(msg) {
    try {
      await addDoc(collection(db, "users", user.uid, "messages"), {
        ...msg,
        timestamp: Date.now(),
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Could not save message to Firestore (cached in localStorage):", e);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    // Add user message
    const userMsg = { id: Date.now().toString(), role: "user", text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    persistMessage(userMsg);
    setInput("");
    setSending(true);

    try {
      const parsed = await parseActivityMessage(text, getCurrentDateTime());

      // Show Gemini's reply immediately
      const isLogged = !!(parsed.subject && parsed.activity);
      const aiMsg = {
        id: Date.now().toString() + "_ai",
        role: "ai",
        text: parsed.reply,
        logged: isLogged,
        entryData: isLogged
          ? {
              subject: parsed.subject,
              activity: parsed.activity,
              date: parsed.date,
              time: parsed.time,
            }
          : null,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      persistMessage(aiMsg);

      // Save to Firestore in background without delaying chat response
      if (parsed.subject && parsed.activity) {
        addEntry({
          raw: text,
          subject: parsed.subject,
          activity: parsed.activity,
          date: parsed.date,
          time: parsed.time,
        }).catch((err) => console.error("Error saving entry to Firestore:", err));
      }
    } catch (err) {
      console.error("Error processing message:", err);
      const errMsg = {
        id: Date.now().toString() + "_err",
        role: "ai",
        text: `⚠️ Something went wrong: ${err.message || "Please check your Gemini API key."}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
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
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>📄</span>
            <span>View Log</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors shadow"
          >
            <span>📥</span>
            <span>Export Doc</span>
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
          {!loading && !firestoreError && (
            <span className="text-slate-500 text-xs">· {entries.length} entries</span>
          )}
          {firestoreError && (
            <span className="text-amber-400 text-xs" title={firestoreError}>
              · rules need publish
            </span>
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
                <div className="mt-2.5 pt-2 border-t border-slate-600/70 flex flex-col gap-2">
                  {msg.entryData && (
                    <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-600/60 flex flex-col gap-1.5 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {msg.entryData.date && (
                          <span className="flex items-center gap-1 bg-amber-950/80 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-600/50">
                            📅 {msg.entryData.date}
                          </span>
                        )}
                        {msg.entryData.time && (
                          <span className="flex items-center gap-1 bg-cyan-950/80 text-cyan-300 font-bold px-2 py-0.5 rounded border border-cyan-600/50">
                            ⏰ {msg.entryData.time}
                          </span>
                        )}
                        {msg.entryData.subject && (
                          <span className="bg-indigo-950/80 text-indigo-300 font-bold px-2 py-0.5 rounded border border-indigo-600/50">
                            🏷️ {msg.entryData.subject}
                          </span>
                        )}
                      </div>
                      <div className="text-white text-xs font-semibold pt-0.5">
                        <span className="text-indigo-300 font-bold">Keywords: </span>
                        {msg.entryData.activity}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Logged to your document</span>
                  </div>
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
      {showDoc && (
        <ViewDoc
          entries={entries}
          error={firestoreError}
          onClose={() => setShowDoc(false)}
        />
      )}

      {/* Export Document modal */}
      {showExport && (
        <ExportModal
          entries={entries}
          user={user}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
