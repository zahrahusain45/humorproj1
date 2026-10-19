import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AuthButton from "./AuthButton";

export default async function Navbar() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) return null;
  return <header className="site-header flex flex-wrap items-center justify-between gap-4 border-b border-pink-200 px-6 py-4 text-rose-950">
    <Link href="/" className="site-brand"><span className="brand-mark" aria-hidden="true">✧</span>Humor Project</Link>
    <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-5">
      <Link href="/">Community jokes</Link>
      <span className="account-email text-sm text-[#875e74]">{user.email}</span><AuthButton />
    </nav>
  </header>;
}
