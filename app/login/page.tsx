import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (user) redirect("/");
  const { error } = await searchParams;
  return <main className="login-page mx-auto max-w-md px-6 py-24 text-rose-950">
    <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-rose-700">Humor Project</p>
    <h1 className="text-4xl font-bold">A little laugh awaits.</h1>
    <p className="mt-4 text-[#875e74]">Sign in with Google to create AI captions and rate the community’s jokes.</p>
    {error && <p role="alert" className="mt-4 text-red-700">Sign-in could not be completed. Try Google sign-in again below.</p>}
    <LoginForm />
  </main>;
}
