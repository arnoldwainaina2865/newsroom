# Newsroom

A world-class, subscription-funded digital publication — built to demonstrate
production-grade full-stack engineering: editorial CMS, metered paywall,
recurring billing (card + M-Pesa), transactional/newsletter email, and an
interactive reader experience.

## End in mind

> A visitor reads three articles free, hits a paywall, subscribes by card or
> M-Pesa, receives a welcome email, and gets a weekly digest — while an editor
> logs into the CMS, drafts an article, schedules it for 6am, and watches
> subscriber and revenue numbers move on a dashboard.

That's the demo. Everything below is built backwards from it.

## Stack

| Layer      | Choice                                                    |
| ---------- | ----------------------------------------------------------- |
| Frontend   | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui |
| CMS        | Payload CMS 3 (embedded in `apps/web`, Postgres-backed)     |
| Backend    | Fastify + TypeScript (`apps/api`)                            |
| Database   | PostgreSQL + Drizzle ORM (`packages/db`)                     |
| Auth       | Better Auth — email magic link + Google OAuth                |
| Payments   | Stripe (card) + M-Pesa Daraja STK Push, behind one interface |
| Email      | Resend + React Email                                        |
| Jobs       | BullMQ + Redis                                               |
| Deploy     | Vercel (web) + Railway/Coolify (api, worker, Postgres, Redis) |

## Monorepo layout

```
newsroom/
├── apps/
│   ├── web/          Next.js app — public site + Payload admin at /admin
│   └── api/           Fastify service — payments, webhooks, metering, jobs
├── packages/
│   ├── db/            Drizzle schema + client (subscriptions, reads, subscribers)
│   └── types/          Shared TypeScript types across apps
├── turbo.json
└── pnpm-workspace.yaml
```

Payload owns the editorial collections (`users`, `articles`, `sections`,
`tags`, `media`) because it needs them for the admin UI. `packages/db` owns
the business-logic tables that don't need CMS editing (`subscriptions`,
`article_reads`, `subscribers`, `newsletters`). Both talk to the same
Postgres database.

## Roadmap

- [ ] **Phase 1 — Read-only publication.** Schema, Payload, ~20 seeded
      articles, homepage, section pages, article pages, author pages. Deployed.
- [ ] **Phase 2 — Accounts and the meter.** Auth, roles, reading history,
      metering logic, server-side paywall truncation, saved articles.
- [ ] **Phase 3 — Money.** Stripe Checkout + Customer Portal, M-Pesa STK
      Push, `PaymentProvider` interface, idempotent webhook → subscription sync.
- [ ] **Phase 4 — Newsletter.** Double opt-in, preference centre, CMS
      composer, BullMQ fan-out, tokenised unsubscribe, open/click tracking.
- [ ] **Phase 5 — Interactive layer.** Pick 2–3: comments, live blog (SSE),
      full-text search, reading progress, editor analytics dashboard.
- [ ] **Phase 6 — Production hardening.** Sentry, rate limiting, Playwright
      E2E, CI, Lighthouse 95+, dynamic OG images, sitemap, RSS.

## Getting started

```bash
pnpm install
cp .env.example .env        # fill in DATABASE_URL etc.
pnpm dev                    # runs web (:3000) and api (:4000) in parallel
```

Seed a demo editor account before you ever demo this to someone — reviewers
will not sign up to see your CMS.

## Data model

See [`packages/db/src/schema.ts`](./packages/db/src/schema.ts) for the
business tables and `apps/web/payload.config.ts` for the editorial
collections. The two fields doing the real work are
`articles.access_tier` (`free` / `metered` / `premium`) and the
`article_reads` table — together they are the paywall.
