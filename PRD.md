# TripSync — Product Requirements Document
**Author:** Dhirendra Mohan | **Cohort:** Rethink Systems, Cohort 7 | **Date:** April 2026
**Version:** 1.0 | **Status:** Ready to Build

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
- Decision Engine — create polls, group votes, deadline auto-lock, decision log

**During Trip**
- Day-by-day itinerary view (check off activities, swap via quick vote)
- Shared Expense Pool — one central fund, anyone logs expenses, live balance visible to all
- Trip Health Score — live signal (Healthy / At Risk) with suggested next action

**Post-Trip**
- On-demand Expense Report — full breakdown, shareable link
- Decision Log — complete audit trail of every group decision made

---

## The Shared Expense Pool (vs. Splitwise model)

Instead of distributed individual logging (which fails when descriptions are unclear):
- Each member contributes their share to a shared pool upfront
- Expenses are drawn from the pool — anyone can log, category required
- Dashboard shows: Pool Total → Spent per Category → Remaining
- Report generated on demand — no end-of-trip reconciliation fight

---

## Delighters

| Feature | What it does |
|---------|-------------|
| Last Chance Nudge | App directly messages non-voters 2hrs before poll closes — *Arjun stops writing "bhai please vote"* |
| Vibe Check Conflict Alert | Surfaces "3 want budget, 2 want comfort" before the hotel debate starts |
| Decision Log | Post-trip record of every choice made and how — settles disputes permanently |

---

# SECTION 4 — Implementation Plan
*The build roadmap*

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React + Tailwind CSS | Fast to build, clean responsive UI |
| Backend | Next.js (API routes) | Full-stack in one repo, fast setup |
| Database | Supabase (Postgres + Realtime) | Real-time sync for collaborative updates |
| Auth | Supabase Auth | Invite link works without auth for participants |
| Deployment | Vercel | Live URL from Day 1 |

## 6-Day Build Roadmap

| Day | Build Focus | Deliverable |
|-----|------------|-------------|
| **Day 1** | Project setup + Vercel deploy + Trip creation + Invite link flow | Live empty shell at public URL |
| **Day 2** | Decision Engine — poll creation, group voting, deadline auto-lock, decision log | Core mechanic working end-to-end |
| **Day 3** | Expense Pool — setup, category logging, live dashboard | Budget tracking live |
| **Day 4** | During-trip view — day-by-day itinerary, commitment status, Trip Health Score | Full trip flow usable |
| **Day 5** | Post-trip — expense report, decision log, real scenario ("Goa, 6 friends") | Realistic populated demo |
| **Day 6** | Bug fixes + polish + PRD write-up + demo recording | Submission ready |

## V1 → V2 → V3 Vision

**V1 (This build):** Core coordination — decisions, expense pool, commitment tracking
**V2 (Month 2):** AI layer — Receipt Intelligence (photo → auto-log), Budget Oracle (spend prediction), Last Chance Nudge automation
**V3 (Month 3):** RAG-powered Trip Curator — given group profile and budget, AI suggests poll options from indexed travel content (Tripadvisor, Reddit, blogs)

## Success Metrics

| Metric | Target |
|--------|--------|
| % of invited members who join the trip | >70% |
| Polls created per trip | ≥2 |
| % of polls that reach a locked decision | >80% |
| Organiser creates a second trip (30-day retention) | >30% |

---

# SECTION 5 — Instruction Design
*Step-by-step build guide*

---

## Core User Flows

### Flow 1 — Trip Creation & Group Onboarding

