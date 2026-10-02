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



## Development

Use npm run dev to start locally. Use npm run lint and npm run build to check the project.

Built by [Anas Bahraoui](https://github.com/Anas127).
