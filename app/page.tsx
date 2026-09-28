import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: movies, error } = await supabase
    .from("movies")
    .select("*")
    .order("release_date", { ascending: true });

  if (error) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-white">
        <p>Error loading movies: {error.message}</p>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 text-white">
      <h1 className="mb-2 text-4xl font-bold tracking-tight">New Movies This Month</h1>
      <p className="mb-10 text-zinc-400">What&apos;s hitting theaters and streaming.</p>
      <div className="flex flex-col gap-4">
        {movies?.map((movie) => (
          <div
            key={movie.id}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:bg-white/[0.07]"
          >
            <div>
              <p className="text-xl font-semibold">{movie.title}</p>
              <p className="mt-1 text-sm text-zinc-400">
                {new Date(movie.release_date + "T00:00:00").toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-zinc-300">
              {movie.platform}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}