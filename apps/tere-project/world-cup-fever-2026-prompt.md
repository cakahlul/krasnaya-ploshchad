# One-Shot Prompt — "World Cup Fever 2026" (Next.js + Supabase + self-hosted LLM)

> Paste everything below into Claude Fable 5. It targets a full, production-grade Next.js + Supabase + Playwright + LLM app. Build the complete project in one shot — schema, crawler, jobs, API routes, and UI. No stubs, no TODOs.

---

Build **World Cup Fever 2026**, a vibrant, interactive companion web app for the FIFA World Cup 2026 (USA, Canada & Mexico, June 11 – July 19, 2026).

## Architecture (read first)

**Supabase is the single source of truth.** The browser only reads/writes Supabase — never calls an LLM or crawler directly. All crawling and AI work runs server-side and writes to the DB.

```
[Playwright crawler] --> [extract & clean text] --> [LLM parse/write] --> [Supabase] --(realtime)--> [Next.js UI]
                                                                                          ^
                                                              [API-Football fallback] ----+
```

Three data categories:
1. **Schedule (fixed) → seed once.** 104-match schedule is already fixed (see SQL appendix). Group fixtures have real teams; knockout rows have positional placeholder slots — only team assignments are TBD.
2. **Live scores + knockout resolution → crawl jobs.** Playwright crawls Google's live score panel; if that fails, fall back to API-Football (`league=1&season=2026`). Upsert into Supabase.
3. **Reviews + hype blurbs → LLM, cached in DB.** Generated once per match, stored in `match_reviews`.

## Tech stack

- **Next.js 14 (App Router) + TypeScript.** React Server Components for data-heavy pages.
- **Supabase** — Postgres + Realtime + RLS + **anonymous auth** (auto sign-in on first load, `supabase.auth.signInAnonymously()`; upgrade to magic-link later). Enable Realtime publication on the `matches` table in the Supabase dashboard.
- **Two Supabase clients — never mix them:**
  - `lib/supabase/server.ts` — service-role key (`SUPABASE_SERVICE_ROLE_KEY`), server-only, used in crawl jobs and API routes.
  - `lib/supabase/client.ts` — anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), browser-only, used in React components.
- **Playwright** (`playwright` npm package, Chromium) as the primary crawl engine — required because live-score sources (Google, ESPN) are JS-rendered; a plain `fetch()` returns empty HTML. Run Playwright in a server-only module. Keep the browser instance as a singleton, reuse across ticks, and close it on process exit.
- **API-Football fallback** — used only when Playwright fails. Base URL `https://v3.football.api-sports.io`, key from `API_FOOTBALL_KEY` env var. Endpoints: `/fixtures?live=all`, `/fixtures?league=1&season=2026`, `/standings?league=1&season=2026`. Wrap in the same swappable `CrawlAdapter` interface as the Playwright crawler.
- **LLM (OpenAI-compatible, self-hosted VPS)** — env vars `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`. Use `openai` SDK: `new OpenAI({ baseURL: process.env.LLM_BASE_URL, apiKey: process.env.LLM_API_KEY })`. **Never hardcode a provider URL.**
- **Tailwind CSS**, **@react-three/fiber + @react-three/drei** for 3D, **framer-motion** for micro-animations.
- Clean architecture / SOLID: `lib/crawl/` (Playwright + fallback adapters), `lib/domain/` (standings, tiebreakers, bracket resolution, simulation logic), `lib/llm/` (LLM calls), `lib/supabase/` (typed clients). All crawl/LLM modules are server-only (`"use server"` or in `lib/` never imported by client components).

## Crawler design (Playwright)

```ts
// lib/crawl/playwright-adapter.ts  — PRIMARY source
import { chromium, Browser, Page } from 'playwright';

let browser: Browser | null = null;
async function getBrowser() {
  if (!browser) browser = await chromium.launch({ headless: true });
  return browser;
}
process.on('exit', () => browser?.close());

export async function crawlLiveScores(): Promise<string> {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.goto('https://www.google.com/search?q=FIFA+World+Cup+2026+live+score', {
      waitUntil: 'networkidle', timeout: 20_000
    });
    await page.waitForSelector('[data-ved]', { timeout: 8_000 }).catch(() => {});
    const raw = await page.evaluate(() => document.body.innerText);
    return cleanForLLM(raw); // strip nav/ads, cap at ~3000 chars — see cleanForLLM below
  } finally {
    await page.close();
  }
}
```

