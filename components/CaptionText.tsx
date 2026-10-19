'use client';
import {useState} from 'react';
export default function CaptionText({text}:{text:string}){
 const [expanded,setExpanded]=useState(false);
 const long=text.length>130;
 return <div className="post-joke"><p className={long&&!expanded?'post-joke-text line-clamp-3':'post-joke-text'}>{text}</p>{long&&<button type="button" className="post-read-more" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Show less':'Read more'}</button>}</div>;
}
