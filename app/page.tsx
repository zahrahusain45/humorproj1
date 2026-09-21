import { supabase } from "@/lib/supabaseClient";

export default async function Home() {
  const { data: movies, error } = await supabase
    .from("movies")
    .select("*")
    .order("release_date", { ascending: true });

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Error loading movies: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-black px-6 py-16 text-white">
      <h1 className="mb-10 text-3xl font-semibold">New Movies This Month</h1>
      <div className="flex w-full max-w-xl flex-col gap-4">
        {movies?.map((movie) => (
          <div
            key={movie.id}
            className="rounded-lg border border-white/10 p-5"
          >
            <p className="text-lg font-medium">{movie.title}</p>
            <p className="mt-1 text-sm text-zinc-400">
              {movie.platform} ·{" "}
              {new Date(movie.release_date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}