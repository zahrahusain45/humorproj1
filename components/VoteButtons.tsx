"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VoteButtons({ captionId, initialVote, upvotes, downvotes }: { captionId: string; initialVote: number | null; upvotes: number; downvotes: number }) {
  const router = useRouter();
  const [vote, setVote] = useState(initialVote);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (!saved) return; const timer = setTimeout(() => setSaved(false), 1000); return () => clearTimeout(timer); }, [saved]);
  const [error, setError] = useState("");
  async function rate(value: number) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ captionId, value }) });
      const data = await response.json();
      if (response.status === 401) { router.replace("/login"); router.refresh(); return; }
      if (!response.ok) { setError(data.error || "Your vote could not be saved."); return; }
      setVote(data.value); setSaved(true); router.refresh();
    } catch { setError("Could not connect. Try again."); }
    finally { setBusy(false); }
  }
  const locked = busy || vote !== null;
  const reactions = [{value: 1, label: "Love it", count: upvotes, icon: "heart"}, {value: -1, label: "Not for me", count: downvotes, icon: "thumb"}];
  return <div>
    <div className="reaction-grid" aria-label="Rate this joke">
      {reactions.map(reaction => {
        const selected = vote === reaction.value;
        const content = <><svg viewBox="0 0 24 24" fill={selected ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">{reaction.icon === "heart" ? <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /> : <path d="M17 3h4v11h-4M17 4H7a3 3 0 0 0-2.9 2.2L2 13a2 2 0 0 0 2 2h5l-1 5a2 2 0 0 0 3 2l6-8V4Z" />}</svg><span className="reaction-count">{reaction.count}</span></>;
        const className = `reaction reaction-${reaction.icon} ${selected ? "reaction-selected" : ""}`;
        return <button key={reaction.value} type="button" disabled={locked} aria-label={`${reaction.value === 1 ? "Upvote" : "Downvote"}: ${reaction.label}`} aria-pressed={selected} onClick={() => rate(reaction.value)} className={className}>{content}</button>;
      })}
    </div>
    {busy && <p role="status" className="mt-3 text-sm text-[#875e74]">Saving your reaction…</p>}
    {saved && <p role="status" className="mt-3 text-sm text-[#875e74]">Your reaction is saved ✓</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </div>;
}