**`cleanForLLM(raw: string): string`** — mandatory pre-processing before any LLM call:
1. Strip lines shorter than 15 chars (nav links, icons).
2. Remove lines matching ad/cookie/legal patterns.
3. Collapse 3+ consecutive blank lines to one.
4. **Hard cap at 3000 characters** (truncate with a `[truncated]` marker). This protects the LLM context and prevents runaway cost.

## LLM call conventions (server-only)

```ts
// lib/llm/index.ts
import OpenAI from 'openai';
const llm = new OpenAI({ baseURL: process.env.LLM_BASE_URL, apiKey: process.env.LLM_API_KEY });

// Structured extraction — always JSON mode
export async function extractJSON<T>(systemPrompt: string, userContent: string): Promise<T | null> {
  try {
    const res = await llm.chat.completions.create({
      model: process.env.LLM_MODEL!,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
      max_tokens: 1000,
    });
    const text = res.choices[0].message.content ?? '';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as T;
  } catch { return null; }
}

// Prose generation — no JSON mode (reviews, hype blurbs)
export async function generateProse(systemPrompt: string, userContent: string): Promise<string> {
  try {
    const res = await llm.chat.completions.create({
      model: process.env.LLM_MODEL!,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
      max_tokens: 300,
    });
    return res.choices[0].message.content?.trim() ?? '';
  } catch { return ''; }
}
```

## Supabase data model

- `teams` — id, name, code (ISO3), flag_emoji, group (A–L), fifa_rank.
- `matches` — id, match_number, stage (`group`|`r32`|`r16`|`qf`|`sf`|`third_place`|`final`), group, matchday, kickoff_utc, venue, city, home_team_id (nullable), away_team_id (nullable), home_slot/away_slot (knockout placeholder strings), status (`scheduled`|`live`|`finished`), minute, home_score, away_score, events (jsonb).
- `v_standings` + `v_third_place` — Postgres views (see schema). Sort: points → GD → GF in SQL; **head-to-head and fair-play tiebreakers are resolved in `lib/domain/standings.ts`** (they require subset recomputation not suited for a single view). Document this in code comments.
- `match_reviews` — match_id PK, body, generated_at.
- `players` — squad (26/nation): team_id, name, shirt_number, position, club, is_captain.
- `lineups` — match_id, team_id, player_id, player_name (snapshot), shirt_number, position, role (`starter`|`sub`), is_captain, formation.
- `simulations` — id, user_id (Supabase anon uid), name, picks (jsonb), champion_team_id, created_at, updated_at. RLS: owner-only.

**Realtime:** enable publication on `matches` in Supabase dashboard. The live tab subscribes via `supabase.channel('matches').on('postgres_changes', ...).subscribe()` — no client-side polling.

## Server jobs & API routes

All under `/api/crawl/*`, guarded by `if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) return 403`.

1. **`POST /api/crawl/bootstrap`** — idempotent backfill. Fill null `kickoff_utc`/`venue` on schedule rows; seed squads for teams with no players yet; generate missing reviews. Skip anything already present. Safe to re-run.
2. **`POST /api/crawl/live`** — gated: query DB first; if no `live` match and no kickoff within 5 min → return `{skipped:true}` immediately (no Playwright, no LLM). When active: Playwright → `cleanForLLM` → `extractJSON` → upsert scores. Also: handle lineup crawl (~60–75 min pre-kickoff, no lineup yet) and trigger review generation for newly-finished matches.
3. **`POST /api/crawl/reconcile`** — 12h sweep: re-crawl recently-finished matches, generate missing reviews, refresh squads for late call-ups, run knockout resolution if a round just completed.

Crawler fallback pattern:
```ts
async function fetchLiveData(): Promise<string> {
  try {
    return await crawlLiveScores(); // Playwright primary
  } catch (e) {
    console.warn('Playwright failed, falling back to API-Football', e);
    return await apifootballFetchLive(); // structured fallback
  }
}
```

## Scheduling (user's VPS — PM2 already runs there)

```
bootstrap:  run manually once →  npm run crawl:bootstrap
live:       PM2 process running setInterval(30_000) → POST /api/crawl/live  (x-cron-secret header)
reconcile:  crontab  →  0 */12 * * *  curl -fsS -X POST https://<app>/api/crawl/reconcile -H "x-cron-secret: $CRON_SECRET"
```

