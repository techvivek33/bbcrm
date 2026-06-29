# Agency OS — Agency Operating System

One platform that replaces 20 Excel sheets, WhatsApp groups, Google Drive folders, and manual
follow-ups for an influencer-marketing agency. Your **team**, **brands**, and **creators**
collaborate professionally in one place:

> CRM + Campaign Management + Creator Database + Payments + Approvals + Brand & Creator Portals + Analytics.

**Status: production-ready.** All 20 modules from the product spec are built, the app authenticates
real users with role-based access, the production build is clean, and every route has been
smoke-tested as each role.

---

## 🚀 Quick start

```bash
pnpm install          # install dependencies
pnpm setup            # generate client + create DB + seed demo data
pnpm dev              # http://localhost:3000   (or: pnpm build && pnpm start)
```

### Sign in

You'll land on a login screen. Use **one-click demo sign-in**, or any account below with the
password **`agency123`**:

| Account | Email | Role | Lands on |
|---------|-------|------|----------|
| Hetal Shah | hetalshahmd@gmail.com | **Admin** | Full internal app |
| Aarav Mehta | aarav@agency.os | Campaign Manager | Internal app |
| Sneha Patel | sneha@agency.os | Talent Manager | Internal app |
| Vikram Rao | vikram@agency.os | Finance | Internal app |
| Karan Bhatia | karan@zepto.com | **Brand POC** | Brand Portal |
| Tanmay Bhat | tanmay@creator.os | **Creator** | Creator Portal |

> Signed in as **Admin**, use the avatar menu (top-right) → **"View as"** to instantly preview any
> role, including the brand and creator portals.

---

## ✨ Modules (all 20 built)

| # | Module | Route |
|---|--------|-------|
| 1 | **Master Dashboard** — live KPIs, overdue/upcoming deliverables, brand status, team productivity | `/` |
| 2 | **Brand CRM** — database, timeline, notes, payments, contracts + **Add Brand** form | `/brands` |
| 3 | **Creator CRM** — profiles, socials, performance, documents vault + **Add Creator** form | `/creators` |
| 4 | **Onboarding** — verification pipeline, approve/reject, self-onboarding application | `/onboarding` |
| 5 | **Campaign Management** — pipeline kanban, interactive stages, roster, deliverables + **New Campaign** | `/campaigns` |
| 6 | **Task Management** — kanban with live status changes + **New Task** | `/tasks` |
| 7 | **Content Approvals** — versioned Internal→Brand workflow, approve/revise/reject, audit trail | `/approvals` |
| 8 | **Discovery Engine** — advanced filters + **AI Fit Score** ranking | `/discovery` |
| 9 | **Proposal Builder** — shortlist creators, reach/cost projections, status flow, PDF export | `/proposals` |
| 11 | **Payment Management** — receivables & payables, automated due reminders | `/payments` |
| 12 | **Invoices** — generator + printable GST invoice + status flow | `/invoices` |
| 13 | **Contracts** — management, expiry/renewal tracking, simulated e-sign | `/contracts` |
| 14 | **Analytics** — campaign / creator / brand reports with CPM/CPV/CTR + charts | `/analytics` |
| 15 | **Team Management** — members + portal accounts + **RBAC access matrix** | `/team` |
| 16 | **Knowledge Center** — searchable asset library + add assets | `/knowledge` |
| 18 | **Revenue Intelligence** — monthly revenue, by-brand/creator, margins | `/revenue` |
| 19 | **Brand Portal** — white-labeled, brand-facing campaign/approval/invoice view | `/portal/brand` |
| 19 | **Creator Portal** — creator-facing campaigns, deadlines, payments, contracts | `/portal/creator` |

Plus **Module 10** (timeline/reminders) woven through payments & deliverables, and **Module 17**
(internal notes) on every brand/creator/campaign. **Module 20 (AI)** ships an AI Fit Score today;
the full AI suite is the next horizon (see Roadmap).

