"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn() {
    setBusy(true); setError("");
    try {
      const { data, error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback`, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error("Google sign-in is unavailable. Please try again.");
      window.location.assign(data.url);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not start Google sign-in. Please try again.");
      setBusy(false);
    }
  }
  return <div className="mt-8 space-y-4">
    <button type="button" onClick={signIn} disabled={busy} className="w-full rounded-xl bg-amber-300 px-4 py-3 font-semibold text-black disabled:opacity-50">{busy ? "Connecting…" : "Continue with Google"}</button>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </div>;
}
