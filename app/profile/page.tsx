import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const missingNames = !profile?.first_name || !profile?.last_name;

  return (
    <main className="mx-auto w-full max-w-md px-6 py-16 text-white">
      <h1 className="mb-2 text-4xl font-bold tracking-tight">Profile</h1>
      <p className="mb-8 text-zinc-400">{user.email}</p>

      {(welcome || missingNames) && (
        <div className="mb-8 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          Welcome! Please add your first and last name to finish setting up your profile.
        </div>
      )}

      <ProfileForm
        profile={{
          id: user.id,
          first_name: profile?.first_name ?? null,
          last_name: profile?.last_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
        }}
      />
    </main>
  );
}