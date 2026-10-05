export type Caption = {
  id: string;
  user_id: string;
  scene_id: string;
  caption: string;
  user_prompt: string;
  style: string;
  model: string;
  created_at: string;
};
export type VoteCount = { caption_id: string; upvotes: number; downvotes: number };
export type FeedCaption = Caption & { upvotes: number; downvotes: number; myVote: number | null };
