# TripSync — Product Requirements Document
**Author:** Dhirendra Mohan | **Cohort:** Rethink Systems, Cohort 7 | **Date:** April 2026
**Version:** 2.0 | **Status:** 95% Built (60/63 items)

*Working product: APIcTrips (TripSync is the PRD codename)*

---

# SECTION 1 — Discovery Insights
*Who's the user, what did you learn?*

---

## Primary Research

**Interviews conducted:** 6 (minimum cohort requirement met)
**Method:** Narrative-style interviews — "Tell me about the last trip you planned with friends. Walk me through how it happened."

### Key Interview Profiles

| Interviewee | Age | Travel Type | Key Role |
|-------------|-----|-------------|----------|
| Mentor (primary) | 30s | International, group, family | De-facto trip organiser |
| Cross-group 1 | 28 | Friends group travel | Passive participant |
| Cross-group 2 | 32 | Couple + family trips | Co-planner |
| Cross-group 3 | 35 | Solo + group | Occasional organiser |
| Cross-group 4 | 29 | Budget group travel | First-time organiser |
| Cross-group 5 | 33 | Multi-family trips | Logistics handler |

---

### The User — Meet Arjun

**Age:** 28–35 | **City:** Tier-1 India (Mumbai / Bangalore / Delhi)
**Travel frequency:** 4–5 international + ~1 local trip/month
**Budget allocation:** 10–15% of annual income on travel

Arjun loves travel. He ends up as the de-facto organiser for every group trip — not by choice, but because no one else steps up. He's organised enough to make it work. He's frustrated enough to complain every time.

**He travels in three modes:**
- **With girlfriend (60%)** — structured, shared Excel sheet, day-by-day itinerary
- **With friends (30%, 6–7 people)** — chaotic, WhatsApp group, improv decisions
- **With family/parents (10%)** — fully delegated, he handles all logistics while parents decide destination

**His tools today:**
WhatsApp → Google Sheets → Skyscanner → Booking.com / Airbnb → Splitwise
*Five apps. None of them talk to each other.*

---

### Top 5 Quotes from Research

> *"We spent three hours debating hotel star ratings. I just needed someone to decide."*

> *"We had a hike booked in Iceland. Two days before, someone wanted to swap it. The booking was non-refundable."*

> *"One person drops out and suddenly the whole trip costs everyone more and half the group wants to cancel."*

> *"Splitwise shows we're even but I know we're not — some transactions weren't logged because the bank description made no sense."*

> *"I open four different apps just to answer the question: are we still going, and how much have we spent?"*

---

### Key Findings from Primary Research

| # | Finding | Frequency |
|---|---------|-----------|
| 1 | Tool fragmentation — 3–5 apps per trip | All 6 interviews |
| 2 | Group indecision on minor details | 5 of 6 interviews |
| 3 | Last-minute changes after bookings made | 5 of 6 interviews |
| 4 | Unreliable group members / drop-outs | 4 of 6 interviews |
| 5 | Expense tracking gaps (Splitwise imperfect) | 4 of 6 interviews |
| 6 | Organiser carries 100% of coordination burden | All 6 interviews |
| 7 | Social awkwardness around budget disclosure | 3 of 6 interviews |

---

## Secondary Research Validation

**Market size:** $2.37B travel planning app market (2024), growing at 8–10% CAGR
**User behaviour:** Average traveller spends 18 hours researching and planning a single trip
**Group pain:** Budget management is the #1 conflict point in group travel (secondary research)
**Fragmentation confirmed:** Users average 3–5 apps per trip across all demographics
**The gap:** No tool combines group itinerary + decision-locking + shared expense pool

### Competitive Audit

| Tool | What it solves | What it misses |
|------|---------------|----------------|
| TripIt | Email confirmation parsing | No budgeting, no group decisions |
| Wanderlog | Itinerary building + discovery | No group voting, weak expense splitting |
| Google Travel | Auto-parses Gmail bookings | No manual planning, no collaboration |
| Splitwise | Expense splitting | Zero itinerary awareness |
| WhatsApp | Group communication | Not a planning tool — but the real competitor |

**Insight:** WhatsApp is the real competitor, not Wanderlog. Groups default to WhatsApp because it's frictionless — any solution must be equally frictionless to displace it.

---

# SECTION 2 — Problem Prioritization
*What problem, and why this one?*

---

## Problems Identified

From research, five distinct problems surfaced:

