"use client";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const { error } = await createClient().auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else setMessage("Check your email for a sign-in link. Open it in this browser to see the jokes.");
    } catch { setError("Could not send the sign-in link. Please try again."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="mt-8 space-y-4">
    <label htmlFor="email" className="block text-sm text-zinc-300">Email address</label>
    <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-white/20 bg-black px-4 py-3 text-white focus:outline-2 focus:outline-amber-300" />
    <button disabled={busy} className="w-full rounded-xl bg-amber-300 px-4 py-3 font-semibold text-black disabled:opacity-50">{busy ? "Sending…" : "Email me a sign-in link"}</button>
    {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </form>;
}
