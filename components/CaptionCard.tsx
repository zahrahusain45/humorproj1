import Image from "next/image";
import { getScene } from "@/lib/scenes";
import type { FeedCaption } from "@/lib/captions";
import VoteButtons from "./VoteButtons";

export default function CaptionCard({ caption, userId }: { caption: FeedCaption; userId: string }) {
  const scene = getScene(caption.scene_id);
  if (!scene && !caption.image_data_url) return null;
  return <article className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
    <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 text-sm"><p className="font-medium text-zinc-200">Posted by {caption.user_id === userId ? "you" : `${caption.author_name || "Member"} · ${caption.user_id.slice(0,6)}`}</p><time dateTime={caption.created_at} className="text-xs text-zinc-500">{new Intl.DateTimeFormat("en-US", {month:"short", day:"numeric", timeZone:"America/New_York"}).format(new Date(caption.created_at))}</time></div>
    <figure>
      <Image src={caption.image_data_url || scene!.image} alt={scene?.alt || "Community uploaded photo"} unoptimized={!!caption.image_data_url} width={600} height={360} className="h-64 w-full object-contain bg-black" />
      <figcaption className="p-6 pb-4">
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-zinc-400"><span>{scene?.title || "Uploaded photo"}</span><span className="rounded-full border border-white/10 px-2 py-1">AI caption · {caption.style}</span></div>
        <p className="min-h-16 text-2xl font-semibold leading-relaxed text-white">{caption.caption}</p>
      </figcaption>
    </figure>
    <div className="px-6 pb-6">
      <div className="mb-4 flex items-center gap-3 text-xs text-zinc-400"><span className="font-semibold text-amber-300">{caption.upvotes - caption.downvotes} score</span><span>{caption.upvotes} funny · {caption.downvotes} not quite</span></div>
      <VoteButtons captionId={caption.id} initialVote={caption.myVote} own={caption.user_id === userId} />
      <details className="mt-4 border-t border-white/10 pt-3 text-xs text-zinc-500"><summary className="cursor-pointer">The moment behind the joke</summary><p className="mt-2 leading-relaxed text-zinc-400">{caption.user_prompt}</p></details>
    </div>
  </article>;
}