| Problem | Severity | Frequency | Fixable with tech? |
|---------|----------|-----------|-------------------|
| Group indecision / no structured voting | High | Very High | Yes |
| Last-minute changes with no accountability | High | High | Yes |
| Tool fragmentation (5 apps) | High | Very High | Yes |
| Expense tracking errors | Medium | High | Yes |
| Drop-outs with no commitment mechanism | Medium | Medium | Partially |

## Why This Problem

**Chosen problem:** Group coordination failure — the organiser carries all the burden because the group has no structured way to make and keep decisions.

**Rationale for choosing this over others:**

1. **It's the root cause, not a symptom.** Tool fragmentation exists *because* no single tool handles group coordination. Fixing coordination consolidates the tools naturally.

2. **No existing solution.** Every competitor either ignores group decision-making entirely or treats it as a notes/chat feature. The decision-locking mechanic does not exist anywhere in the market.

3. **Highest emotional resonance.** Every interview surfaced this pain unprompted. It's not a feature request — it's a lived frustration.

4. **Buildable in MVP scope.** Unlike AI-powered discovery or real-time booking integrations, the core mechanic (poll → vote → lock) is technically achievable in 5–6 days.

---

## Problem Statement

> **"Group travel fails because there's no structured way to make decisions stick — leaving the organiser to chase consensus on WhatsApp, absorb last-minute changes, and carry the entire coordination burden alone across three phases: planning, during the trip, and post-trip settlement."**

---

# SECTION 3 — Proposed Solution
*Simple explanation of the MVP*

---

## TripSync — One Hub. Decisions That Stick.

TripSync is a group-first travel coordination tool that follows a trip from the first decision to the final receipt. It replaces the WhatsApp + Sheets + Splitwise stack with one structured, shared space where groups plan together, decisions lock, and money is tracked transparently.

---

## The Core Mechanic — Decisions That Stick

```
Organiser creates a poll
        ↓
Group votes (deadline-gated)
        ↓
Majority wins → Decision LOCKS
        ↓
No changes without a formal re-vote
```

This single mechanic — which does not exist in any competitor — is the must-have differentiator. It turns group indecision from an open-ended WhatsApp debate into a time-bounded, self-resolving process.

---

## MVP Feature Summary

**Pre-Trip**
- Trip creation with shareable invite link (no sign-up required for participants)
- Vibe Check — each member sets budget preference, travel pace, and style. App flags misalignments before planning starts.
- Vibe compatibility score (0–100%) — shown to organiser before planning starts
- Anonymous budget disclosure — members reveal real budgets without social pressure
- Decision Engine — create polls, group votes, deadline auto-lock, decision log
- Compatibility preview on invite — new member sees compatibility % before joining
- Referral system — personal invite links with tracking

**During Trip**
- LIVE mode auto-switch on `start_date`
- Day-by-day itinerary view (check off activities, swap via quick vote)
- Pivot poll — fast 1–6h re-vote for mid-trip plan changes
- Shared Expense Pool — per-transaction logging (`paid_by` + `split_between`), debt minimization, UPI settlement
- Trip Health Score — live signal (Healthy / At Risk) with suggested next action
- Emergency card — hospital, embassy, and member contacts in one tap
- Shared vendor contact book — driver, hotel, guide contacts with tap-to-call
- Receipt photo capture — attach photo to any expense
- Live presence indicator — shows who's viewing the trip right now
- Activity toasts — in-app notifications for group actions

**Post-Trip**
- Trip recap page — auto-generated stats, budget breakdown, highlights
- Trip ratings — 1–5 stars (overall/planning/value + would-go-again)
- Photo memories gallery — upload, view, delete trip photos
- Debt amnesty vote — majority vote to forgive small balances post-trip
- Expense report export (CSV)
- Trip templates — publish itinerary for others to clone
- Affiliate booking links — Booking.com / MakeMyTrip / Agoda

---

## The Shared Expense Pool (Actual Implementation)

Instead of an upfront pool contribution model, actual spending is tracked per-transaction:

- Organiser sets a **total trip budget** and per-category targets — this is the pool *target*
- Any member logs an expense: amount, category, `paid_by`, `split_between` (subset of members)
- **Debt minimization algorithm** computes net balances — who owes whom, minimum transactions
- Dashboard shows live net balances: Pool Total → Spent per Category → Remaining
- Report generated on demand — full per-person breakdown, shareable link

---

## UPI-First Settlement

Built for India's UPI ecosystem:

- `buildUpiLink()` generates a `upi://pay` deep-link pre-filled with amount, payee VPA, and trip reference
- Settlement ledger shows net balance per person (A owes B ₹X)
- Tap "Pay via UPI" → opens PhonePe / GPay / BHIM pre-filled
- Payer taps "I've paid" → organiser confirms → settlement marked confirmed
- Post-trip: **Debt Amnesty Vote** — majority can vote to forgive balances under a threshold

