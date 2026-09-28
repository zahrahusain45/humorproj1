"use client";

import { createClient } from "@/lib/supabase/client";

export default function AuthButton({ loggedIn }: { loggedIn: boolean }) {
  const supabase = createClient();

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <button
      onClick={loggedIn ? logout : login}
      className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
    >
      {loggedIn ? "Sign out" : "Sign in with Google"}
    </button>
  );
}