import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const supabase = await createClient();
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  } else if (token_hash && searchParams.get("type") === "email") {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: "email" });
    if (!error) return NextResponse.redirect(`${origin}/`);
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