---

## Delighters

| Feature | What it does |
|---------|-------------|
| Last Chance Nudge | Email to non-voters 2hrs before poll closes — app chases, not Arjun *(V3)* |
| Vibe Compatibility Score | 0–100% match shown before planning starts |
| Anonymous Budget Disclosure | Members reveal real budgets without social pressure |
| Ghost Detection | Alerts organiser when a member silently disengages |
| Dropout Ripple Calculator | Shows exact cost + itinerary impact if a member drops out |
| Trip Momentum Score | Engagement metric with suggested nudges |
| Debt Amnesty Vote | Post-trip majority vote to forgive small balances |
| Live Presence | Shows who's viewing the trip right now |
| Emergency Card | Hospital, embassy, member contacts — one tap |
| Pivot Poll | Fast 1–6h re-vote mid-trip for plan changes |

---

# SECTION 4 — Implementation Plan
*The build roadmap*

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React 19.2.4 + Tailwind CSS v4 | Fast to build, clean responsive UI |
| Backend | Next.js 16.2.2 (App Router) | Full-stack in one repo; note: params are a Promise in v16 |
| Language | TypeScript 5.9 | Type safety across API routes and components |
| Database | Supabase (Postgres + Realtime) | Real-time sync; RLS for per-trip access control |
| Auth | Supabase Auth (`@supabase/ssr ^0.10`) | Invite link works without auth for participants |
| Storage | Supabase Storage | Receipt photos + trip memory photos |
| Deployment | Vercel | Auto-deploy on push to main |
| Notifications | Resend + Vercel Cron | Email nudges (V3) |

## Actual Build — 7 Sessions

| Session | Build Focus | Deliverable |
|---------|------------|-------------|
| **Session 1** | Foundation — trip creation, invite flow, Vibe Check, polls, expense pool | Live app at apictrips.vercel.app |
| **Session 2** | Settlement calculator, UPI payment, ghost detection, dropout ripple, momentum | Full organiser intelligence dashboard |
| **Session 3** | Member self-service, anonymous budget disclosure, receipt capture, CSV export | End-to-end member flow |
| **Session 4** | Realtime presence, activity toasts, live poll counts, pivot poll, emergency card, vendor book | Full mid-trip mode |
| **Session 5** | Post-trip: recap, ratings, photo memories, debt amnesty, trip templates, referral system | Complete trip lifecycle |
| **Session 6** | Affiliate links, decisions timeline, digest sharing, "What We Agreed" | Growth + viral features |
| **Session 7** | Hotfix: expenses page 404 (amnesty_votes query decoupled) | Production stability |

## V1 → V2 → V3 Vision

**V1 (Built — 60/63 items):** All coordination, expense, realtime, post-trip, and growth features. Full trip lifecycle from creation to memories.

**V2 (Needs Razorpay):** Pre-commitment micro-deposit (₹200–500 to confirm attendance), freemium model (free: 5 members / 1 trip; paid: unlimited), transaction fee on in-app settlements.

**V3 (Needs ANTHROPIC_API_KEY + Resend):** AI itinerary generator, AI conflict resolver, smart budget estimator, Last Chance Nudge (email non-voters automatically), Today's Plan daily email (8am IST).

## Success Metrics

| Metric | Target |
|--------|--------|
| % of invited members who join the trip | >70% |
| Polls created per trip | ≥2 |
| % of polls that reach a locked decision | >80% |
| Organiser creates a second trip (30-day retention) | >30% |
| Expense pool set up per trip | >60% |
| Post-trip recap viewed by >50% of trip members | >50% |

---

# SECTION 5 — Instruction Design
*Step-by-step build guide*

---

## Core User Flows

### Flow 1 — Trip Creation & Group Onboarding

```
Organiser opens APIcTrips
    → Creates trip (name, destination, dates, estimated budget)
    → Completes Vibe Check (budget preference, pace, travel style)
    → Gets shareable invite link
    → Shares link on WhatsApp

Group member taps link
    → Sees trip summary + compatibility % preview (no sign-up required)
    → Completes their Vibe Check
    → Sets commitment status: In / Tentative / Out
    → Lands on shared trip dashboard

App checks all vibe profiles
    → If conflict detected: "2 members want tight budget, 3 want comfort — align this first"
    → Organiser sees conflict flag on dashboard
    → Vibe compatibility score shown (0–100%)
```

---

### Flow 2 — Decision Engine (Core Mechanic)

