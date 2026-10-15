-- The decision simulator's memory (Challenge 3). You run this ONCE, right
-- before you build the service: Supabase dashboard -> SQL Editor -> New
-- query -> paste this whole file -> Run. Expect "Success. No rows returned."
-- The build guide (course book, end of Lane 3) explains every line.

-- One row, always named "latest". Each time your /api/simulator/decide
-- answers a game, it overwrites this row with the newest game, your newest
-- answer, and the summary of every candidate fraction it simulated (the
-- numbers your page's chart draws). jsonb means "a JSON object, stored so
-- the database can read inside it": each piece fits in one column, no
-- matter its shape.

create table public.simulator_latest (
  key text primary key,
  problem jsonb not null,
  answer jsonb not null,
  candidates jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row-level security, same idea as the guestbook and the reasoning table:
-- with it on and no policies, nobody can touch the table. Your site
-- connects with the publishable key, so the policies below grant exactly
-- what the service needs: anyone may read (your /simulator page is public),
-- and anyone may write (your API route saves each answer as it happens).
alter table public.simulator_latest enable row level security;

create policy "anyone can read" on public.simulator_latest
  for select using (true);
create policy "anyone can insert" on public.simulator_latest
  for insert with check (true);
create policy "anyone can update" on public.simulator_latest
  for update using (true);
