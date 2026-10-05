import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const charlie = "33333333-3333-4333-8333-333333333333";

test("Postgres enforces identity, private votes, single votes, daily limits, and legacy lockdown", async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table public.movies(id int); create table public.profiles(id uuid);
    grant all on public.movies, public.profiles to anon, authenticated;
    insert into auth.users values ('${alice}'), ('${bob}'), ('${charlie}');`);
  await db.exec(await readFile(new URL("../supabase/migrations/202610050001_humor_generation_and_votes.sql", import.meta.url), "utf8"));
  async function asUser(id: string | null) {
    await db.exec(`reset role; set role ${id ? "authenticated" : "anon"};`);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id ?? ""]);
  }
  async function reserve() { return (await db.query<{ id: string }>("select public.reserve_humor_generation() as id")).rows[0].id; }
  async function caption(user: string, request: string) {
    return (await db.query<{ id: string }>(`insert into public.humor_captions(user_id,request_id,scene_id,image_path,caption,user_prompt,prompt,system_prompt,style,model,generation_config)
      values($1,$2,'subway','/jokes/subway.svg','The train is taking a gap year.','Waiting for the train.','Saved full prompt.','Saved system prompt.','Deadpan','test-model','{}') returning id`, [user, request])).rows[0].id;
  }
  await t.test("all application tables enable RLS and anon cannot read or mutate", async () => {
    const tables = await db.query<{ rowsecurity: boolean }>("select rowsecurity from pg_tables where schemaname='public'");
    assert.ok(tables.rows.length >= 5); assert.ok(tables.rows.every(row => row.rowsecurity));
    await asUser(null);
    await assert.rejects(() => db.query("select * from public.humor_captions"), /permission denied/);
    await assert.rejects(() => reserve(), /permission denied/);
    await assert.rejects(() => db.query("select * from public.humor_vote_counts('{}')"), /permission denied/);
    await assert.rejects(() => db.query("select * from public.movies"), /permission denied/);
  });
  let captionId: string;
  await t.test("a reservation cannot be used to impersonate another creator", async () => {
    await asUser(alice);
    const request = await reserve();
    await assert.rejects(() => caption(bob, request), /row-level security/);
    captionId = await caption(alice, request);
    await assert.rejects(() => caption(alice, request), /duplicate key/);
    await assert.rejects(() => db.query("update public.humor_captions set caption='forged'"), /permission denied/);
  });
  await t.test("users insert exactly one vote as themselves, and cannot vote on their own caption", async () => {
    await asUser(alice);
    await assert.rejects(() => db.query("insert into public.humor_votes(caption_id,user_id,value) values($1,$2,1)", [captionId, alice]), /row-level security/);
    await asUser(bob);
    await assert.rejects(() => db.query("insert into public.humor_votes(caption_id,user_id,value) values($1,$2,1)", [captionId, charlie]), /row-level security/);
    await db.query("insert into public.humor_votes(caption_id,user_id,value) values($1,$2,1)", [captionId, bob]);
    await assert.rejects(() => db.query("insert into public.humor_votes(caption_id,user_id,value) values($1,$2,-1)", [captionId, bob]), /duplicate key/);
    await assert.rejects(() => db.query("insert into public.humor_votes(caption_id,user_id,value) values($1,$2,0)", [captionId, bob]), /check constraint/);
    await assert.rejects(() => db.query("update public.humor_votes set value=-1"), /permission denied/);
    await assert.rejects(() => db.query("delete from public.humor_votes"), /permission denied/);
    assert.equal((await db.query("select * from public.humor_votes")).rows.length, 1);
    await asUser(charlie);
    assert.equal((await db.query("select * from public.humor_votes")).rows.length, 0);
    const counts = (await db.query<{ upvotes: number; downvotes: number }>("select * from public.humor_vote_counts(array[$1::uuid])", [captionId])).rows[0];
    assert.equal(Number(counts.upvotes), 1); assert.equal(Number(counts.downvotes), 0);
    await db.query("insert into public.humor_votes(caption_id,user_id,value) values($1,$2,-1)", [captionId, charlie]);
    await asUser(alice);
    assert.equal((await db.query("select * from public.humor_votes")).rows.length, 0);
    const totals = (await db.query<{ upvotes: number; downvotes: number }>("select * from public.humor_vote_counts(array[$1::uuid])", [captionId])).rows[0];
    assert.equal(Number(totals.upvotes), 1); assert.equal(Number(totals.downvotes), 1);
  });
  await t.test("daily limit and reservation ownership are enforced in the database", async () => {
    await asUser(bob);
    for (let i = 0; i < 10; i++) await reserve();
    await assert.rejects(() => reserve(), /daily generation limit/);
    await assert.rejects(() => db.query("insert into public.humor_generation_requests(user_id) values($1)", [bob]), /permission denied/);
    assert.equal((await db.query("select * from public.humor_generation_requests")).rows.length, 10);
    await asUser(charlie);
    assert.equal((await db.query("select * from public.humor_generation_requests")).rows.length, 0);
    await assert.rejects(() => db.query("select * from public.profiles"), /permission denied/);
    // Grant execution is insufficient without a valid JWT identity.
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
    await assert.rejects(() => reserve(), /Authentication required/);
  });
});
