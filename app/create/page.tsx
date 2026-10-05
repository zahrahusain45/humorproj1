import { requireUser } from "@/lib/auth";
import { getDailyPrompt, getScene } from "@/lib/scenes";
import GenerateForm from "@/components/GenerateForm";

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ daily?: string }> }) {
  await requireUser();
  const { daily } = await searchParams;
  const challenge = getDailyPrompt();
  const scene = getScene(challenge.sceneId)!;
  return <main className="mx-auto max-w-5xl px-6 py-12 text-white"><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-amber-300">Make the group chat laugh</p><h1 className="text-4xl font-bold tracking-tight">Your moment. AI’s punchline.</h1><p className="mb-10 mt-4 max-w-xl text-zinc-400">Turn campus chaos and NYC culture shock into a caption worth sharing.</p><GenerateForm initialScene={daily === "1" ? challenge.sceneId : "subway"} initialPrompt={daily === "1" ? challenge.prompt : scene.id === "subway" ? scene.starter : ""} /></main>;
}
