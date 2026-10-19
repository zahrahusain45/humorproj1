"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthButton() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true); setError("");
    try {
      const { error } = await createClient().auth.signOut();
      if (error) { setError(error.message); setBusy(false); return; }
      router.replace("/login");
      router.refresh();
    } catch { setError("Could not sign out. Please try again."); setBusy(false); }
  }
  return <div><button disabled={busy} onClick={logout} className="soft-button rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? "Signing out…" : "Sign out"}</button>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}
