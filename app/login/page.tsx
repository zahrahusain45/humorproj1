import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (user) redirect("/");
  const { error } = await searchParams;
  return <main className="mx-auto max-w-md px-6 py-24 text-white">
    <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-300">Humor Project</p>
    <h1 className="text-4xl font-bold">A little laugh awaits.</h1>
    <p className="mt-4 text-zinc-400">Sign in with your email to create AI captions and rate the community’s jokes.</p>
    {error && <p role="alert" className="mt-4 text-red-300">That sign-in link could not be verified. Request a new one below.</p>}
    <LoginForm />
  </main>;
}
