"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VoteButtons({ captionId, initialVote, own }: { captionId: string; initialVote: number | null; own: boolean }) {
  const router = useRouter();
  const [vote, setVote] = useState(initialVote);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function rate(value: number) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ captionId, value }) });
      const data = await response.json();
      if (response.status === 401) { router.replace("/login"); router.refresh(); return; }
      if (!response.ok) { setError(data.error || "Your vote could not be saved."); return; }
      setVote(data.value); router.refresh();
    } catch { setError("Could not connect. Try again."); }
    finally { setBusy(false); }
  }
  if (own) return <p className="text-xs text-zinc-500">Your caption · let the community decide.</p>;
  const locked = busy || vote !== null;
  return <div>
    <div className="flex flex-wrap gap-2">
      <button disabled={locked} aria-pressed={vote === 1} onClick={() => rate(1)} className={`vote-button ${vote === 1 ? "vote-selected" : ""}`}>↑ Funny</button>
      <button disabled={locked} aria-pressed={vote === -1} onClick={() => rate(-1)} className={`vote-button ${vote === -1 ? "vote-selected" : ""}`}>↓ Not quite</button>
      {busy && <span role="status" className="self-center text-xs text-zinc-400">Saving…</span>}
    </div>
    {vote !== null && <p role="status" className="mt-2 text-xs text-zinc-400">Vote saved. One vote per caption.</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
  </div>;
}
