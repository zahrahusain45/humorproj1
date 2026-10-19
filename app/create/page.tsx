import {requireUser} from '@/lib/auth';
import {getDailyPrompt} from '@/lib/scenes';
import GenerateForm from '@/components/GenerateForm';
export default async function CreatePage({searchParams}:{searchParams:Promise<{daily?:string}>}){
 await requireUser();const {daily}=await searchParams;
 return <main className="mx-auto max-w-5xl px-6 py-12"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-rose-700">A tiny moment, a little main-character energy</p><h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your photo. A fresh punchline.</h1><p className="mb-10 mt-4 max-w-xl text-[#875e74]">Upload a photo, pick your vibe, and let AI find the funny in 10 words or fewer.</p><GenerateForm initialPrompt={daily==='1'?getDailyPrompt().prompt:''}/></main>;
}
