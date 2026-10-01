# ReviewIQ

ReviewIQ is an AI-powered code review interview trainer. Engineers practice on realistic pull requests, submit written reviews, and receive feedback against known planted issues.

**Live:** [reviewiq-ruby.vercel.app](https://reviewiq-ruby.vercel.app)

## Stack

- **App and API:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- **Auth and database:** Supabase Auth and PostgreSQL with row-level security
- **AI:** OpenAI GPT-4o
- **Payments:** Gumroad membership, processed by a server-side webhook
- **Deploy:** Vercel

## Architecture

There is no separate backend service. Next.js route handlers own generation, grading, balance reads, and Gumroad events:

- /api/generate checks the signed-in profile balance, creates an exercise, and returns a user-bound encrypted token. Planted issues remain inside that token.
- /api/grade grades the review, then calls the atomic complete_review database function. The function inserts the completed review and deducts one credit in a single transaction.
- /api/credits returns the signed-in user's balance.
- /api/webhooks/gumroad accepts Gumroad Ping form events, verifies the product and sale/subscription against Gumroad's API, then calls an idempotent database function.

profiles.credits is the balance. New profiles start with 5 credits. pending_credits holds paid grants for a buyer who has not created a ReviewIQ account yet. A profile insert trigger applies the matching pending balance. payment_events makes each sale/event idempotent, and gumroad_subscriptions records membership status. Cancellation changes future grant eligibility; existing credits remain.

## Pricing and credit rules

- **Free:** 5 credits on account creation.
- **ReviewIQ Pro:** €8.99 per month and 10 credits per successful billing cycle.
- Unused credits roll over.
- A credit is consumed only after AI grading succeeds and the review is stored successfully.
- Gumroad sale events include the initial membership payment and each successful recurring payment. Failed, refunded, or chargebacked sales are not credited.
- Cancellation stops later grants and does not remove existing credits.

## Local setup

Install dependencies with npm install and create .env.local with:

    OPENAI_API_KEY=your_openai_key
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    EXERCISE_TOKEN_SECRET=at_least_32_random_characters
    GUMROAD_ACCESS_TOKEN=your_gumroad_access_token
    GUMROAD_PRODUCT_ID=your_gumroad_product_permalink
    GUMROAD_WEBHOOK_SECRET=a_long_random_secret
    NEXT_PUBLIC_GUMROAD_URL=https://yourname.gumroad.com/l/your-product

In Gumroad, configure Ping to call:

    https://your-domain.example/api/webhooks/gumroad?secret=YOUR_GUMROAD_WEBHOOK_SECRET

Create Gumroad resource subscriptions for sale, cancellation, subscription_ended, and subscription_restarted, each using that endpoint as its post_url and adding event_type=EVENT_NAME to the URL (for example, ?secret=...&event_type=sale). The endpoint accepts Gumroad's JSON or URL-encoded event payloads. Set GUMROAD_PRODUCT_ID to the product ID or permalink shown in Gumroad, and ensure the payload includes buyer email, product ID/permalink, sale ID, and subscription ID for sale events. Successful sale data is verified through the Gumroad API before granting credits. Lifecycle events must match a subscription already recorded from a verified sale.

Apply supabase/migrations/20261001000000_gumroad_credits.sql in the Supabase SQL editor before deploying.

The existing project uses Supabase-managed profile and review tables; the migration adds the Gumroad event, pending-credit, and subscription tables and transactional functions/triggers. Confirm the profiles signup trigger continues to set email and credits to 5.

## Launch verification checklist

- New account receives 5 credits.
- Verified initial Gumroad purchase grants 10 credits.
- A later successful recurring payment grants another 10 credits.
- User sees the new balance on the practice screen.
- A successfully graded and stored review deducts 1 credit.
- OpenAI, validation, or database failures do not consume credits.
- Replaying the same sale event does not grant credits twice.
- A buyer without a ReviewIQ account receives pending credits on signup.
- Cancellation grants no future credits and leaves the existing balance intact.
- A refunded or chargebacked sale is not granted.

## Development

Use npm run dev to start locally. Use npm run lint and npm run build to check the project.

Built by [Anas Bahraoui](https://github.com/Anas127).
