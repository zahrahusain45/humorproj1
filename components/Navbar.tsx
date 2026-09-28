import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import NavMenu from "./NavMenu";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between bg-black/70 px-6 py-4 backdrop-blur-md">
      <Link href="/" className="text-lg font-semibold tracking-tight text-white">
        Humor Project
      </Link>
      <NavMenu loggedIn={!!user} />
    </header>
  );
}