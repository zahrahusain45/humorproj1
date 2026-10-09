import Image from "next/image";
import { getScene } from "@/lib/scenes";
import type { FeedCaption } from "@/lib/captions";
import VoteButtons from "./VoteButtons";

export default function CaptionCard({ caption, userId }: { caption: FeedCaption; userId: string }) {
  const scene = getScene(caption.scene_id);
  if (!scene && !caption.image_data_url) return null;
  return <article className="post-card overflow-hidden">
    <div className="flex items-center justify-between px-6 py-5 text-sm"><p className="font-medium text-zinc-200">{caption.user_id === userId ? "Your post" : `${caption.author_name || "Member"} · ${caption.user_id.slice(0,6)}`}</p><time dateTime={caption.created_at} className="text-xs text-zinc-500">{new Intl.DateTimeFormat("en-US", {month:"short", day:"numeric", timeZone:"America/New_York"}).format(new Date(caption.created_at))}</time></div>
    <figure>
      <Image src={caption.image_data_url || scene!.image} alt={scene?.alt || "Community uploaded photo"} unoptimized={!!caption.image_data_url} width={600} height={360} className="h-72 w-full object-contain bg-[#141419]" />
      <figcaption className="p-6 pb-5">
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-zinc-400"><span>{scene?.title || "Uploaded photo"}</span><span className="rounded-full bg-white/5 px-3 py-1.5">AI caption · {caption.style}</span></div>
        <p className="min-h-16 text-2xl font-semibold leading-snug tracking-tight text-white">{caption.caption}</p>
      </figcaption>
    </figure>
    <div className="px-6 pb-6">
      <VoteButtons captionId={caption.id} initialVote={caption.myVote} own={caption.user_id === userId} upvotes={caption.upvotes} downvotes={caption.downvotes} />
      <details className="mt-4 border-t border-white/10 pt-3 text-xs text-zinc-500"><summary className="cursor-pointer">The moment behind the joke</summary><p className="mt-2 leading-relaxed text-zinc-400">{caption.user_prompt}</p></details>
    </div>
  </article>;
}
