"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export function AccountPanel() {
  const { enabled, user, loading, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!enabled) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold">Accounts are coming soon</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Cloud sync isn&apos;t configured for this site yet. For now your
          progress is saved on this device — no account needed.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="card text-ink-muted">Loading…</div>;
  }

  if (user) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold">You&apos;re signed in</h2>
        <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
        <p className="mt-3 text-sm text-ink-muted">
          Your journey progress, selected state, and tracker now sync to your
          account and follow you across devices.
        </p>
        <button type="button" className="btn-secondary mt-4" onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const fn = mode === "signin" ? signIn : signUp;
    const res = await fn(email, password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else if (res.needsConfirmation) {
      setInfo("Check your email to confirm your account, then sign in.");
      setMode("signin");
    }
    // On success with a session, useAuth updates and this re-renders signed-in.
  }

  return (
    <div className="card max-w-md">
      <h2 className="text-lg font-semibold">
        {mode === "signin" ? "Sign in" : "Create your account"}
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        Sync your progress, state, and tracker across devices. Free, and we only
        store what you see in the app.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-soft">Password</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {info ? <p className="text-sm text-brand-700">{info}</p> : null}

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        className="mt-4 text-sm font-medium text-brand-700 hover:underline"
        onClick={() => {
          setMode((m) => (m === "signin" ? "signup" : "signin"));
          setError(null);
          setInfo(null);
        }}
      >
        {mode === "signin"
          ? "Need an account? Create one"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