Include a `scripts/ticker.ts` (PM2 entry) that does the 30s interval and logs tick results.

## Build order (important for one-shot success)

Build in this order so each layer is testable before the next:
1. **DB + seed** — apply schema + seed SQL, verify in Supabase dashboard.
2. **Data access layer** — typed Supabase clients, `v_standings` query, `matches` CRUD.
3. **Domain logic** — standings sort with full tiebreakers, third-place ranking, bracket slot resolution, simulation engine.
4. **Crawl + LLM layer** — Playwright adapter, `cleanForLLM`, `extractJSON`/`generateProse`, bootstrap job.
5. **API routes** — bootstrap, live, reconcile (with CRON_SECRET guard).
6. **Core UI vertical slice** — Schedule → Standings → Bracket (data from seed, no live needed yet).
7. **Live tab** — realtime subscription to `matches`.
8. **Squad/Lineup, Simulator, Saved** — remaining features.
9. **3D + animations** — @react-three/fiber hero, framer-motion micro-interactions.

## Core features (all required)

1. **Home** — bold animated hero (3D element), "Next up" countdown, pinned big matches, quick-nav.
2. **Live** — Supabase Realtime subscription on `matches` (no client polling). LIVE pulse, minute, score ticker. Shows live + recently finished + next upcoming.
3. **Schedule** — full 104-match calendar from DB, grouped by date, filterable by group/stage/team/host country/venue. Kickoffs in user's local timezone (`Intl.DateTimeFormat`). Knockout rows show slot label until resolved. "Today" jump + countdown to next kickoff. Big-match badge on flagged fixtures.
4. **Standings** — all 12 groups (P/W/D/L/GF/GA/GD/Pts), top-2 qualified badge, dedicated **8-best-third-place** mini-table. Full tiebreaker sort in domain layer.
5. **Bracket** — scrollable/zoomable R32→R16→QF→SF→Final + third-place. Real teams where resolved, slot labels otherwise. Lines draw in with framer-motion.
6. **Squad & Lineup** — squad list per team (by position, captain flagged, club). Match detail shows both **starting XIs on a formation pitch** + bench. Pre-lineup fallback: full squad list + "Lineups announced ~1h before kickoff".
7. **Big Match spotlight** — single tunable `isBigMatch(match, teams)` function: rule-based flags (both teams fifa_rank ≤ 10, known rivalry pairs, host nation playing, stage = QF/SF/Final) → `generateProse` for hype blurb cached in `match_reviews`. Distinct card: glowing "BIG MATCH" badge, particle shimmer, pinned on Home + Schedule.
8. **Simulator** — Manual pick or Auto-simulate (seeded RNG weighted by `fifa_rank`). Propagates winners through bracket to Final. Confetti/trophy animation on champion. Save/rename/reload/delete via `simulations` table.
9. **Saved** — list all user's simulations (by anon uid), load into Simulator, delete.

Navigation: **Home · Live · Schedule · Standings · Bracket · Simulator · Saved**.

## Design & 3D

World Cup 2026 energy — stadium night, gold accents, three host nations. Mobile-first, full desktop.

- **3D hero**: build from primitives using @react-three/fiber + drei (e.g. rotating trophy from lathe/cylinder geometry, or globe with host-nation markers). **No `.gltf`/`.glb` file imports** — all geometry must be constructed in code (no external assets). Drag-rotate, hover glow, smooth RAF loop, cleanup on unmount. Degrades gracefully (Suspense fallback) on low-end devices.
- framer-motion micro-animations: score ticker, standings row transitions, bracket line draw-in, confetti burst on sim champion, big-match shimmer.
- Custom color tokens (not default Tailwind), emoji flags, accessible (aria-labels on icon buttons, keyboard-focusable controls).

## Non-functional requirements

