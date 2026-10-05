import Image from "next/image";
import { getScene } from "@/lib/scenes";
import type { FeedCaption } from "@/lib/captions";
import VoteButtons from "./VoteButtons";

export default function CaptionCard({ caption, userId }: { caption: FeedCaption; userId: string }) {
  const scene = getScene(caption.scene_id);
  if (!scene) return null;
  return <article className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
    <figure>
      <Image src={scene.image} alt={scene.alt} width={600} height={360} className="h-auto w-full" />
      <figcaption className="p-6 pb-4">
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-zinc-400"><span>{scene.title}</span><span className="rounded-full border border-white/10 px-2 py-1">AI caption · {caption.style}</span></div>
        <p className="min-h-16 text-lg font-medium leading-relaxed text-white">{caption.caption}</p>
      </figcaption>
    </figure>
    <div className="px-6 pb-6">
      <div className="mb-4 flex items-center gap-3 text-xs text-zinc-400"><span className="font-semibold text-amber-300">{caption.upvotes - caption.downvotes} score</span><span>{caption.upvotes} funny · {caption.downvotes} not quite</span></div>
      <VoteButtons captionId={caption.id} initialVote={caption.myVote} own={caption.user_id === userId} />
      <details className="mt-4 border-t border-white/10 pt-3 text-xs text-zinc-500"><summary className="cursor-pointer">The moment behind the joke</summary><p className="mt-2 leading-relaxed text-zinc-400">{caption.user_prompt}</p></details>
    </div>
  </article>;
}
