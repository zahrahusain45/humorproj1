"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteCaption({ captionId }: { captionId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/captions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ captionId }) });
      const data = await response.json();
      if (response.status === 401) { router.replace("/login"); router.refresh(); return; }
      if (!response.ok) { setError(data.error || "Could not delete your caption."); return; }
      setConfirming(false); router.refresh();
    } catch { setError("Could not confirm deletion. Check your captions before retrying."); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 border-t border-white/10 pt-4">
    {confirming ? <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4">
      <p className="text-sm font-semibold text-white">Delete this caption?</p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">This permanently removes the post, its photo, and its votes. This cannot be undone.</p>
      <div className="mt-4 flex gap-3"><button type="button" disabled={busy} onClick={remove} className="rounded-lg bg-rose-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{busy ? "Deleting…" : "Delete permanently"}</button><button type="button" disabled={busy} onClick={() => { setConfirming(false); setError(""); }} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-300">Cancel</button></div>
    </div> : <button type="button" onClick={() => setConfirming(true)} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-rose-300"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></svg>Delete caption</button>}
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
  </div>;
}