- `.env.example` with all keys: `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `API_FOOTBALL_KEY` (fallback, optional).
- Typed end-to-end — generate Supabase types (`supabase gen types typescript`), use them everywhere.
- Never block UI on network — skeletons everywhere, friendly error+retry states, fall back to last DB state.
- Idempotent jobs. `cleanForLLM` always runs before any LLM call on crawled text.
- Comment non-obvious logic: H2H tiebreaker, third-place allocation, bracket slot resolution, seeded sim RNG.

## Acceptance criteria

App runs immediately after `npm run dev` (with seed data). Bootstrap populates schedule/squads. Live scores update via Playwright→LLM→Supabase→Realtime. Standings compute correctly (all tiebreakers). Bracket resolves knockout slots correctly. Big matches auto-detected + hype blurbs generated. Lineup pitch renders when lineups available. Simulator propagates picks to Final, saves per anon user. 3D hero renders and responds to interaction.

---

## Appendix — Database SQL (run this in Supabase BEFORE building the app)

Run `schema.sql` first, then `seed.sql`. These define the exact tables, views, RLS, and seed (real 48-team draw + auto-generated 72 group fixtures + the official 32-match knockout bracket with real slot mapping and venues). Squads (`players`) and `lineups` are populated by the crawl jobs, not seeded. Build all data access against this schema. Only kickoff times are left null for the crawl to fill.

### schema.sql
```sql
-- =====================================================================
-- World Cup Fever 2026 — Supabase schema
-- Run in Supabase SQL editor (or via migration). Postgres 15+.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
do $$ begin
  create type match_stage as enum ('group','r32','r16','qf','sf','third_place','final');
exception when duplicate_object then null; end $$;

do $$ begin
  create type match_status as enum ('scheduled','live','finished');
exception when duplicate_object then null; end $$;

-- ---------- teams ----------
create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  code        text not null unique,          -- ISO3-ish
  flag_emoji  text,
  "group"     char(1),                       -- A..L (null until known; all known now)
  fifa_rank   int,                           -- approximate seed value; refresh via crawl/API
  created_at  timestamptz not null default now()
);

-- ---------- matches ----------
create table if not exists matches (
  id            uuid primary key default gen_random_uuid(),
  match_number  int unique,                  -- 1..104
  stage         match_stage not null,
  "group"       char(1),                     -- only for group stage
  matchday      int,                          -- 1..3 for group stage
  kickoff_utc   timestamptz,                  -- filled by seed-crawl job
  venue         text,
  city          text,
  home_team_id  uuid references teams(id),
  away_team_id  uuid references teams(id),
  home_slot     text,                         -- knockout placeholder e.g. '1A','3rd-ABCD','W73'
  away_slot     text,
  status        match_status not null default 'scheduled',
  minute        int,
  home_score    int,
  away_score    int,
  events        jsonb not null default '[]',  -- goals/cards/subs
  updated_at    timestamptz not null default now()
);
create index if not exists idx_matches_stage   on matches(stage);
create index if not exists idx_matches_group    on matches("group");
create index if not exists idx_matches_kickoff  on matches(kickoff_utc);
create index if not exists idx_matches_status   on matches(status);

-- ---------- players (squads — locked per nation, seeded once via crawl) ----------
create table if not exists players (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid not null references teams(id) on delete cascade,
  name          text not null,
  shirt_number  int,
  position      text,                         -- GK / DF / MF / FW
  club          text,
  is_captain    boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (team_id, shirt_number)
);
create index if not exists idx_players_team on players(team_id);

-- ---------- lineups (per match, crawled ~1h before kickoff) ----------
create table if not exists lineups (
  id            uuid primary key default gen_random_uuid(),
  match_id      uuid not null references matches(id) on delete cascade,
  team_id       uuid not null references teams(id),
  player_id     uuid references players(id),  -- nullable: late call-ups not yet in squad
  player_name   text not null,                -- denormalized snapshot
  shirt_number  int,
  position      text,                          -- grid/role for formation rendering
  role          text not null default 'starter', -- 'starter' | 'sub'
  is_captain    boolean not null default false,
  formation     text,                          -- e.g. '4-3-3' (same value across the XI)
  updated_at    timestamptz not null default now(),
  unique (match_id, team_id, player_name)
);
create index if not exists idx_lineups_match on lineups(match_id);

-- ---------- match reviews (LLM output cache) ----------
create table if not exists match_reviews (
  match_id      uuid primary key references matches(id) on delete cascade,
  language      text not null default 'id',
  body          text not null,
  generated_at  timestamptz not null default now()
);

