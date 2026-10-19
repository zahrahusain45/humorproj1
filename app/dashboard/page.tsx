import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { loadFeed } from "@/lib/feed";
import { createClient } from "@/lib/supabase/server";
import CaptionCard from "@/components/CaptionCard";

export default async function DashboardPage() {
  const user = await requireUser();
  const [{ captions, error }, supabase] = await Promise.all([loadFeed(user.id, { mine: true }), createClient()]);
  const [votes, generations] = await Promise.all([
    supabase.from("humor_votes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("humor_captions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  return <main className="mx-auto max-w-5xl px-6 py-12 text-rose-950">
    <h1 className="text-4xl font-bold">My captions</h1><p className="mt-3 break-words text-[#875e74]">Your jokes, their scores, and your votes.</p>
    <Link href="/" className="mt-4 inline-block font-semibold text-rose-700">Browse everyone’s jokes →</Link>
    <div className="my-8 grid grid-cols-2 gap-4"><div className="rounded-2xl border border-pink-200 bg-white p-6"><p className="text-3xl font-bold text-rose-700">{generations.error ? "—" : generations.count ?? 0}</p><p className="mt-2 text-sm text-[#875e74]">Captions created</p></div><div className="rounded-2xl border border-pink-200 bg-white p-6"><p className="text-3xl font-bold text-rose-700">{votes.error ? "—" : votes.count ?? 0}</p><p className="mt-2 text-sm text-[#875e74]">Votes cast</p></div></div>
    <div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">Your latest captions</h2><Link href="/create" className="font-semibold text-rose-700">Create another →</Link></div>
    {error ? <p role="alert" className="text-[#875e74]">Your activity is temporarily unavailable. Please try again later.</p> : captions.length ? <div className="caption-feed grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">{captions.map(caption => <CaptionCard key={caption.id} caption={caption} userId={user.id} />)}</div> : <p className="rounded-2xl border border-pink-200 p-8 text-[#875e74]">Your first punchline is waiting. Create a caption to see it here.</p>}
  </main>;
}
