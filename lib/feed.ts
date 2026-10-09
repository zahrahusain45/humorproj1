import { createClient } from "@/lib/supabase/server";
import type { Caption, FeedCaption, VoteCount } from "./captions";

export async function loadFeed(userId: string, options: { mine?: boolean; others?: boolean; captionId?: string } = {}): Promise<{ captions: FeedCaption[]; error: boolean }> {
  const supabase = await createClient();
  let query = supabase.from("humor_captions").select("id,user_id,author_name:generation_config->>authorName,scene_id,image_data_url,caption,user_prompt,style,model,created_at").order("created_at", { ascending: false }).limit(60);
  if (options.mine) query = query.eq("user_id", userId);
  if (options.others) query = query.neq("user_id", userId);
  if (options.captionId) query = query.eq("id", options.captionId);
  const { data, error } = await query;
  if (error) return { captions: [], error: true };
  const captions = (data ?? []) as Caption[];
  if (!captions.length) return { captions: [], error: false };
  const ids = captions.map(caption => caption.id);
  const [counts, votes] = await Promise.all([
    supabase.rpc("humor_vote_counts", { caption_ids: ids }),
    supabase.from("humor_votes").select("caption_id,value").eq("user_id", userId).in("caption_id", ids),
  ]);
  if (counts.error || votes.error) return { captions: [], error: true };
  const countMap = new Map((counts.data as VoteCount[]).map(count => [count.caption_id, count]));
  const voteMap = new Map((votes.data ?? []).map(vote => [vote.caption_id, vote.value]));
  return { error: false, captions: captions.map(caption => {
    const count = countMap.get(caption.id);
    return { ...caption, upvotes: Number(count?.upvotes ?? 0), downvotes: Number(count?.downvotes ?? 0), myVote: voteMap.get(caption.id) ?? null };
  }) };
}
