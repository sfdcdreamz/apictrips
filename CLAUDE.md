@AGENTS.md

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