```
Organiser creates poll
    → Enters question: "Which hotel should we book?"
    → Adds options: Option A (Zostel ₹800/night), Option B (Airbnb ₹1,400/night)
    → Sets deadline: 24 hours
    → Poll goes live → all members notified

Members vote
    → Each member sees poll on dashboard
    → Taps their choice
    → Sees live vote count (anonymous until deadline)

Organiser sees list of non-voters on the poll card.
[V3: App emails non-voters automatically 2hrs before deadline]

Deadline hits
    → Majority wins → Decision LOCKS
    → All members notified: "Zostel booked — 4/6 voted. Decision locked."
    → Added to Decision Log with timestamp and vote breakdown

If someone wants to change it
    → Submits change request with reason
    → Organiser approves re-vote (optional)
    → New poll opens — previous decision noted
```

---

### Flow 3 — Shared Expense Pool

```
Organiser sets up pool
    → Total trip budget: ₹60,000
    → Per-category targets: Flights ₹20,000 | Stay ₹15,000 | Food ₹10,000 | Transport ₹8,000 | Experiences ₹7,000

Any member logs an expense
    → Taps "Add Expense"
    → Amount: ₹3,200 | Category: Food | Paid by: Rahul | Split between: all 6
    → Pool balance updates live for all members

Dashboard updates
    → Food: ₹3,200 / ₹10,000 (32% used)
    → Pool remaining: ₹56,800
    → All members see the same numbers in real time

Settlement
    → Dashboard shows net balances: "Priya owes Rahul ₹1,100"
    → Tap "Pay via UPI" → opens UPI app pre-filled
    → Payer taps "I've paid" → organiser confirms → settlement confirmed

Post-trip
    → Tap "Export CSV" → full expense breakdown by category and date
    → Debt amnesty vote: majority can forgive balances under ₹500
```

---

### Flow 4 — During Trip (Day-by-Day)

```
Each morning
    → Members open app to see Today's Plan
    → [V3: Daily email sent automatically at 8am IST]
    → Day 3: Beach at Palolem → Lunch at Café Inn → Sunset at Chapora Fort

During the day
    → Any member marks activity as Done / Skipped
    → If skipping: quick poll auto-created "Swap Chapora Fort for Dudhsagar Falls? Vote closes in 1 hour"
    → Group votes → locks → itinerary updates

Pivot poll (mid-trip fast decision)
    → Organiser taps Pivot Poll (red card)
    → Sets duration: 1/2/4/6 hours
    → Group votes → locks fast

End of day
    → Expense summary for the day visible on dashboard
    → Pool balance updated
    → Next day's plan shown
```

---

### Flow 5 — Post-Trip Wrap-Up

```
Trip end_date passes
    → Recap page auto-generated:
        - Total spent vs. budget
        - Category breakdown
        - Polls created / locked
        - Members who joined, engagement score
    → Ratings form: 1–5 stars (overall / planning / value) + would-go-again

Photo memories
    → Members upload photos to shared gallery
    → Lightbox view, tap to delete

Debt settlement
    → Debt amnesty vote: majority forgives balances under threshold
    → Remaining balances settled via UPI

Templates
    → Organiser publishes itinerary as a trip template
    → Others can clone it at /templates — pre-fills itinerary on new trip
```

---

### Flow 6 — Organiser Intelligence

```
Organiser opens dashboard
    → Vibe compatibility score shown (e.g., 74% — 2 conflicts flagged)
        → "2 members prefer budget, 3 prefer comfort — resolve before booking stays"
    → Ghost detection: "Rahul hasn't interacted in 5 days"
        → Suggested action: "Send a direct message or create a poll to re-engage"
    → Dropout ripple: "If Rahul drops, ₹2,400 extra per remaining member"
        → "3 itinerary items assume 6 people — review activities"
    → Momentum score: 62/100
        → "Create a poll to re-engage the group"
```

---

## Screen-by-Screen Build Spec

### Screen 1 — Dashboard (Home)
```
┌─────────────────────────────────┐
│  🌴 Goa Trip — June 14–19       │
│  6 members · 4 confirmed · 2 tentative │
│                                 │
│  TRIP HEALTH: ⚠ AT RISK         │
│  → 2 open polls need votes      │
│                                 │
│  VIBE: 74% compatible           │
│  MOMENTUM: 62/100               │
│                                 │
│  DECISIONS  [2 pending]  [3 locked] │
│  BUDGET     ₹18,400 / ₹60,000   │
│  ITINERARY  Day 2 of 5          │
│                                 │
│  [+ Create Poll]  [+ Log Expense] │
└─────────────────────────────────┘
```

