@AGENTS.md

## Last Session Note (2026-04-04, Session 3)

**Completed this session:**
- ✅ #48 Live mode auto-switch — red LIVE badge in TripNav, green banner on dashboard when `start_date ≤ today ≤ end_date`
- ✅ #57 Expense CSV export — GET `/api/trips/[tripId]/export/expenses`, Download CSV button (organiser only)
- ✅ #34 Compatibility check at invite — `existingVibeMembers` returned from invite API, live Vibe Impact card in VibeCheckForm
- ✅ #51 Emergency card — `/trips/[tripId]/emergency` page with member list + India emergency numbers; Emergency tab added to TripNav
- ✅ #47 Live presence — `TripPresence` client component using Supabase Realtime Presence; shows "N viewing" badge when >1 viewer

**DB schema changes still needed** — run ALL of these in Supabase SQL editor before testing:
```sql
-- From previous session (Phases 2–6)
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS upi_id text;
CREATE INDEX IF NOT EXISTS members_user_id_idx ON public.members(user_id);

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS paid_by text;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS split_between text[];

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS digest_token text UNIQUE;

CREATE TABLE IF NOT EXISTS public.settlements (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  from_email text NOT NULL,
  to_email text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  upi_ref text,
  created_at timestamptz DEFAULT now() NOT NULL,
  confirmed_at timestamptz
);
CREATE INDEX IF NOT EXISTS settlements_trip_id_idx ON public.settlements(trip_id);
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Organiser manages settlements"
  ON public.settlements FOR ALL
  USING (trip_id IN (SELECT id FROM public.trips WHERE organiser_id = auth.uid()));

-- NEW this session (#24 anonymous budget disclosure)
CREATE TABLE IF NOT EXISTS public.budget_disclosures (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  member_email text NOT NULL,
  budget_range text NOT NULL CHECK (budget_range IN ('under-5k', '5k-10k', '10k-20k', '20k-50k', 'over-50k')),
  submitted_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (trip_id, member_email)
);
CREATE INDEX IF NOT EXISTS budget_disclosures_trip_id_idx ON public.budget_disclosures(trip_id);
ALTER TABLE public.budget_disclosures ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Members can upsert own disclosure"
  ON public.budget_disclosures FOR ALL
  USING (member_email = auth.email());
```

**Resume next:** Tier 5 #25 (Suspense streaming on dashboard) → Tier 6 (ghost member, dropout ripple) → Tier 9 (realtime).

---

# APIcTrips — Project Guide

## Next.js 16 Breaking Changes (vs training data)
- **Middleware file is `src/proxy.ts`**, not `src/middleware.ts`. Next.js 16 renamed the convention. Having both files causes a hard build error. Never create `src/middleware.ts`.
- **Route params are a Promise** — always `await params` before destructuring (see API Route Pattern below).

## Stack
- **Next.js 16.2.2** (App Router, Turbopack) — see AGENTS.md warning about breaking changes
- **React 19.2.4**
- **Supabase** (`@supabase/ssr ^0.10`, `@supabase/supabase-js ^2`) — auth + database
- **Tailwind CSS v4**
- **TypeScript 5.9**

## Deployment
- Hosted on **Vercel** — auto-deploys on push to `main`
- Vercel project: `sfdcdreamzs-projects / apictrips`
- Framework preset must be set to **Next.js** in Vercel → Settings → Build and Deployment
- Required env vars in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Project Structure

```
src/
  proxy.ts                        # Middleware (auth guard + session refresh) — NOT middleware.ts
  app/
    api/                          # API routes (server-only)
      trips/[tripId]/
        itinerary/route.ts        # POST  — create itinerary item
        members/route.ts
        polls/route.ts
        pool/route.ts
        pool/expenses/route.ts
      itinerary/[itemId]/route.ts # PATCH (toggle done) / DELETE
      polls/[pollId]/route.ts     # PATCH (lock/reopen)
      polls/[pollId]/vote/route.ts
      invite/[inviteCode]/route.ts
      invite/[inviteCode]/join/route.ts
      trips/route.ts
    auth/callback/route.ts
    trips/[tripId]/
      layout.tsx                  # Trip shell with TripNav
      page.tsx                    # Dashboard (members, health, conflicts)
      itinerary/page.tsx          # Itinerary — server page fetches itinerary_items
      expenses/page.tsx
      polls/page.tsx
      vibe-check/page.tsx
    dashboard/page.tsx
    invite/[inviteCode]/page.tsx
    vote/[pollId]/page.tsx
  components/
    itinerary/
      ItineraryClient.tsx         # Day tabs, toggle done, delete
      AddActivityForm.tsx         # Form to add new activity
    dashboard/  decisions/  expenses/  invite/  trips/  ui/  vote/
  lib/
    supabase/
      server.ts                   # createClient() + createServiceRoleClient()
      client.ts                   # browser client
    conflict-detector.ts
    destination-image.ts
    trip-health.ts
    utils.ts
  types/index.ts                  # All shared TypeScript types
```