```
Organiser opens TripSync
    → Creates trip (name, destination, dates, estimated budget)
    → Completes Vibe Check (budget preference, pace, travel style)
    → Gets shareable invite link
    → Shares link on WhatsApp

Group member taps link
    → Sees trip summary (no sign-up required)
    → Completes their Vibe Check
    → Sets commitment status: In / Tentative / Out
    → Lands on shared trip dashboard

App checks all vibe profiles
    → If conflict detected: "2 members want tight budget, 3 want comfort — align this first"
    → Organiser sees conflict flag on dashboard
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

2 hours before deadline
    → Last Chance Nudge sent to non-voters: "Rahul, the group is waiting on your vote. Closes in 2 hours."

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
    → Per member contribution: ₹10,000 (6 members)
    → Categories: Flights ₹20,000 | Stay ₹15,000 | Food ₹10,000 | Transport ₹8,000 | Experiences ₹7,000

Any member logs an expense
    → Taps "Add Expense"
    → Amount: ₹3,200 | Category: Food | Note: "Dinner at Thalassa"
    → Pool balance updates live for all members

Dashboard updates
    → Food: ₹3,200 / ₹10,000 (32% used)
    → Pool remaining: ₹56,800
    → All members see the same numbers in real time

Post-trip
    → Tap "Generate Report"
    → Full expense breakdown by category and date
    → Per-person summary (who logged what)
    → Shareable link sent to group
```

---

### Flow 4 — During Trip (Day-by-Day)

```
Each morning
    → Members receive "Today's Plan" notification
    → Day 3: Beach at Palolem → Lunch at Café Inn → Sunset at Chapora Fort

During the day
    → Any member marks activity as Done / Skipped
    → If skipping: quick poll auto-created "Swap Chapora Fort for Dudhsagar Falls? Vote closes in 1 hour"
    → Group votes → locks → itinerary updates

End of day
    → Expense summary for the day visible on dashboard
    → Pool balance updated
    → Next day's plan shown
```

---

### Flow 5 — Post-Trip Wrap-Up

```
Trip marked complete by organiser
    → Expense Report auto-generated
    → Decision Log compiled (all locked decisions with vote breakdown)
    → Trip Health Score final summary

Report shared with group
    → Shareable link → anyone can view
    → Breakdown: planned vs. actual per category
    → Any unresolved balances flagged for settlement

Settlement
    → Report shows who owes what
    → Members settle offline and mark as settled in app
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
│                                 │
│  [Cast Your Vote]               │
└─────────────────────────────────┘
```

### Screen 3 — Expense Pool Dashboard
```
┌─────────────────────────────────┐
│  EXPENSE POOL  ₹41,600 remaining │
│  Total: ₹60,000                 │
│                                 │
│  Flights     ████████░░  ₹18,400│
│  Stay        ██░░░░░░░░   ₹4,200│
│  Food        ███░░░░░░░   ₹5,800│
│  Transport   █░░░░░░░░░   ₹1,200│
│  Experiences ░░░░░░░░░░      ₹0 │
│                                 │
│  [+ Add Expense]  [View Report] │
└─────────────────────────────────┘
```

---

## Feature Prioritisation Summary

| Feature | Priority | Reduces Arjun's Burden? | Ships in V1? |
|---------|----------|------------------------|-------------|
| Trip creation + invite link | P0 | Yes — removes onboarding friction | Yes |
| Vibe Check + conflict flag | P0 | Yes — prevents budget/style fights | Yes |
| Decision Engine (poll + vote + lock) | P0 | Yes — removes decision chasing | Yes |
| Commitment status (In/Tentative/Out) | P0 | Yes — removes "who's coming" chase | Yes |
| Shared Expense Pool | P0 | Yes — removes sole bookkeeper burden | Yes |
| Live budget dashboard | P0 | Yes — removes "how much spent?" messages | Yes |
| On-demand expense report | P0 | Yes — removes settlement disputes | Yes |
| Decision Log | P0 | Yes — removes blame and disputes | Yes |
| Trip Health Score + next action | P0 | Yes — replaces manual status monitoring | Yes |
| Last Chance Nudge | P1 | Yes (strongest) — app chases, not Arjun | V2 |
| Receipt Intelligence (AI) | P1 | Yes — removes manual expense logging | V2 |
| Budget Oracle (AI prediction) | P1 | Yes — removes mental budget tracking | V2 |
| RAG Trip Curator (AI suggestions) | P2 | Yes — removes research burden | V3 |

---

*PRD v1.0 — TripSync | Dhirendra Mohan | Rethink Systems Cohort 7*
