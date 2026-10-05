# Humor Project — Assignment 4

An email-only, authenticated caption app for college students navigating campus life and New York City. Choose a local illustration, describe a moment, and ask Gemini for a funny caption. Each generated caption posts to the member feed; other members can upvote or downvote it once.

## Intentional product choices

- Sam's world: subway delays, late nights in the library, dorm life, and NYC prices. The picture library keeps creation quick and consistent without requiring a personal photo upload.
- A daily prompt changes at midnight in New York and gives people a reason to return.
- Newest and Top sorting help members discover content. Top ranks the latest 60 captions by upvotes minus downvotes; it is not an all-time leaderboard.
- Users control the moment and humor style rather than accepting a generic caption. Their prompt is visible beside the caption so others can understand the joke.
- One vote per member per caption, no self-votes, and permanent vote choices keep scores meaningful.
- A 10-attempt daily cap protects AI usage. Failed provider attempts count toward the cap. No fake AI captions are seeded.
- No profile page, avatar, names, movie data, or public content pages.

## Existing stack

Next.js, Supabase (existing project), Gemini (server-only REST API), and Vercel (existing project connected to GitHub). No service-role key is used by the app.

## Database setup

Run `supabase/migrations/202610050001_humor_generation_and_votes.sql` once in your existing Supabase project's SQL Editor. The transaction creates:

- `humor_captions`: caption, owner, image scene/path, original user prompt, full model prompt, system prompt, model, settings, and timestamp.
- `humor_votes`: voter, caption foreign key, and +1/-1 vote. A unique constraint prevents duplicate votes.
- `humor_generation_requests`: private per-user reservations used for an atomic daily limit.

RLS is enabled for every existing table in `public`. Existing `movies` and `profiles` data is retained but access through anon/authenticated Data API roles is revoked because the new app does not use those tables. Other existing tables keep their policies and must be audited using the queries at the end of the migration. Supabase-managed `auth` and `storage` schemas are not changed.

Members can read captions, insert captions only as themselves with a recent reservation, read only their own votes, and insert only their own votes on another user's caption. There are no update/delete grants. Created IDs/timestamps cannot be provided by Data API clients. `humor_vote_counts` exposes only totals for at most 60 requested captions and checks authentication; it uses a narrowly scoped security-definer function so individual votes remain private. `reserve_humor_generation` checks authentication and serializes reservations per user to enforce the daily cap.

## Environment and authentication

Use `.env.example` as a guide, preserving your existing Supabase values. Set `GEMINI_API_KEY` in `.env.local` and Vercel Environment Variables (Production and Preview). Never prefix it with `NEXT_PUBLIC_` or commit it. `GEMINI_MODEL` defaults to `gemini-2.5-flash-lite` and can be changed to an available Gemini text model.

In Supabase Authentication:

1. Enable the Email provider and new-user signups if students should be able to join.
2. Set the Site URL to the production app URL.
3. Add the production and local `/auth/callback` URLs to the allowed redirects. Add the actual commit deployment URL before testing that deployment. This local preview runs on `http://127.0.0.1:3000`, so allow `http://127.0.0.1:3000/auth/callback` as well as `http://localhost:3000/auth/callback` if you use both.
4. Keep the default magic-link template using `{{ .ConfirmationURL }}`. A custom SSR template can instead use `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`.
5. Open the emailed link in the same browser that requested it (PKCE flow).

Only `/login` and `/auth/callback` are public application routes. Logged-out content requests redirect to `/login`; unauthenticated API mutations return 401. Server pages and each mutation verify the Supabase user independently. Static image assets remain public to render the interface. POST mutations require a matching Origin and a small JSON body.

## Run and validate

```sh
npm install
npm run dev
npm test
npm run lint
npx tsc --noEmit
npm run build
```

If this machine's sandbox prevents Turbopack from binding its internal port, `npm run build -- --webpack` builds the same app successfully.

Tests execute the actual migration in an isolated Postgres-compatible PGlite database, with mocked Supabase auth identities. They cover anonymous denial, creator/voter impersonation, duplicate votes, self-votes, vote privacy, aggregate totals, immutable rows, legacy table lockdown, and generation limits. Input tests cover rejected prompts/styles, unusable AI outputs, cross-origin mutations, and New York midnight.

Manually verify against the real Supabase project:

1. In a logged-out/incognito window, visit `/`, `/create`, `/dashboard`, and `/profile`: content must redirect to login. API POST requests must return 401.
2. Request a login link, open it in the same browser, generate a caption, and reload. Confirm the caption and all prompts exist in `humor_captions`.
3. Sign in with a second account, vote, reload, and confirm the new `humor_votes` row and updated totals. A second vote and self-vote must be rejected.
4. Sign out and verify content is inaccessible. An invalid callback displays a login error.
5. Audit live RLS/policies after applying the migration; local tests are not proof that the migration was applied remotely.

## Vercel submission

Commit and push to the existing GitHub repository (`zahrahusain45/humorproj1`). Its Vercel integration builds the main branch. Set the Gemini environment variable before generating captions. Confirm the deployment is Ready, turn off Vercel Deployment Protection as required by the assignment, and check incognito access to the app's own login screen.

Submit the immutable deployment URL associated with the final commit, not just `humorproj1.vercel.app`. Confirm its callback URL is allowed in Supabase. The assignment deadline is October 8, 2026, at 6:00 PM EDT.

## Feedback iteration

The supplied PM feedback is implemented: email only, no profile page/avatar, images with joke captions, and login redirects. Record any additional feedback from the next Feedback Group session before submitting; that session has not been simulated.

## Current external setup

The migration is applied to the existing live Supabase project. All five public tables have RLS enabled; live anonymous Data API reads are denied on every table. Email signups are enabled, the production callback is allowed, and the 127.0.0.1 preview callback has been added. Automated tests and the production build pass. Deployment still needs Vercel CLI authorization, a Production GEMINI_API_KEY, the final commit deployed, and generation/voting checked with two real signed-in users. GitHub push currently fails because github.com cannot be reached, so direct Vercel CLI deployment is being prepared.
