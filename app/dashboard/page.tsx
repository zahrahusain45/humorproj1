import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 text-white">
      <h1 className="mb-2 text-4xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-zinc-400">
        Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}! This page is only visible to logged-in users.
      </p>
    </main>
  );
}