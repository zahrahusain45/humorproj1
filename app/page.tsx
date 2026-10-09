import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { loadFeed } from "@/lib/feed";
import { getDailyPrompt, getScene } from "@/lib/scenes";
import CaptionCard from "@/components/CaptionCard";

export default async function Home({ searchParams }: { searchParams: Promise<{ sort?: string; caption?: string; view?: string }> }) {
  const user = await requireUser();
  const { sort, caption: captionId, view } = await searchParams;
  const validId = captionId && /^[0-9a-f-]{36}$/i.test(captionId) ? captionId : undefined;
  const { captions, error } = await loadFeed(user.id, { captionId: validId, mine: view === "mine", others: view === "others" });
  const top = sort === "top";
  if (top) captions.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  const daily = getDailyPrompt();
  const scene = getScene(daily.sceneId)!;
  return <main className="mx-auto w-full max-w-5xl px-6 py-12 text-white">
    <div className="flex flex-wrap items-end justify-between gap-6"><div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-300">Campus chaos. NYC energy.</p><h1 className="text-4xl font-bold tracking-tight sm:text-5xl">The joke’s on all of us.</h1><p className="mt-4 max-w-xl text-zinc-400">AI writes the captions. You decide which ones belong in the group chat.</p></div><Link href="/create" className="rounded-xl bg-amber-300 px-5 py-3 font-semibold text-black">Create a caption ↗</Link></div>
    {!validId && <section aria-label="Daily caption challenge" className="my-10 grid overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 sm:grid-cols-[180px_1fr]">
      <Image src={scene.image} alt={scene.alt} width={600} height={360} className="h-full max-h-48 w-full object-cover" />
      <div className="p-5"><p className="text-xs font-semibold uppercase tracking-widest text-amber-300">Today’s prompt · {daily.date}</p><h2 className="mt-2 text-lg font-medium">{daily.prompt}</h2><Link href="/create?daily=1" className="mt-3 inline-block text-sm font-semibold text-amber-300">Give it your spin →</Link></div>
    </section>}
    <div className="mb-6 mt-10 flex items-center justify-between gap-4"><h2 className="text-xl font-semibold">{validId ? "Caption" : view === "mine" ? "My captions" : view === "others" ? "Other members’ jokes" : "Community captions"}</h2><nav aria-label="Feed sorting" className="flex gap-2 text-sm"><Link href={`/?view=${view || "all"}`} aria-current={!top && !validId ? "page" : undefined} className={`rounded-full px-4 py-2 ${!top && !validId ? "bg-white text-black" : "text-zinc-400"}`}>Newest</Link><Link href={`/?sort=top&view=${view || "all"}`} aria-current={top ? "page" : undefined} className={`rounded-full px-4 py-2 ${top ? "bg-white text-black" : "text-zinc-400"}`}>Top</Link></nav></div>
    {!validId && <nav aria-label="Whose captions" className="mb-5 flex flex-wrap gap-3">{[["all","Everyone"],["mine","My captions"],["others","Other members"]].map(([value,label]) => <Link key={value} href={`/?view=${value}&sort=${top ? "top" : "new"}`} aria-current={(view || "all") === value ? "page" : undefined} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${(view || "all") === value ? "border-amber-300 bg-amber-300/10 text-amber-300" : "border-white/15 text-zinc-300"}`}>{label}</Link>)}</nav>}
    <p className="mb-6 text-sm text-zinc-400">Vote ↑ Funny or ↓ Not quite on other members’ captions. One vote per caption; score = funny votes minus not-quite votes.</p>
    {error ? <div role="alert" className="rounded-2xl border border-white/10 p-8 text-zinc-400">The caption feed is temporarily unavailable. Please try again later.</div> : captions.length ? <><div className="grid gap-6 sm:grid-cols-2">{captions.map(caption => <CaptionCard key={caption.id} caption={caption} userId={user.id} />)}</div>{!validId && <p className="mt-6 text-center text-xs text-zinc-500">{top ? "Highest scores among the latest 60 captions." : "Showing the latest 60 captions."}</p>}</> : <section className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center"><h3 className="text-xl font-semibold">{validId ? "Caption not found" : "Be the first to land a joke."}</h3><p className="mx-auto mt-3 max-w-md text-zinc-400">{validId ? "Browse the feed to find more captions." : "Pick a picture, describe your moment, and let AI find the punchline. Your caption will appear here for the community to rate."}</p><Link href={validId ? "/" : "/create"} className="mt-6 inline-block font-semibold text-amber-300">{validId ? "Back to the feed →" : "Create the first caption →"}</Link></section>}
  </main>;
}