## Supabase Client Rules

| Client | Function | When to use |
|--------|----------|-------------|
| Auth-aware | `await createClient()` | Auth checks, RLS-enforced reads, organiser verification |
| Service role | `createServiceRoleClient()` | Writes/deletes after auth is already verified; bypasses RLS |

`createClient()` is **async** (awaits cookies). `createServiceRoleClient()` is sync.

## API Route Pattern

All routes follow this sequence:
1. `await createClient()` → `supabase.auth.getUser()` → 401 if no user
2. Verify organiser ownership via `supabase.from('trips').eq('organiser_id', user.id)` → 403 if not owner
3. Validate input → 400 on bad data
4. `createServiceRoleClient()` → perform the write
5. Return `NextResponse.json({ data }, { status: 201/200 })` or `new NextResponse(null, { status: 204 })` for deletes

Route params are a **Promise** — always `await params`:
```ts
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
```

## Database Tables (`supabase/schema.sql`)

| Table | Key columns |
|-------|-------------|
| `trips` | `id`, `organiser_id`, `invite_code`, `start_date`, `end_date` |
| `members` | `trip_id`, `email`, `status` (in/tentative/out), vibe_* fields |
| `polls` | `trip_id`, `options` (text[]), `status` (open/locked), `winning_option` |
| `votes` | `poll_id`, `member_email`, `option_chosen` |
| `pools` | `trip_id`, `total_amount`, `currency` |
| `expenses` | `pool_id`, `amount`, `category`, `logged_by`, `expense_date` |
| `itinerary_items` | `trip_id`, `day_number`, `title`, `item_type`, `status` (pending/done), `cost` |

All tables use `uuid_generate_v4()` PKs and have RLS enabled. Service role client bypasses RLS — use it only after verifying auth manually.

> **`itinerary_items` table:** must be created manually — run the SQL block at the bottom of `supabase/schema.sql` in the Supabase SQL editor.

## Performance Rules

- **Always parallelize independent Supabase fetches with `Promise.all`** — never chain `await` calls that don't depend on each other. Sequential awaits were the main source of slowness.
- Pattern for server pages that need multiple tables:
```ts
const [{ data: a }, { data: b }, { data: c }] = await Promise.all([
  supabase.from('table_a').select('*'),
  supabase.from('table_b').select('*'),
  supabase.from('table_c').select('*'),
])
```
- `getDestinationImage` makes an outbound Unsplash HTTP call — include it inside the `Promise.all`, never await it separately. Requires `UNSPLASH_ACCESS_KEY` env var; short-circuits instantly if unset.

## Types (`src/types/index.ts`)

All shared types live here. Key ones: `Trip`, `Member`, `Poll`, `Vote`, `Pool`, `Expense`, `ItineraryItem`, `TripHealth`, `ConflictResult`.

## Module Status

| Module | UI | API | DB |
|--------|----|-----|----|
| Trips (create/dashboard) | ✅ | ✅ | ✅ |
| Members / Invite | ✅ | ✅ | ✅ |
| Vibe Check | ✅ | ✅ | ✅ |
| Polls / Voting | ✅ | ✅ | ✅ |
| Expense Pool | ✅ | ✅ | ✅ |
| Itinerary | ✅ | ✅ | ✅ (run schema.sql block in Supabase) |
| Mobile Nav (hamburger) | ✅ | — | — |

---

## Session Rules

> These apply to every build session, no exceptions.

1. **Never commit directly to `main`** — Vercel auto-deploys `main`. Always use a feature branch.
2. **Test locally before merging** — `npm run dev` + verify the feature + `npm run build` (no TS errors).
3. **Context budget rule — at ~96% context usage: STOP building.** Do the following before the session ends:
   - Mark completed items ✅ and in-progress items 🚧 in the roadmap below
   - Add/update a `## Last Session Note` section (top of this file) with: what was done, which item to resume, any pending uncommitted changes
   - Remind user to commit open changes
4. **DB changes are additive only** — always use `ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS`. Never drop or rename columns.

---

## Build Roadmap

> Ask Claude: **"what's done and what to build next?"** — it will use this section to guide you.

Legend: ✅ Done · 🔲 Not started · 🚧 In progress

