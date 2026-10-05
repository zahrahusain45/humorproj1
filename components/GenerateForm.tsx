"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { scenes, styles } from "@/lib/scenes";

export default function GenerateForm({ initialScene, initialPrompt }: { initialScene: string; initialPrompt: string }) {
  const router = useRouter();
  const [source, setSource] = useState("existing");
  const [photo, setPhoto] = useState<string | null>(null);
  const [sceneId, setSceneId] = useState(initialScene);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [style, setStyle] = useState<string>(styles[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ id: string; caption: string } | null>(null);
  const scene = scenes.find(scene => scene.id === sceneId)!;
  async function generate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (source === "upload" && !photo) { setError("Choose a photo first."); return; } setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sceneId, prompt, style, ...(source === "upload" ? { photo } : {}) }) });
      const data = await response.json();
      if (response.status === 401) { router.replace("/login"); router.refresh(); return; }
      if (!response.ok) { setError(data.error || "Could not generate your caption."); return; }
      setResult(data.caption); router.refresh();
    } catch { setError("Could not connect. Your caption was not confirmed saved. Check the feed before trying again."); }
    finally { setBusy(false); }
  }
  return <div className="grid items-start gap-8 lg:grid-cols-2">
    <form onSubmit={generate} className="space-y-6">
      <fieldset disabled={busy}><legend className="mb-3 font-semibold">1. Pick your picture</legend>
        <div className="mb-4 flex gap-3"><label><input type="radio" name="source" checked={source === "existing"} onChange={() => {setSource("existing"); setResult(null);}} /> Choose existing pictures</label><label><input type="radio" name="source" checked={source === "upload"} onChange={() => {setSource("upload"); setResult(null);}} /> Upload a photo</label></div>
        {source === "upload" ? <div className="rounded-xl border border-dashed border-white/20 p-4"><label htmlFor="photo" className="mb-3 block text-sm">Your photo (JPEG, PNG, WebP · up to 1 MB)</label><input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={async e => {
          setResult(null); setPhoto(null); setError("");
          const file = e.target.files?.[0]; if (!file) return;
          if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 1048576) {setError("Choose JPEG, PNG, or WebP under 1 MB."); return;}
          const reader = new FileReader(); reader.onload = () => setPhoto(String(reader.result)); reader.onerror = () => setError("Could not read this photo."); reader.readAsDataURL(file);
        }} /><p className="mt-3 text-xs text-zinc-400">Your photo will be visible to signed-in members when you post. Only upload photos you have permission to share.</p></div> : <div className="grid grid-cols-2 gap-3">
        {scenes.map(item => <label key={item.id} className={`cursor-pointer overflow-hidden rounded-xl border ${sceneId === item.id ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-zinc-950"}`}>
          <Image src={item.image} alt={item.alt} width={600} height={360} className="h-auto w-full" />
          <span className="flex items-center gap-2 p-3 text-xs"><input type="radio" name="scene" value={item.id} checked={sceneId === item.id} onChange={() => { setSceneId(item.id); setResult(null); }} className="accent-amber-300" />{item.title}</span>
        </label>)}
      </div>}</fieldset>
      <div><label htmlFor="prompt" className="mb-3 block font-semibold">2. Describe your moment</label><textarea id="prompt" required minLength={5} maxLength={500} disabled={busy} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={source === "upload" ? "What is happening in your photo?" : scene.starter} rows={4} className="w-full resize-y rounded-xl border border-white/15 bg-zinc-950 p-4 text-white focus:outline-2 focus:outline-amber-300" /><p className="mt-2 text-xs text-zinc-500">{prompt.length}/500 · This moment will appear with your caption. Keep it personal-info free.</p></div>
      <div><label htmlFor="style" className="mb-3 block font-semibold">3. Choose the vibe</label><select id="style" value={style} disabled={busy} onChange={e => setStyle(e.target.value)} className="w-full rounded-xl border border-white/15 bg-zinc-950 p-3 text-white">{styles.map(style => <option key={style}>{style}</option>)}</select></div>
      <button disabled={busy} className="w-full rounded-xl bg-amber-300 px-5 py-3 font-semibold text-black disabled:opacity-50">{busy ? "Finding the punchline…" : "Generate & post caption"}</button>
      <p className="text-xs leading-relaxed text-zinc-500">Your selected picture description, or uploaded photo, and moment go to Google Gemini. The AI caption posts to the member feed automatically. Up to 10 attempts per day.</p>
      {error && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">{error}</p>}
    </form>
    <section aria-label="Caption preview" className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 lg:sticky lg:top-8">
      <Image src={source === "upload" && photo ? photo : scene.image} alt={source === "upload" && photo ? "Your uploaded photo" : scene.alt} unoptimized={source === "upload"} width={600} height={360} className="h-auto w-full" />
      <div className="p-6"><p className="mb-3 text-xs uppercase tracking-widest text-amber-300">{result ? "Posted to the feed" : "Your caption goes here"}</p>
        {result ? <div role="status"><p className="text-xl leading-relaxed">{result.caption}</p><Link href={`/?caption=${result.id}`} className="mt-6 inline-block font-semibold text-amber-300">See it in the feed →</Link></div> : <p className="leading-relaxed text-zinc-400">Bring the moment. AI brings the punchline. The community decides if it lands.</p>}
      </div>
    </section>
  </div>;
}
