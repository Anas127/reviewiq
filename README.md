# ReviewIQ

AI-powered code review interview trainer for software engineers.

Practice catching bugs in real PR-style diffs. Write your review like a senior engineer would. Get graded against ground truth — see exactly what you caught, what you missed, and how a stronger reviewer would have approached it.

**Live:** [reviewiq.dev](https://reviewiq.dev)

---

## What it does

1. Pick your role, language, and seniority level
2. Get a realistic PR diff with 3 bugs planted by AI
3. Write your code review in plain text
4. AI grades your review against the known bug list
5. See your score, bug breakdown, and interviewer feedback

Bugs are author-planted, so grading has actual ground truth — not vibes-based scoring.

---

## Why it exists

Most interview prep tools focus on LeetCode-style problems. But senior engineering roles increasingly use code review as a core interview round. There's no good tooling for practicing this specifically.

ReviewIQ fills that gap.

---

## Stack

- **Frontend + API:** Next.js 15 (App Router, API Routes)
- **Database + Auth:** Supabase (PostgreSQL, Row Level Security)
- **AI:** OpenAI GPT-4o (bug generation + review grading)
- **Payments:** Lemon Squeezy (one-time credit packs)
- **Deploy:** Vercel

---

## Architecture

No separate backend. Next.js API routes handle all server-side logic:

- `/api/generate` — generates a buggy code snippet, checks credits, returns code + bug list (bugs never exposed to client)
- `/api/grade` — grades free-text review against planted bugs, deducts 1 credit, stores session
- `/api/credits` — returns current user credit balance
- `/api/webhook/lemonsqueezy` — receives payment events, adds credits to user profile

---

## Local setup

```bash
git clone https://github.com/Anas127/reviewiq.git
cd reviewiq
npm install
```

Create `.env.local`:

```
OPENAI_API_KEY=your_key
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
LEMONSQUEEZY_API_KEY=your_key
LEMONSQUEEZY_WEBHOOK_SECRET=your_secret
NEXT_PUBLIC_LS_10_REVIEWS_URL=your_checkout_url
NEXT_PUBLIC_LS_30_REVIEWS_URL=your_checkout_url
```

```bash
npm run dev
```

---

## Supabase schema

```sql
-- profiles table (auto-created on signup via trigger)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  credits integer not null default 5,
  created_at timestamp with time zone default timezone('utc', now())
);

-- reviews table
create table reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  role text,
  language text,
  seniority text,
  code text not null,
  bugs jsonb not null,
  user_review text not null,
  score integer not null,
  caught jsonb not null,
  missed jsonb not null,
  feedback text not null,
  created_at timestamp with time zone default timezone('utc', now())
);
```

---

## Pricing

No subscription. One-time credit packs:

- **9€** — 10 reviews
- **19€** — 30 reviews

Credits never expire.

---

Built by [Anas Bahraoui](https://github.com/Anas127)