### Screen 2 — Active Poll
```
┌─────────────────────────────────┐
│  Which hotel should we book?    │
│  Closes in: 14h 32m             │
│                                 │
│  ○ Zostel Goa — ₹800/night      │
│    ████░░░░  2 votes            │
│                                 │
│  ○ Airbnb Studio — ₹1,400/night │
│    ██░░░░░░  1 vote             │
│                                 │
│  Waiting: Rahul, Priya          │
│  [V3: Nudge email sent 2hrs before close] │
│                                 │
│  [Cast Your Vote]               │
└─────────────────────────────────┘
```

### Screen 3 — Settlement Ledger
```
┌─────────────────────────────────┐
│  SETTLEMENT LEDGER              │
│                                 │
│  Net Balances                   │
│  Rahul    +₹2,400  (is owed)   │
│  Priya    -₹1,100  (owes)      │
│  Meera    -₹1,300  (owes)      │
│                                 │
│  Settlements                    │
│  Priya → Rahul ₹1,100          │
│  [Pay via UPI ↗]  [I've paid]  │
│                                 │
│  Meera → Rahul ₹1,300          │
│  [Pay via UPI ↗]  [I've paid]  │
└─────────────────────────────────┘
```

### Screen 4 — Post-Trip Recap
```
┌─────────────────────────────────┐
│  Goa Trip Recap 🌴              │
│  June 14–19, 2025 · 6 members  │
│                                 │
│  ₹52,400 spent / ₹60,000 budget│
│  87% budget used                │
│                                 │
│  Polls: 8 created · 7 locked   │
│  Engagement: 82/100             │
│                                 │
│  ★★★★☆  Avg rating (4 rated)   │
│  "Would go again" — 5/6 yes    │
│                                 │
│  [Rate this trip] [View Photos] │
│  [Publish as Template]          │
└─────────────────────────────────┘
```

---

## Feature Prioritisation Summary

| Feature | Priority | Reduces Arjun's Burden? | Ships in V1? |
|---------|----------|------------------------|-------------|
| Trip creation + invite link | P0 | Yes — removes onboarding friction | Yes |
| Vibe Check + conflict flag | P0 | Yes — prevents budget/style fights | Yes |
| Vibe compatibility score (0–100%) | P0 | Yes — quantifies group fit | Yes |
| Anonymous budget disclosure | P0 | Yes — removes social awkwardness | Yes |
| Decision Engine (poll + vote + lock) | P0 | Yes — removes decision chasing | Yes |
| Commitment status (In/Tentative/Out) | P0 | Yes — removes "who's coming" chase | Yes |
| Shared Expense Pool + debt minimization | P0 | Yes — removes sole bookkeeper burden | Yes |
| UPI settlement (one-tap pay + confirm) | P0 | Yes — removes settlement friction | Yes |
| Live budget dashboard | P0 | Yes — removes "how much spent?" messages | Yes |
| On-demand expense report (CSV) | P0 | Yes — removes settlement disputes | Yes |
| Decision Log | P0 | Yes — removes blame and disputes | Yes |
| Trip Health Score + next action | P0 | Yes — replaces manual status monitoring | Yes |
| Ghost detection | P1 | Yes — surfaces silent dropouts | Yes |
| Dropout ripple calculator | P1 | Yes — quantifies dropout impact | Yes |
| Trip momentum score | P1 | Yes — suggests when to nudge | Yes |
| Emergency card | P1 | Yes — single source of truth mid-trip | Yes |
| Vendor contact book | P1 | Yes — tap-to-call replaces saved contacts | Yes |
| Receipt photo capture | P1 | Yes — photo → receipt (partial V1) | Yes (capture only) |
| Debt amnesty vote | P1 | Yes — removes post-trip awkwardness | Yes |
| Trip recap + ratings + memories | P1 | Yes — closes the trip cleanly | Yes |
| Trip templates + referral system | P2 | Indirectly — drives organic growth | Yes |
| Last Chance Nudge | P1 | Yes (strongest) — app chases, not Arjun | V3 |
| Today's Plan daily email | P1 | Yes — no manual morning briefing | V3 |
| AI itinerary generator | P1 | Yes — removes research burden | V3 |
| AI conflict resolver | P2 | Yes — removes negotiation burden | V3 |
| Smart budget estimator | P2 | Yes — removes mental budget tracking | V3 |
| Pre-commitment micro-deposit | P1 | Yes — prevents flaking | V2 |
| Freemium model | P2 | — | V2 |

---

*PRD v2.0 — TripSync / APIcTrips | Dhirendra Mohan | Rethink Systems Cohort 7*
