import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSameOrigin, readSmallJson } from "@/lib/request";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request must come from this app." }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to vote." }, { status: 401 });
  let body: { captionId?: unknown; value?: unknown };
  try {
    const input = await readSmallJson(request);
    if (!input || typeof input !== "object") throw new Error();
    body = input;
  } catch { return Response.json({ error: "That vote could not be read." }, { status: 400 }); }
  if (typeof body.captionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.captionId) || (body.value !== 1 && body.value !== -1)) {
    return Response.json({ error: "Choose a valid caption and vote." }, { status: 400 });
  }
  const { data: caption, error: captionError } = await supabase.from("humor_captions").select("user_id").eq("id", body.captionId).maybeSingle();
  if (captionError) return Response.json({ error: "Votes are unavailable right now." }, { status: 503 });
  if (!caption) return Response.json({ error: "That caption no longer exists." }, { status: 404 });
  // Every first vote creates a row. No client-supplied voter identity is trusted.
  const { error } = await supabase.from("humor_votes").insert({ caption_id: body.captionId, user_id: user.id, value: body.value });
  if (error) return Response.json({ error: error.code === "23505" ? "You've already rated this caption." : "Your vote could not be saved. Please try again." }, { status: error.code === "23505" ? 409 : 500 });
  revalidatePath("/"); revalidatePath("/dashboard");
  return Response.json({ value: body.value }, { status: 201 });
}
