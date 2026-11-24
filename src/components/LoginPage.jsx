// src/components/LoginPage.jsx
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-2xl shadow-2xl p-8 flex flex-col gap-6">
        {/* Logo / Title */}
        <div className="text-center">
          <div className="text-4xl mb-2">📋</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">Your personal activity log</p>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-slate-700 rounded-xl p-1">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "login"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "signup"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmail} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-600" />
          <span className="text-slate-500 text-xs">or</span>
          <div className="flex-1 h-px bg-slate-600" />
        </div>

        {/* Google Sign-in */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-50 text-slate-800 font-semibold py-3 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3L37.1 9.7C34 6.9 29.2 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
            <path fill="#FF3D00" d="m6.3 15.1 6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3L37.1 9.7C34 6.9 29.2 5 24 5c-7.7 0-14.4 4.2-17.7 10.1z"/>
            <path fill="#4CAF50" d="M24 45c5.1 0 9.8-1.9 13.3-5.1l-6.1-5.2C29.3 36.5 26.8 37.5 24 37.5c-5.3 0-9.8-3.5-11.3-8.2l-6.5 5C9.5 40.6 16.2 45 24 45z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.1-2.1 3.9-3.8 5.2l6.1 5.2C37.1 38 44 33 44 25c0-1.3-.1-2.6-.4-3.9z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
