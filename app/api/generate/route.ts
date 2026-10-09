import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildPrompt, parseCaption, systemPrompt, validateGeneration } from "@/lib/generation";
import { isSameOrigin, readSmallJson } from "@/lib/request";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request must come from this app." }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to create a caption." }, { status: 401 });
  let input: ReturnType<typeof validateGeneration>;
  try { input = validateGeneration(await readSmallJson(request, 1404096)); }
  catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "Caption generation is not ready yet. Please try again later." }, { status: 503 });

  // Reservation is atomic in Postgres, so parallel requests cannot bypass the daily limit.
  const { data: requestId, error: limitError } = await supabase.rpc("reserve_humor_generation");
  if (limitError) {
    const limited = limitError.message.includes("daily generation limit");
    return Response.json({ error: limited ? "You've used today's 10 generation attempts. Come back tomorrow for a new prompt." : "Caption generation is not ready yet. Please try again later." }, { status: limited ? 429 : 503 });
  }
  let prompt = buildPrompt(input);
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const generationConfig = { temperature: 0.9, maxOutputTokens: 1024 };
  let caption = "";
  const generationDeadline = AbortSignal.timeout(40000);
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents: [{ role: "user", parts: [{ text: prompt }, ...(input.photo ? [{ inlineData: { mimeType: input.photo.mimeType, data: input.photo.data } }] : [])] }], generationConfig }),
        signal: generationDeadline,
        cache: "no-store",
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => ({}));
        const providerStatus = typeof failure.error?.status === "string" && /^[A-Z_]+$/.test(failure.error.status) ? failure.error.status : "UNKNOWN";
        const reasons = (Array.isArray(failure.error?.details) ? failure.error.details : []).map((detail: { reason?: unknown }) => detail.reason).filter((reason: unknown) => typeof reason === "string" && /^[A-Z_]+$/.test(reason));
        console.error("Gemini request failed", { httpStatus: response.status, providerStatus, reasons, model });
        const error = response.status === 429 ? "The AI's usage limit has been reached. Please try again later." : response.status === 401 || response.status === 403 ? "The AI service rejected this app's credentials. The app owner needs to check the Gemini key and its permissions." : response.status === 404 ? "The configured AI model is unavailable. The app owner needs to update it." : "The AI couldn't generate a caption. Please try again later.";
        return Response.json({ error }, { status: 502 });
      }
      const output = await response.json();
      try { caption = parseCaption(output); break; }
      catch (error) {
        if (attempt === 1 || !(error instanceof Error) || !error.message.includes("wrote too much")) throw error;
        prompt += "\nRevision: the previous attempt was too long. Return one complete joke in 10 words or fewer.";
      }
    }
  } catch {
    return Response.json({ error: "The AI couldn't finish this caption. Please try again." }, { status: 502 });
  }
  const { data, error } = await supabase.from("humor_captions").insert({
    user_id: user.id, request_id: requestId, scene_id: input.scene.id, image_path: input.scene.image,
    image_data_url: input.photo?.url ?? null, caption, user_prompt: input.prompt, prompt, system_prompt: systemPrompt, style: input.style,
    model, generation_config: { ...generationConfig, authorName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim().split(/\s+/)[0].slice(0,40) : "Member" },
  }).select("id, caption").single();
  if (error) return Response.json({ error: "Your caption could not be saved. Please try again later." }, { status: 500 });
  revalidatePath("/"); revalidatePath("/dashboard");
  return Response.json({ caption: data }, { status: 201 });
}
