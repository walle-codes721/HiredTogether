import { useState } from "react";
import { login, signup, type User } from "./api";

export default function AuthScreen({ onAuthed }: { onAuthed: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = mode === "signup" ? await signup({ email, password, name, title }) : await login({ email, password });
      onAuthed(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center shadow-inner">
            <span className="text-white text-lg">🤝</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold tracking-tight text-white leading-tight">HiredTogether</span>
            <span className="text-[11px] font-medium text-white/40">Job hunt, with backup</span>
          </div>
        </div>

        <div className="p-7 rounded-2xl bg-[#0f0f13] border border-white/[0.05]">
          <h1 className="text-lg font-semibold text-white mb-1">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-xs text-white/40 mb-6">
            {mode === "signup" ? "Track your search, invite your squad." : "Sign in to your search."}
          </p>

          <form onSubmit={submit} className="flex flex-col gap-3">
            {mode === "signup" && (
              <>
                <input
                  className="h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  className="h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
                  placeholder="Title (e.g. Marketing Lead)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </>
            )}
            <input
              className="h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="h-10 px-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="h-10 rounded-xl bg-white text-black hover:bg-neutral-200 text-sm font-semibold transition-all disabled:opacity-50 mt-1"
            >
              {loading ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <button
            className="w-full text-center text-xs text-white/40 hover:text-white/70 mt-5 transition-colors"
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          >
            {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
