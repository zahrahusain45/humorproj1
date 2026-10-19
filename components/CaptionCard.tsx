import Image from 'next/image';
import {getScene} from '@/lib/scenes';
import type {FeedCaption} from '@/lib/captions';
import DeleteCaption from './DeleteCaption';
import VoteButtons from './VoteButtons';
import CaptionText from './CaptionText';
export default function CaptionCard({caption,userId}:{caption:FeedCaption;userId:string}){
 const scene=getScene(caption.scene_id);
 if(!scene&&!caption.image_data_url)return null;
 const own=caption.user_id===userId;
 return <article className="post-card compact-post"><header className="post-author"><p>{own?'Your post':caption.author_name||'Community member'}</p><time dateTime={caption.created_at}>{new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'America/New_York'}).format(new Date(caption.created_at))}</time></header><div className="post-picture"><Image src={caption.image_data_url||scene!.image} alt={scene?.alt||'Community uploaded photo'} unoptimized={!!caption.image_data_url} width={600} height={400}/></div><div className="post-body"><div className="post-meta"><span>AI CAPTION</span><span className="post-style">{caption.style}</span></div><CaptionText text={caption.caption}/></div><div className="post-footer"><VoteButtons captionId={caption.id} initialVote={caption.myVote} upvotes={caption.upvotes} downvotes={caption.downvotes}/><details className="post-context"><summary>Behind the joke</summary><p>{caption.user_prompt}</p></details>{own&&<DeleteCaption captionId={caption.id} compact/>}</div></article>;
}