### Tier 1 — Foundation (build first, everything depends on this)
| # | Item | Status | Key files |
|---|------|--------|-----------|
| 1 | Fix N+1 votes query in polls auto-lock | ✅ | `src/app/trips/[tripId]/polls/page.tsx` |
| 2 | Parallelize expenses page Supabase fetches | ✅ | `src/app/trips/[tripId]/expenses/page.tsx` |
| 3 | Fix layout gate — non-organisers see 404 | ✅ | `src/app/trips/[tripId]/layout.tsx` |
| 4 | Widen `ConflictDetail` type (add style + accommodation) | ✅ | `src/types/index.ts` |
| 5 | Add error boundaries | ✅ | `src/app/error.tsx`, `src/app/trips/[tripId]/error.tsx` |
| 6 | Add skeleton loaders (`loading.tsx` per route) | ✅ | `src/app/trips/[tripId]/loading.tsx` + polls/expenses/itinerary |

### Tier 2 — Core Gaps (critical for retention)
| # | Item | Status | Key files |
|---|------|--------|-----------|
| 7 | Member self-service — non-organiser trip view, RSVP, vote, log expense | ✅ | `src/app/trips/[tripId]/member/page.tsx` |
| 8 | Link members to Supabase auth users (`user_id` column) | ✅ | `invite/join/route.ts` updated; DB migration needed |
| 9 | Fix security gap — expense POST has no auth check | ✅ | `src/app/api/trips/[tripId]/pool/expenses/route.ts` |
| 10 | Edit trip details (name, destination, dates) | ✅ | `src/app/api/trips/[tripId]/route.ts` (PATCH) |
| 11 | Delete poll | ✅ | `src/app/api/polls/[pollId]/route.ts` (DELETE added) |
| 12 | Delete / edit expense | ✅ | `src/app/api/trips/[tripId]/pool/expenses/[expenseId]/route.ts` |

### Tier 3 — Expense Settlement (biggest market pain point)
| # | Item | Status | Key files |
|---|------|--------|-----------|
| 13 | Add `paid_by` + `split_between` to expenses schema | ✅ | DB migration needed (see Last Session Note) |
| 14 | Debt minimization settlement calculator | ✅ | `src/lib/settlement-calculator.ts` |
| 15 | Settlement ledger UI (net balances + transactions) | ✅ | `src/components/expenses/SettlementLedger.tsx` |
| 16 | Budget alert banner (≥80% spend) | ✅ | `src/components/expenses/BudgetAlert.tsx` |
| 17 | Settlements API (create + confirm) | ✅ | `src/app/api/trips/[tripId]/settlements/route.ts` |
| 18 | Settlements DB table | ✅ | DB migration needed (see Last Session Note) |

### Tier 4 — Vibe Intelligence (biggest differentiator)
| # | Item | Status | Key files |
|---|------|--------|-----------|
| 19 | Extend conflict detector to style + accommodation | ✅ | `src/lib/conflict-detector.ts` |
| 20 | Add `suggestion` field to conflicts | ✅ | `src/lib/conflict-detector.ts` |
| 21 | Vibe compatibility score (0–100%, weighted 4 dimensions) | ✅ | `src/lib/vibe-score.ts` |
| 22 | Surface vibe score on trip dashboard | ✅ | `src/app/trips/[tripId]/page.tsx` |
| 23 | Surface trip health + days-until-trip on dashboard | ✅ | `src/app/trips/[tripId]/page.tsx` |
| 24 | Anonymous budget disclosure (members submit real budget anonymously) | ✅ | `src/app/api/trips/[tripId]/budget-disclosure/route.ts`, `src/components/budget/` |

### Tier 5 — Performance (market-beating speed)
| # | Item | Status | Key files |
|---|------|--------|-----------|
| 25 | Suspense streaming on trip dashboard | 🔲 | `src/app/trips/[tripId]/page.tsx` |
| 26 | Optimistic UI — expense logging | ✅ | `src/components/expenses/LogExpenseForm.tsx` |
| 27 | Optimistic UI — itinerary toggle | ✅ | `src/components/itinerary/ItineraryClient.tsx` |
| 28 | Optimistic UI — poll voting | ✅ | `src/components/vote/VoteForm.tsx` |
| 29 | Route prefetching on TripNav tabs | ✅ | `src/components/trips/TripNav.tsx` |
| 30 | Shared `useOptimisticList` hook | ✅ | `src/lib/hooks/useOptimisticList.ts` |

### Tier 6 — Organiser Intelligence
| # | Item | Status | Key files |
|---|------|--------|-----------|
| 31 | Ghost member detection (alert when member disengages) | 🔲 | New logic + dashboard alert |
| 32 | Dropout ripple effect calculator (cost/itinerary impact) | 🔲 | New: `src/lib/dropout-calculator.ts` |
| 33 | Trip momentum score (engagement metric with nudges) | 🔲 | New: `src/lib/momentum.ts` |
| 34 | Compatibility check before adding new member | ✅ | `src/components/invite/VibeCheckForm.tsx` + invite API |

