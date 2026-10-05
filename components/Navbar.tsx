import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AuthButton from "./AuthButton";

export default async function Navbar() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return null;
  return <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4 text-white">
    <Link href="/" className="text-lg font-semibold">Humor Project</Link>
    <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-5">
      <Link href="/">Joke feed</Link><Link href="/create">Create a caption</Link><Link href="/dashboard">My activity</Link>
      <span className="text-sm text-zinc-400">{user.email}</span><AuthButton />
    </nav>
  </header>;
}