---

## 🔐 Auth & roles

- **Real sessions**: HMAC-signed httpOnly cookies, scrypt-hashed passwords, `middleware.ts`
  protects every route, server-action login/logout.
- **Six roles**: `ADMIN`, `CAMPAIGN_MANAGER`, `TALENT_MANAGER`, `FINANCE`, `BRAND_POC`, `CREATOR`.
- **Role-based access**: the sidebar shows only permitted modules (Finance/Team/Portals are gated),
  and **portal-only roles cannot reach the internal app** — they're redirected to their portal.
- **Three surfaces from one codebase**: internal team app (sidebar shell), white-labeled portals
  (brand & creator), and a bare login screen — chosen per request in `app/layout.tsx`.

---

## 🧱 Tech stack

- **Next.js 15** (App Router, Server Components, Server Actions) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — clean, premium UI
- **Prisma ORM** on **SQLite** for dev → swap one line for **PostgreSQL** in production
- **lucide-react** icons, **date-fns** dates

### Useful scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` / `pnpm build` / `pnpm start` | Dev server / production build / serve |
| `pnpm setup` | Generate client + push schema + seed |
| `pnpm db:reset` | Drop, recreate, and re-seed |
| `pnpm db:studio` | Browse the database |

---

## 🗂️ Structure

```
app/
  layout.tsx               # chooses chrome per request: app shell / portal / login
  login/                   # sign-in (+ one-click demo accounts)
  page.tsx                 # Master Dashboard
  brands/ creators/ campaigns/ tasks/        # CRM + ops (list, [id], new)
  approvals/ onboarding/ discovery/ proposals/
  payments/ invoices/ contracts/
  analytics/ revenue/ knowledge/ team/
  portal/brand/ portal/creator/              # white-labeled portals
middleware.ts              # auth gate + path header
components/
  ui/ layout/ detail/      # shared design system + shells
  onboarding/ discovery/ proposals/ invoices/ contracts/ knowledge/  # feature client bits
lib/
  prisma · auth · auth-actions · session · routing
  actions · crud-actions   # all server mutations
  enums · format · serialize · utils · queries
prisma/  schema.prisma · seed.ts
```

---

## ☁️ Deploy to Vercel (live)

The app already runs on **PostgreSQL** (Prisma Postgres): `schema.prisma` uses the `postgresql`
provider, the schema is pushed, and the DB is seeded. The build runs `prisma generate && next build`
(plus a `postinstall` safety net), so Vercel compiles cleanly.

**1. Set Environment Variables** in Vercel (Project → Settings → Environment Variables — Production *and* Preview):

| Key | Value |
|-----|-------|
| `DATABASE_URL` | your `postgres://…@db.prisma.io:5432/postgres?sslmode=require` |
| `POSTGRES_URL` | same as above |
| `PRISMA_DATABASE_URL` | same as above |
| `SESSION_SECRET` | a long random hex (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `DEMO_PASSWORD` | `agency123` (or your choice) |
| `APP_NAME` | `Agency OS` |

**2. Deploy with the Vercel CLI** (no GitHub repo needed):

```bash
npx vercel login          # one-time auth
npx vercel                # creates + links the project, deploys a preview
npx vercel --prod         # promote to production (your live URL)
```

Or push to GitHub and **import the repo** in the Vercel dashboard.

> The database is already migrated + seeded, so the first deploy is live immediately.
> To re-seed or migrate later: `pnpm db:deploy` (push schema + seed) or `pnpm db:push`.

**Scaling note:** the direct Postgres connection is fine for launch. For high serverless
concurrency, switch `DATABASE_URL` to a **Prisma Accelerate** (`prisma://…`) URL — no code changes.

---

## 🧭 Roadmap — the AI layer (Module 20)

AI Fit Score ships today. Next: AI creator recommendations, outreach email writer, campaign
planner & budget allocator, performance predictor, and meeting-notes summarizer — powered by Claude.