### Tier 7 — Payments (India-first UPI)
| # | Item | Status | Key files |
|---|------|--------|-----------|
| 35 | UPI ID field on member profile | ✅ | `supabase/schema.sql` + invite form |
| 36 | `buildUpiLink()` utility | ✅ | New: `src/lib/upi.ts` |
| 37 | "Pay via UPI" button in settlement ledger | ✅ | `src/components/expenses/SettlementLedger.tsx` |
| 38 | "I've paid" → organiser confirms flow | ✅ | Settlements API + UI |
| 39 | Pre-commitment micro-deposit (₹200–500 to confirm attendance) | 🔲 | New flow — Razorpay/UPI |

### Tier 8 — Sharing & Viral Growth
| # | Item | Status | Key files |
|---|------|--------|-----------|
| 40 | Decisions Digest page (all locked polls + itinerary + budget) | ✅ | New: `src/app/trips/[tripId]/digest/page.tsx` |
| 41 | Public share link via `digest_token` (no auth) | ✅ | New: `src/app/digest/[digestToken]/page.tsx` |
| 42 | "What We Agreed" timeline (immutable decision log) | 🔲 | New component |
| 43 | Trip templates (publish itinerary for others to clone) | 🔲 | New feature |
| 44 | Referral system | 🔲 | New feature |

### Tier 9 — Real-Time Features
| # | Item | Status | Key files |
|---|------|--------|-----------|
| 45 | Live poll vote counts (Supabase Realtime) | 🔲 | polls page |
| 46 | Activity notifications (in-app toast) | 🔲 | New: notification system |
| 47 | Live presence (who's viewing the trip) | ✅ | `src/components/trips/TripPresence.tsx` |

### Tier 10 — Mid-Trip Mode
| # | Item | Status | Key files |
|---|------|--------|-----------|
| 48 | Auto-switch to live mode on `start_date` | ✅ | layout or dashboard |
| 49 | Receipt photo capture (Supabase Storage) | 🔲 | expense logging |
| 50 | Pivot poll (instant re-vote mid-trip) | 🔲 | polls |
| 51 | Emergency card (hospital, embassy, member contacts) | ✅ | `src/app/trips/[tripId]/emergency/page.tsx` |
| 52 | Shared vendor contact book (driver, hotel, guide) | 🔲 | New feature |

### Tier 11 — AI Features
| # | Item | Status | Key files |
|---|------|--------|-----------|
| 53 | AI itinerary generator (destination + vibe → draft plan) | 🔲 | Claude API integration |
| 54 | AI conflict resolver (personalised compromise suggestions) | 🔲 | Claude API integration |
| 55 | Smart budget estimator (destination + group + vibe → range) | 🔲 | Claude API integration |

### Tier 12 — Post-Trip
| # | Item | Status | Key files |
|---|------|--------|-----------|
| 56 | Post-trip debt amnesty vote (forgive small balances) | 🔲 | settlements + voting |
| 57 | Expense report export (PDF/CSV) | ✅ | `src/app/api/trips/[tripId]/export/expenses/route.ts` |
| 58 | Trip recap (auto-generated summary) | 🔲 | New page |
| 59 | Trip ratings | 🔲 | New feature |
| 60 | Trip memories / photo gallery (Supabase Storage) | 🔲 | New feature |

### Tier 13 — Monetisation
| # | Item | Status | Key files |
|---|------|--------|-----------|
| 61 | Freemium model (free: 5 members / 1 trip; paid: unlimited) | 🔲 | Auth + billing |
| 62 | Transaction fee on in-app settlements | 🔲 | Razorpay integration |
| 63 | Affiliate commission (Booking.com / MakeMyTrip) | 🔲 | Link generation |

---

## USPs vs Competitors

| Competitor | Gap APIcTrips fills |
|------------|-------------------|
| Splitwise | Has splitting but zero trip planning — APIcTrips does both |
| Wanderlog | Has itinerary but no group decisions or vibe matching |
| Lambus | All-in-one but slow + complex + no compatibility check |
| TripIt | Personal only — no collaboration |

**Unique features no competitor has:**
- Vibe compatibility score before planning starts
- Anonymous budget disclosure (no social awkwardness)
- Ghost member detection + dropout ripple effect
- UPI-native payment settlement
- Trip momentum score
- Pre-commitment micro-deposit to prevent flaking
- Decisions Digest shareable link
