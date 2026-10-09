import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSameOrigin, readSmallJson } from "@/lib/request";

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Request must come from this app." }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Sign in to delete your caption." }, { status: 401 });
  let captionId: unknown;
  try {
    const input = await readSmallJson(request);
    captionId = input && typeof input === "object" && "captionId" in input ? input.captionId : undefined;
  } catch { return Response.json({ error: "That request could not be read." }, { status: 400 }); }
  if (typeof captionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(captionId)) return Response.json({ error: "Choose a valid caption." }, { status: 400 });
  const { data, error } = await supabase.from("humor_captions").delete().eq("id", captionId).eq("user_id", user.id).select("id");
  if (error) return Response.json({ error: "Your caption could not be deleted. Please try again." }, { status: 500 });
  if (!data?.length) return Response.json({ error: "That caption is unavailable or does not belong to you." }, { status: 404 });
  revalidatePath("/"); revalidatePath("/dashboard");
  return Response.json({ deleted: true });
}