-- ---------- simulations (per user) ----------
create table if not exists simulations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid,                     -- auth.uid() or anon session id
  name              text not null,
  picks             jsonb not null default '{}',   -- { "73": "<team_id>", ... }
  champion_team_id  uuid references teams(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_sim_user on simulations(user_id);

-- ---------- updated_at trigger ----------
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end $$ language plpgsql;

drop trigger if exists trg_matches_touch on matches;
create trigger trg_matches_touch before update on matches
  for each row execute function touch_updated_at();

drop trigger if exists trg_sim_touch on simulations;
create trigger trg_sim_touch before update on simulations
  for each row execute function touch_updated_at();

drop trigger if exists trg_lineups_touch on lineups;
create trigger trg_lineups_touch before update on lineups
  for each row execute function touch_updated_at();

-- ---------- standings view ----------
-- Base ordering by points -> GD -> GF. Head-to-head, fair-play and FIFA-rank
-- tiebreakers are applied in the app/domain layer (they need subset recomputation
-- that's awkward in a single view). Third-place ranking exposed in v_third_place.
create or replace view v_standings as
with played as (
  select home_team_id as team_id, "group",
         home_score gf, away_score ga,
         case when home_score>away_score then 3 when home_score=away_score then 1 else 0 end pts
  from matches where stage='group' and status='finished'
  union all
  select away_team_id, "group",
         away_score, home_score,
         case when away_score>home_score then 3 when away_score=home_score then 1 else 0 end
  from matches where stage='group' and status='finished'
)
select
  t.id as team_id, t.name, t.code, t.flag_emoji, t."group",
  count(p.team_id)                              as played,
  count(*) filter (where p.pts=3)               as won,
  count(*) filter (where p.pts=1)               as drawn,
  count(*) filter (where p.pts=0)               as lost,
  coalesce(sum(p.gf),0)                         as gf,
  coalesce(sum(p.ga),0)                         as ga,
  coalesce(sum(p.gf-p.ga),0)                    as gd,
  coalesce(sum(p.pts),0)                        as points,
  rank() over (
    partition by t."group"
    order by coalesce(sum(p.pts),0) desc,
             coalesce(sum(p.gf-p.ga),0) desc,
             coalesce(sum(p.gf),0) desc
  ) as group_rank
from teams t
left join played p on p.team_id = t.id
where t."group" is not null
group by t.id;

-- third-place teams ranked across all groups (for the 8 best -> R32)
create or replace view v_third_place as
select *, rank() over (order by points desc, gd desc, gf desc) as overall_rank
from v_standings where group_rank = 3;

-- ---------- Row Level Security ----------
alter table teams         enable row level security;
alter table matches       enable row level security;
alter table match_reviews enable row level security;
alter table simulations   enable row level security;
alter table players       enable row level security;
alter table lineups       enable row level security;

-- public read for tournament data
create policy "public read teams"    on teams         for select using (true);
create policy "public read matches"  on matches       for select using (true);
create policy "public read reviews"  on match_reviews for select using (true);
create policy "public read players"  on players       for select using (true);
create policy "public read lineups"  on lineups       for select using (true);

-- writes to tournament data are server-only (service role bypasses RLS).
-- users manage only their own simulations:
create policy "own sims select" on simulations for select using (auth.uid() = user_id);
create policy "own sims insert" on simulations for insert with check (auth.uid() = user_id);
create policy "own sims update" on simulations for update using (auth.uid() = user_id);
create policy "own sims delete" on simulations for delete using (auth.uid() = user_id);
```

### seed.sql
```sql
-- =====================================================================
-- World Cup Fever 2026 — seed data
-- Run AFTER schema.sql. Idempotent (safe to re-run).
-- Source: official FIFA final draw (Dec 5, 2025), all playoffs resolved.
-- fifa_rank values are APPROXIMATE seed heuristics for the simulator —
-- refresh them from a real source via the crawl/API job.
-- =====================================================================

-- ---------- 48 teams (Groups A–L) ----------
insert into teams (name, code, "group", fifa_rank, flag_emoji) values
  ('Mexico','MEX','A',18,'🇲🇽'),
  ('South Korea','KOR','A',24,'🇰🇷'),
  ('South Africa','RSA','A',44,'🇿🇦'),
  ('Czechia','CZE','A',37,'🇨🇿'),

  ('Canada','CAN','B',29,'🇨🇦'),
  ('Switzerland','SUI','B',15,'🇨🇭'),
  ('Qatar','QAT','B',35,'🇶🇦'),
  ('Bosnia and Herzegovina','BIH','B',41,'🇧🇦'),     -- playoff winner (vs Italy)

  ('Brazil','BRA','C',6,'🇧🇷'),
  ('Morocco','MAR','C',11,'🇲🇦'),
  ('Scotland','SCO','C',31,'🏴󠁧󠁢󠁳󠁣󠁴󠁿'),
  ('Haiti','HAI','C',47,'🇭🇹'),

  ('United States','USA','D',17,'🇺🇸'),
  ('Paraguay','PAR','D',32,'🇵🇾'),
  ('Australia','AUS','D',22,'🇦🇺'),
  ('Turkiye','TUR','D',34,'🇹🇷'),                    -- playoff winner (vs Kosovo)

  ('Germany','GER','E',9,'🇩🇪'),
  ('Ecuador','ECU','E',20,'🇪🇨'),
  ('Ivory Coast','CIV','E',27,'🇨🇮'),
  ('Curacao','CUW','E',48,'🇨🇼'),                    -- World Cup debut

  ('Netherlands','NED','F',7,'🇳🇱'),
  ('Japan','JPN','F',14,'🇯🇵'),
  ('Tunisia','TUN','F',33,'🇹🇳'),
  ('Sweden','SWE','F',28,'🇸🇪'),                     -- playoff winner (verify slot)

  ('Belgium','BEL','G',8,'🇧🇪'),
  ('Iran','IRN','G',19,'🇮🇷'),
  ('Egypt','EGY','G',25,'🇪🇬'),
  ('New Zealand','NZL','G',46,'🇳🇿'),

  ('Spain','ESP','H',1,'🇪🇸'),
  ('Uruguay','URU','H',13,'🇺🇾'),
  ('Saudi Arabia','KSA','H',36,'🇸🇦'),
  ('Cape Verde','CPV','H',38,'🇨🇻'),                 -- World Cup debut

  ('France','FRA','I',3,'🇫🇷'),
  ('Senegal','SEN','I',16,'🇸🇳'),
  ('Norway','NOR','I',23,'🇳🇴'),
  ('Iraq','IRQ','I',42,'🇮🇶'),                       -- intercontinental playoff winner

  ('Argentina','ARG','J',2,'🇦🇷'),
  ('Austria','AUT','J',21,'🇦🇹'),
  ('Algeria','ALG','J',30,'🇩🇿'),
  ('Jordan','JOR','J',43,'🇯🇴'),                     -- World Cup debut

  ('Portugal','POR','K',5,'🇵🇹'),
  ('Colombia','COL','K',12,'🇨🇴'),
  ('Uzbekistan','UZB','K',39,'🇺🇿'),                 -- World Cup debut
  ('DR Congo','COD','K',40,'🇨🇩'),                   -- intercontinental playoff winner

  ('England','ENG','L',4,'🏴󠁧󠁢󠁥󠁮󠁧󠁿'),
  ('Croatia','CRO','L',10,'🇭🇷'),
  ('Panama','PAN','L',26,'🇵🇦'),
  ('Ghana','GHA','L',45,'🇬🇭')
on conflict (name) do update
  set "group"=excluded."group", fifa_rank=excluded.fifa_rank, flag_emoji=excluded.flag_emoji;

-- ---------- 72 group fixtures (auto-generated round-robin) ----------
-- Pairings are the full round-robin per group; position is by fifa_rank within
-- the group. matchday is the standard pattern. kickoff_utc/venue are left NULL
-- for the seed-crawl job to fill from the official schedule.
do $$
declare g char(1); ids uuid[]; mnum int := 1;
begin
  delete from matches where stage='group';  -- idempotent reset
  for g in select distinct "group" from teams where "group" is not null order by 1 loop
    select array_agg(id order by fifa_rank) into ids from teams where "group"=g;
    insert into matches(match_number,stage,"group",matchday,home_team_id,away_team_id,status) values
      (mnum,    'group',g,1,ids[1],ids[2],'scheduled'),
      (mnum+1,  'group',g,1,ids[3],ids[4],'scheduled'),
      (mnum+2,  'group',g,2,ids[1],ids[3],'scheduled'),
      (mnum+3,  'group',g,2,ids[2],ids[4],'scheduled'),
      (mnum+4,  'group',g,3,ids[1],ids[4],'scheduled'),
      (mnum+5,  'group',g,3,ids[2],ids[3],'scheduled');
    mnum := mnum + 6;
  end loop;
end $$;

-- ---------- knockout skeleton (matches 73–104) — OFFICIAL FIFA bracket ----------
-- Slot grammar (the resolution job parses these):
--   'W-<G>'   = winner of group G          (e.g. 'W-E')
--   'RU-<G>'  = runner-up of group G        (e.g. 'RU-A')
--   '3rd:XYZ' = best third-placed team among the listed groups (FIFA allocation table)
--   'W<n>'    = winner of match number n    (e.g. 'W73')
--   'L<n>'    = loser of match number n     (third-place playoff)
-- Pairings & venues are from the official Dec 5, 2025 draw bracket and are FIXED.
-- kickoff_utc left NULL → filled by the seed-crawl job. Round date windows (local):
--   R32: Jun 28–Jul 3 | R16: Jul 4–7 | QF: Jul 9–11 | SF: Jul 14–15 | 3rd: Jul 18 | Final: Jul 19, 2026
delete from matches where stage in ('r32','r16','qf','sf','third_place','final');

insert into matches(match_number,stage,home_slot,away_slot,city,venue,status) values
  -- Round of 32 (73–88)
  (73,'r32','RU-A','RU-B','Los Angeles','SoFi Stadium','scheduled'),
  (74,'r32','W-E','3rd:ABCDF','Boston','Gillette Stadium','scheduled'),
  (75,'r32','W-F','RU-C','Guadalajara','Estadio Akron','scheduled'),
  (76,'r32','W-C','RU-F','Houston','NRG Stadium','scheduled'),
  (77,'r32','W-I','3rd:CDFGH','New York New Jersey','MetLife Stadium','scheduled'),
  (78,'r32','RU-E','RU-I','Dallas','AT&T Stadium','scheduled'),
  (79,'r32','W-A','3rd:CEFHI','Mexico City','Estadio Azteca','scheduled'),
  (80,'r32','W-L','3rd:EHIJK','Atlanta','Mercedes-Benz Stadium','scheduled'),
  (81,'r32','W-D','3rd:BEFIJ','San Francisco Bay Area','Levi''s Stadium','scheduled'),
  (82,'r32','W-G','3rd:AEHIJ','Seattle','Lumen Field','scheduled'),
  (83,'r32','RU-K','RU-L','Toronto','BMO Field','scheduled'),
  (84,'r32','W-H','RU-J','Los Angeles','SoFi Stadium','scheduled'),
  (85,'r32','W-B','3rd:EFGIJ','Vancouver','BC Place','scheduled'),
  (86,'r32','W-J','RU-H','Miami','Hard Rock Stadium','scheduled'),
  (87,'r32','W-K','3rd:DEIJL','Kansas City','Arrowhead Stadium','scheduled'),
  (88,'r32','RU-D','RU-G','Dallas','AT&T Stadium','scheduled'),
  -- Round of 16 (89–96)
  (89,'r16','W74','W77','Philadelphia','Lincoln Financial Field','scheduled'),
  (90,'r16','W73','W75','Houston','NRG Stadium','scheduled'),
  (91,'r16','W76','W78','New York New Jersey','MetLife Stadium','scheduled'),
  (92,'r16','W79','W80','Mexico City','Estadio Azteca','scheduled'),
  (93,'r16','W83','W84','Dallas','AT&T Stadium','scheduled'),
  (94,'r16','W81','W82','Seattle','Lumen Field','scheduled'),
  (95,'r16','W86','W88','Atlanta','Mercedes-Benz Stadium','scheduled'),
  (96,'r16','W85','W87','Vancouver','BC Place','scheduled'),
  -- Quarter-finals (97–100)
  (97,'qf','W89','W90','Boston','Gillette Stadium','scheduled'),
  (98,'qf','W93','W94','Los Angeles','SoFi Stadium','scheduled'),
  (99,'qf','W91','W92','Miami','Hard Rock Stadium','scheduled'),
  (100,'qf','W95','W96','Kansas City','Arrowhead Stadium','scheduled'),
  -- Semi-finals (101–102)
  (101,'sf','W97','W98','Dallas','AT&T Stadium','scheduled'),
  (102,'sf','W99','W100','Atlanta','Mercedes-Benz Stadium','scheduled'),
  -- Third place + Final
  (103,'third_place','L101','L102','Miami','Hard Rock Stadium','scheduled'),
  (104,'final','W101','W102','New York New Jersey','MetLife Stadium','scheduled');
```
