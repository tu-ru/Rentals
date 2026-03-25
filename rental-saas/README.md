# RentMS Kenya
### Modern Rental Property Management Platform

> A production-ready, multi-tenant SaaS platform built for Kenyan landlords, agents, and tenants — with M-Pesa reconciliation, SMS automation, and real-time features.

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-3-cyan?logo=tailwindcss)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)](https://vitejs.dev)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [M-Pesa Integration](#m-pesa-integration)
- [SMS Integration](#sms-integration)
- [Edge Functions](#edge-functions)
- [Folder Structure](#folder-structure)
- [User Roles](#user-roles)
- [Pages & Routes](#pages--routes)
- [PWA Support](#pwa-support)
- [Security](#security)
- [Deployment](#deployment)
- [Go-Live Checklists](#go-live-checklists)
- [Contributing](#contributing)

---

## Overview

RentMS Kenya is a full-stack rental property management system designed specifically for the Kenyan market. It handles everything a landlord needs: property and unit management, tenant onboarding, lease creation, invoice generation, M-Pesa payment reconciliation via the Safaricom Pull Transactions API, SMS tenant notifications via Celcom Africa, real-time messaging, and a full analytics dashboard.

The platform is built as a **multi-tenant SaaS** — each landlord or property management company operates in a completely isolated organization, with Row Level Security enforced at the database layer.

---

## Features

### Property Management
- Unlimited properties and units per organization
- Property types: Apartment, House, Commercial, Bedsitter, Single Room, Studio
- Unit-level tracking: rent amount, deposit, floor, type, status, amenities
- Occupancy rate tracking per property and across portfolio
- Image galleries stored in Supabase Storage with signed URL access

### Tenant Management
- Invite tenants via Supabase magic link (no manual password setup)
- Kenyan phone number validation (07XX / 01XX formats)
- Tenant profile with national ID, contact details, and lease history
- Tenant portal: self-service dashboard for invoices, payments, maintenance, and messaging

### Leases
- Create leases linking tenants to specific units
- Automatic unit status update (vacant → occupied) on lease creation
- Lease termination with reason tracking and unit release
- Lease renewal flow with new end date and rent amount
- 30-day expiry warnings via automated notifications and SMS

### Invoices
- One-click monthly invoice generation for all active leases
- Dynamic line items (rent, utilities, penalties, deposits)
- Computed balance: `amount_due - amount_paid` (database-generated column)
- Invoice statuses: Draft → Sent → Paid / Overdue / Cancelled
- Invoice number format: `INV-YYYY-XXXX` (auto-incrementing per org)

### Payments
- Manual payment recording (Cash, Bank Transfer, Cheque)
- M-Pesa C2B reconciliation via Safaricom Pull Transactions API
- Automatic invoice matching by bill reference (invoice number)
- Duplicate transaction detection (idempotent by `mpesa_transaction_id`)
- Full payment history with M-Pesa transaction IDs

### M-Pesa Integration
- Uses **Safaricom Daraja Pull Transactions API** for C2B reconciliation
- Supports both **Sandbox** and **Production** environments simultaneously
- Stores Daraja consumer key and consumer secret per organization
- Register Pull API per organization from the Settings page
- Query transactions for any 48-hour window with automatic pagination
- All credentials kept server-side in Supabase Edge Functions (never client-exposed)
- Reconciliation log (`mpesa_pull_logs`) for every sync operation
- Automatic invoice status updates after payment reconciliation

### SMS Notifications (Celcom Africa)
- Send SMS to individual tenants or in bulk
- 8 built-in message types with customizable templates per organization
- Template variables: `{{tenant_name}}`, `{{amount}}`, `{{paybill}}`, `{{due_date}}`, and more
- Automated SMS triggers: rent reminders, overdue notices, payment confirmations, lease expiry
- Message scheduling: send at a future date and time
- Full delivery tracking: Queued → Sent → Delivered / Failed
- Celcom delivery report polling (DLR) with status sync
- SMS log table with filter by status, type, tenant, and date range
- Account balance check from Settings page

### Maintenance Requests
- Tenants submit requests with title, category, priority, description, and up to 5 photos
- Images uploaded to Supabase Storage (`maintenance-photos` bucket)
- Admin Kanban board: Open → Assigned → In Progress → Resolved (drag-and-drop)
- Table view alternative with full filter support
- Staff assignment per request
- Tenants receive SMS and in-app notification on status changes

### Real-time Messaging
- Direct messages between tenants and landlord/agent
- Property group chats
- Supabase Realtime channels for instant message delivery
- Online presence indicators using Supabase Presence
- Unread message count badge on sidebar nav
- Optimistic message updates (messages appear instantly on send)

### Notifications
- In-app notification center with unread count badge
- Real-time notification delivery via Supabase Realtime
- Notification types: Rent Reminder, Payment Confirmed, Maintenance Update, Lease Expiry, General
- Mark as read individually or all at once
- Links to relevant page on click

### Analytics & Reports
- KPI dashboard: Revenue MTD, Occupancy Rate, Collection Rate, Open Maintenance
- Rent collection chart: Bar (collected) + Line (expected) + Line (rate %) — 12 months
- Occupancy trend chart with 80% target reference line
- Revenue vs Expenses chart with profit overlay
- Property breakdown: occupancy per property
- Payment method breakdown (M-Pesa vs Cash vs Bank vs Cheque)
- Arrears report: tenants with outstanding balances, sortable by amount and days overdue
- CSV export of payment data
- All charts responsive and interactive (Recharts)

### Settings
- Organization profile: name, logo, address
- M-Pesa configuration: Sandbox + Production shortcodes, registration status
- SMS configuration: Celcom API key, Partner ID, Sender ID
- SMS template editor with live preview and variable reference
- Team management: invite staff (Admin / Agent roles)
- Notification preferences per organization
- Danger zone: organization deletion with confirmation

### Progressive Web App
- Installable on Android and iOS home screen
- Offline caching for static assets (Workbox)
- Network-first strategy for Supabase API calls
- Install prompt banner for eligible browsers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + Vite + TypeScript |
| Routing | React Router v6 |
| Server State | TanStack Query v5 |
| Global State | Zustand v4 |
| Styling | TailwindCSS + shadcn/ui + Radix UI |
| Icons | Lucide React |
| Animation | Framer Motion |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Serverless | Supabase Edge Functions (Deno) |
| Payments | Safaricom Daraja Pull Transactions API |
| SMS | Celcom Africa REST API |
| PWA | Vite PWA Plugin + Workbox |

---

## Architecture

### Multi-Tenant Design

Every business table includes an `organization_id` foreign key. A single Supabase project serves all tenants. Isolation is enforced at two layers:

1. **Row Level Security (RLS)** — PostgreSQL policies using `get_my_org_id()` helper function
2. **Service layer** — All Supabase queries in `*Service.ts` files filter by `organization_id` as the first WHERE clause

```
Landlord A → Organization A → Properties, Units, Tenants, Payments...
Landlord B → Organization B → Properties, Units, Tenants, Payments...
```

Neither landlord can ever see the other's data, even if they share the same Supabase project.

### Feature-Based Structure

Each feature (`properties`, `tenants`, `payments`, etc.) is self-contained:

```
features/[feature]/
  components/   UI components specific to this feature
  hooks/        TanStack Query hooks (useQuery + useMutation)
  services/     Pure async functions that call Supabase
  types/        TypeScript interfaces and Zod schemas
```

Components never call Supabase directly. They call hooks. Hooks call services. Services call Supabase.

### Edge Functions

All third-party API calls (Safaricom, Celcom Africa) run inside Supabase Edge Functions. Credentials are stored as Supabase secrets and per-organization settings — never exposed to the browser.

---

## Database Schema

### Tables

| Table | Description |
|---|---|
| `organizations` | Multi-tenant root. One record per landlord account. |
| `profiles` | User profiles linked to `auth.users`. Stores role and org. |
| `properties` | Rental properties (buildings). |
| `units` | Individual rentable units within a property. |
| `leases` | Lease agreements linking tenants to units. |
| `invoices` | Monthly rent invoices with line items and computed balance. |
| `payments` | Payment records. M-Pesa and manual. |
| `maintenance_requests` | Tenant-submitted maintenance issues. |
| `conversations` | Message threads (direct or group). |
| `conversation_members` | Junction table: profiles ↔ conversations. |
| `messages` | Individual messages within conversations. |
| `notifications` | In-app notifications per user. |
| `expenses` | Property-level expense tracking. |
| `mpesa_pull_logs` | Audit log for every Safaricom Pull API query. |
| `sms_logs` | Full history of every SMS sent through the platform. |
| `sms_templates` | Per-organization customizable SMS message templates. |

### Migrations — Run in Order

```
001_enums.sql          PostgreSQL ENUMs for all status/type fields
002_tables.sql         All CREATE TABLE statements
003_indexes.sql        Performance indexes on FK and filter columns
004_triggers.sql       updated_at auto-trigger + new user profile auto-create
005_rls.sql            Row Level Security policies for all tables
006_storage.sql        Supabase Storage buckets and access policies
007_sms.sql            SMS logs and templates tables
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Safaricom Daraja](https://developer.safaricom.co.ke) account (for M-Pesa)
- A [Celcom Africa](https://celcomafrica.com/register) account (for SMS)
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed

### 1. Clone and Install

```bash
git clone https://github.com/your-org/rentms-kenya.git
cd rentms-kenya
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials (see [Environment Variables](#environment-variables)).

### 3. Run Database Migrations

Using the Supabase dashboard SQL editor or CLI:

```bash
supabase db push
```

Or run each migration manually in order via the Supabase SQL editor.

### 4. Deploy Edge Functions

```bash
supabase functions deploy mpesa-register-pull
supabase functions deploy mpesa-query-transactions
supabase functions deploy mpesa-callback
supabase functions deploy send-notifications
supabase functions deploy scheduled-reminders
supabase functions deploy send-sms
supabase functions deploy check-sms-delivery
```

### 5. Set Edge Function Secrets

```bash
supabase secrets set MPESA_CONSUMER_KEY=your_daraja_consumer_key
supabase secrets set MPESA_CONSUMER_SECRET=your_daraja_consumer_secret
supabase secrets set MPESA_ENV=sandbox
supabase secrets set SERVICE_SECRET=$(node -e "console.log(crypto.randomUUID())")
```

> **SMS credentials** are set per-organization in the app's Settings page — not as global secrets.

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Bootstrap The First Super Admin

For a fresh hosted Supabase project, create the first `super_admin` through the bootstrap script instead of writing directly into `auth.users`.

```bash
npm run bootstrap:super-admin
```

The script reads `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_NAME`, `SUPER_ADMIN_PHONE`, and `SUPER_ADMIN_NATIONAL_ID` from `.env` or `.env.local`.

---

## Environment Variables

### `.env.local` (frontend only — safe to have in browser)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Secrets (backend only — never in frontend)

Set via `supabase secrets set` or the Supabase dashboard:

| Secret | Description |
|---|---|
| `SERVICE_SECRET` | Random UUID for internal Edge Function auth |
| `SUPABASE_URL` | Auto-set by Supabase Edge Function runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-set by Supabase Edge Function runtime |

### Per-Organization Settings (stored in `organizations.settings` JSONB)

These are set by each landlord in the app's Settings page:

| Key | Description |
|---|---|
| `mpesa_consumer_key` | Safaricom Daraja app Consumer Key for this organization |
| `mpesa_consumer_secret` | Safaricom Daraja app Consumer Secret for this organization |
| `sms_api_key` | Celcom Africa API Key |
| `sms_partner_id` | Celcom Africa Partner ID |
| `sms_shortcode` | SMS Sender ID (e.g. `RENTMS`) |
| `sms_auto_welcome` | Boolean: send welcome SMS to new tenants |

M-Pesa fields stored directly on the `organizations` table:

| Column | Description |
|---|---|
| `mpesa_shortcode` | Paybill or Till shortcode for the organization |
| `mpesa_nominated_number` | Nominated number used for Pull API registration |
| `mpesa_env` | Active environment for the organization: `sandbox` or `production` |

---

## Supabase Setup

### Storage Buckets

The migration `006_storage.sql` creates these buckets (all private, accessed via signed URLs):

| Bucket | Used For |
|---|---|
| `property-images` | Property and unit photos |
| `maintenance-photos` | Tenant maintenance request images |
| `documents` | Lease agreements, receipts |
| `avatars` | User and organization profile photos |

### Auth Configuration

In your Supabase dashboard under **Authentication → Settings**:

1. Enable **Email** provider
2. Enable **Magic Links**
3. Set **Site URL** to your production domain
4. Add `http://localhost:5173` to **Redirect URLs** for local development
5. Customize email templates (optional) with your brand name

### Realtime

Enable Realtime on these tables in **Database → Replication**:

- `messages`
- `notifications`

---

## M-Pesa Integration

RentMS uses the **Safaricom Daraja Pull Transactions API** — a reconciliation tool that queries all C2B transactions under a Paybill or Till number within the last 48 hours.
Each organization stores its own Daraja credentials so testers, landlords, and separate portfolios can use isolated sandbox or production apps.

### How It Works

1. Landlord registers their Paybill shortcode via **Settings → M-Pesa → Register Pull API**
2. Tenants pay rent using M-Pesa, using their **invoice number as the account/bill reference**
3. Landlord clicks **"Sync M-Pesa Payments"** on the Payments page (or it runs automatically)
4. The Edge Function queries Safaricom for all transactions in the selected time window
5. Each transaction is matched to an invoice by `billreference` = `invoice_number`
6. New payments are inserted into the `payments` table; duplicates are skipped
7. Matched invoices have their `amount_paid` updated and status set to `paid` or `sent` (partial)

### Environments

Both sandbox and production can be configured per organization. The active environment is toggled in **Settings → M-Pesa**.
In development, keep each test organization on `sandbox` and save its own consumer key and consumer secret in organization settings.

| Environment | Register URL | Query URL |
|---|---|---|
| Sandbox | `https://sandbox.safaricom.co.ke/pulltransactions/v1/register` | `https://sandbox.safaricom.co.ke/pulltransactions/v1/query` |
| Production | `https://api.safaricom.co.ke/pulltransactions/v1/register` | `https://api.safaricom.co.ke/pulltransactions/v1/query` |

### Important Notes

- Transactions are only available for **48 hours** from Safaricom's servers
- The Pull API must be **registered before querying** (one-time per shortcode)
- Only **C2B transactions** (customer-to-business) are supported
- Pagination is handled automatically (offset increments of 100)
- M-Pesa credentials are scoped per organization via `organizations.settings.mpesa_consumer_key` and `organizations.settings.mpesa_consumer_secret`

---

## SMS Integration

RentMS uses the **Celcom Africa REST API** for all SMS communications.

### API Reference

| Endpoint | Method | Description |
|---|---|---|
| `https://isms.celcomafrica.com/api/services/sendsms/` | POST | Send SMS |
| `https://isms.celcomafrica.com/api/services/getdlr/` | POST | Get delivery report |
| `https://isms.celcomafrica.com/api/services/getbalance/` | POST | Check account balance |

### Message Types

| Type | Trigger |
|---|---|
| `welcome` | New tenant added to the system |
| `paybill_info` | Manually sent to share M-Pesa payment details |
| `rent_reminder` | Automated: 3 days before invoice due date |
| `overdue_notice` | Automated: day after invoice due date if unpaid |
| `payment_confirmed` | Automatic: after M-Pesa reconciliation or manual payment |
| `invoice_generated` | After monthly invoice generation |
| `maintenance_update` | After maintenance request status change |
| `lease_expiry` | Automated: 30 days before lease end date |
| `custom` | Free-form message from landlord |

### Template Variables

All templates support these interpolation variables:

```
{{tenant_name}}      Tenant's full name
{{amount}}           Payment amount (KES)
{{due_date}}         Invoice due date
{{property_name}}    Property name
{{unit_number}}      Unit identifier (e.g. A1)
{{paybill}}          M-Pesa Paybill number
{{account_number}}   M-Pesa bill reference / invoice number
{{balance}}          Outstanding balance
{{org_name}}         Organization name
{{lease_end_date}}   Lease expiry date
{{invoice_number}}   Invoice reference number
{{transaction_id}}   M-Pesa transaction ID
```

### Delivery Tracking

Every SMS is logged in `sms_logs` with full lifecycle tracking:

```
queued → sent → delivered
              ↘ failed
```

Delivery reports are fetched from Celcom's DLR endpoint and can be checked manually per message or in batch via the automated hourly job.

### Celcom Error Codes

| Code | Meaning | Action |
|---|---|---|
| `200` | Success | — |
| `1001` | Invalid Sender ID | Check shortcode in Settings |
| `1003` | Invalid mobile number | Verify phone format is 254XXXXXXXXX |
| `1004` | Low SMS credits | Top up Celcom account |
| `1006` | Invalid credentials | Re-enter API Key and Partner ID |
| `4091` | No Partner ID set | Check Settings → SMS |
| `4092` | No API Key provided | Check Settings → SMS |

---

## Edge Functions

| Function | Trigger | Description |
|---|---|---|
| `mpesa-register-pull` | Manual (Settings page) | Registers org shortcode with Safaricom Pull API |
| `mpesa-query-transactions` | Manual (Payments page) | Fetches and reconciles M-Pesa transactions |
| `mpesa-callback` | Safaricom webhook | Receives and logs Safaricom callback notifications |
| `send-notifications` | Internal | Creates in-app notifications for system events |
| `scheduled-reminders` | Supabase cron (daily) | Sends overdue alerts, rent reminders, lease expiry warnings |
| `send-sms` | Frontend + Internal | Sends SMS via Celcom Africa API, logs result |
| `check-sms-delivery` | Frontend + Cron | Polls Celcom DLR endpoint, updates delivery status |

### Scheduled Functions (Supabase Cron)

Set these up in **Supabase Dashboard → Database → Extensions → pg_cron**:

```sql
-- Daily reminders at 8:00 AM EAT (05:00 UTC)
SELECT cron.schedule(
  'daily-reminders',
  '0 5 * * *',
  $$ SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/scheduled-reminders',
    headers := jsonb_build_object('X-Service-Secret', current_setting('app.service_secret'))
  ) $$
);

-- Hourly DLR check
SELECT cron.schedule(
  'check-sms-delivery',
  '0 * * * *',
  $$ SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/check-sms-delivery',
    headers := jsonb_build_object('X-Service-Secret', current_setting('app.service_secret'))
  ) $$
);
```

---

## Folder Structure

```
rental-saas/
├── public/
│   ├── manifest.json
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
│
├── src/
│   ├── app/
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx        Auth context + role-based redirects
│   │   │   ├── ThemeProvider.tsx       Light/dark/system theme
│   │   │   └── QueryProvider.tsx       TanStack Query client
│   │   └── router/
│   │       ├── index.tsx               All routes
│   │       ├── PrivateRoute.tsx        Auth guard
│   │       └── RoleRoute.tsx           Role-based guard
│   │
│   ├── features/
│   │   ├── auth/                       Login, register, onboarding
│   │   ├── properties/                 Property + unit CRUD
│   │   ├── tenants/                    Tenant management + invites
│   │   ├── leases/                     Lease lifecycle
│   │   ├── invoices/                   Invoice generation + management
│   │   ├── payments/                   Manual payments + M-Pesa
│   │   ├── maintenance/                Requests + Kanban board
│   │   ├── messaging/                  Realtime chat
│   │   ├── reports/                    Charts + analytics
│   │   ├── notifications/              In-app notifications
│   │   ├── sms/                        SMS send, logs, templates
│   │   └── settings/                   Org + M-Pesa + SMS config
│   │
│   ├── components/
│   │   ├── ui/                         shadcn/ui generated components
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.tsx     Sidebar + TopNav wrapper
│   │   │   ├── Sidebar.tsx             Collapsible nav with role-based items
│   │   │   ├── TopNav.tsx              Sticky top bar with notifications
│   │   │   ├── TenantLayout.tsx        Top-nav-only layout for tenants
│   │   │   └── AuthLayout.tsx          Centered card layout for auth pages
│   │   └── shared/
│   │       ├── DataTable.tsx           Generic TanStack Table wrapper
│   │       ├── StatCard.tsx            KPI card with count-up animation
│   │       ├── PageHeader.tsx          Title + subtitle + actions
│   │       ├── EmptyState.tsx          Empty list placeholder
│   │       ├── LoadingSpinner.tsx      Spinner + PageLoader
│   │       ├── ThemeToggle.tsx         Light/dark/system toggle button
│   │       ├── NotificationBell.tsx    Bell icon with unread badge + popover
│   │       └── InstallPrompt.tsx       PWA install banner
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               Supabase singleton client
│   │   │   └── storage.ts              Signed URL helpers
│   │   ├── mpesa/
│   │   │   ├── types.ts                M-Pesa API TypeScript types
│   │   │   └── hooks.ts                useMpesaRegisterPull, useMpesaQueryTransactions
│   │   ├── utils/
│   │   │   ├── cn.ts                   clsx + tailwind-merge
│   │   │   ├── format.ts               KES currency, dates, phone
│   │   │   ├── validators.ts           Shared Zod schemas
│   │   │   └── errors.ts               Supabase error code → friendly message
│   │   └── constants/
│   │       └── index.ts                ROLES, ROUTES, QUERY_KEYS
│   │
│   ├── hooks/
│   │   ├── useSidebarStore.ts          Zustand: sidebar collapse state
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── global.types.ts
│   │   └── mpesa.types.ts
│   │
│   └── styles/
│       └── globals.css                 CSS variables for light + dark themes
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_enums.sql
│   │   ├── 002_tables.sql
│   │   ├── 003_indexes.sql
│   │   ├── 004_triggers.sql
│   │   ├── 005_rls.sql
│   │   ├── 006_storage.sql
│   │   └── 007_sms.sql
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── auth.ts                 JWT validation utility
│   │   │   ├── mpesa.ts                Safaricom API utility
│   │   │   └── sms.ts                  Celcom Africa API utility
│   │   ├── mpesa-register-pull/
│   │   ├── mpesa-query-transactions/
│   │   ├── mpesa-callback/
│   │   ├── send-notifications/
│   │   ├── scheduled-reminders/
│   │   ├── send-sms/
│   │   └── check-sms-delivery/
│   └── seed.sql
│
├── .env.example
├── .env.local                          ← never commit this
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## User Roles

| Role | Access Level | Default Dashboard |
|---|---|---|
| `admin` | Full access to all org data and settings | `/dashboard` |
| `landlord` | Full access to own org data | `/dashboard` |
| `agent` | View and manage assigned properties | `/agent` |
| `tenant` | Own lease, invoices, payments, maintenance, messages | `/tenant` |

Tenants are **never self-registered** — they are invited by the landlord via email (Supabase magic link). Landlords and agents register via the `/register` flow.

---

## Pages & Routes

### Public

| Route | Page |
|---|---|
| `/` | Landing page |
| `/login` | Email/password + magic link login |
| `/register` | Multi-step registration (account + organization) |
| `/onboarding` | Post-registration setup wizard |

### Landlord / Admin Dashboard (`/dashboard/*`)

| Route | Page |
|---|---|
| `/dashboard` | KPI dashboard with charts |
| `/dashboard/properties` | Property list + create/edit |
| `/dashboard/properties/:id` | Property detail + units grid |
| `/dashboard/tenants` | Tenant list + invite |
| `/dashboard/leases` | Lease management |
| `/dashboard/payments` | Payments + M-Pesa sync panel |
| `/dashboard/invoices` | Invoice list + generate monthly |
| `/dashboard/maintenance` | Kanban board + table view |
| `/dashboard/messages` | Two-panel realtime chat |
| `/dashboard/sms` | SMS logs + bulk send + templates |
| `/dashboard/reports` | Full analytics dashboard |
| `/dashboard/settings` | Org + M-Pesa + SMS + team settings |

### Tenant Portal (`/tenant/*`)

| Route | Page |
|---|---|
| `/tenant` | Balance, lease summary, quick actions |
| `/tenant/invoices` | Invoice history + download |
| `/tenant/payments` | Payment history |
| `/tenant/maintenance` | Submit and track requests |
| `/tenant/messages` | Direct chat with landlord |

---

## PWA Support

The app is installable as a Progressive Web App on Android and iOS.

**Features:**
- Offline caching for the app shell and static assets
- Network-first strategy for all Supabase API requests
- Install prompt banner shown after first visit
- Standalone display mode (no browser chrome when installed)

**Testing PWA locally:**
```bash
npm run build
npm run preview
```
Open Chrome DevTools → Application → Manifest to verify configuration.

---

## Security

### Row Level Security

Every table has RLS enabled. Two PostgreSQL helper functions drive all policies:

```sql
get_my_org_id()  -- Returns organization_id of the current authenticated user
get_my_role()    -- Returns role of the current authenticated user
```

Core rules:
- Staff (admin/landlord/agent) can access all rows within their `organization_id`
- Tenants can only access rows where `tenant_id = auth.uid()`
- Messages are restricted to conversation members only
- Notifications are restricted to `recipient_id = auth.uid()`

### Credential Security

- Safaricom credentials: stored as Supabase Edge Function secrets (never in frontend code)
- Celcom Africa credentials: stored in `organizations.settings` JSONB (server-readable only, never returned to client directly)
- Supabase anon key: safe for client use (restricted by RLS)
- Service role key: only used inside Edge Functions

### Input Validation

All form inputs are validated with Zod schemas before submission. Kenyan-specific validators:
- Phone: must match `/^(07|01)\d{8}$/` and is normalized to `254XXXXXXXXX` before storage
- M-Pesa shortcode: 5–6 digits only
- M-Pesa transaction ID: 10-character alphanumeric

### File Uploads

- All uploads go to private Supabase Storage buckets
- Files are served via signed URLs with expiry (never public URLs)
- File type validation on upload (images only for property/maintenance buckets)

---

## Deployment

### Frontend — Vercel (recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy — Vercel auto-detects Vite

```bash
# Or deploy via CLI
npm install -g vercel
vercel --prod
```

### Backend — Supabase

Your Supabase project is already production. Just ensure:
1. All 7 migrations are run in order
2. All 7 Edge Functions are deployed
3. All secrets are set
4. Realtime is enabled on `messages` and `notifications` tables
5. Cron jobs are configured for scheduled reminders

---

## Go-Live Checklists

### M-Pesa Production

```
[ ] Create account at developer.safaricom.co.ke
[ ] Create a production app and retrieve Consumer Key + Secret
[ ] Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in Supabase secrets
[ ] Set MPESA_ENV=production in Supabase secrets
[ ] Redeploy mpesa-register-pull and mpesa-query-transactions
[ ] In Settings → M-Pesa → Production: enter live Paybill + Nominated Number
[ ] Click "Register Production Pull API" — confirm success response
[ ] Communicate invoice numbers to tenants as their M-Pesa bill reference
[ ] Run first sync after receiving a test payment
[ ] Verify payment appears in Payments page and invoice is marked paid
```

### SMS Production (Celcom Africa)

```
[ ] Register at celcomafrica.com/register
[ ] Go to dashboard → GET API KEY & PARTNER ID
[ ] Register a Sender ID (allow 1–3 business days for approval)
[ ] Purchase SMS credits (minimum recommended: 1,000 for testing)
[ ] In Settings → SMS: enter API Key, Partner ID, Sender ID
[ ] Click "Test Connection" → confirm balance displays
[ ] Send test SMS to your own number
[ ] Customize all 8 message templates in Dashboard → SMS → Templates
[ ] Enable desired automation toggles in Settings → SMS
[ ] Run supabase functions deploy send-sms check-sms-delivery
[ ] Verify first automated SMS sends after adding a tenant
```

### General Production

```
[ ] Run all 7 migrations on production Supabase project
[ ] Deploy all 7 Edge Functions
[ ] Set all Supabase secrets
[ ] Configure Supabase Auth: Site URL + allowed redirect URLs
[ ] Enable Realtime on messages and notifications tables
[ ] Set up cron jobs for scheduled-reminders and check-sms-delivery
[ ] Configure custom domain in Vercel
[ ] Update Supabase Auth Site URL to production domain
[ ] Run Lighthouse audit — verify PWA score ≥ 90
[ ] Test login/register flow end to end
[ ] Test M-Pesa sandbox sync
[ ] Test SMS send and delivery tracking
[ ] Create first organization and verify full landlord onboarding flow
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Follow the existing feature module pattern (components / hooks / services / types)
4. Ensure `npm run build` passes with zero TypeScript errors
5. Test dark mode on any new pages
6. Submit a pull request with a clear description

### Code Conventions

- All Supabase queries must include `organization_id` filter (even with RLS as safety net)
- All monetary values stored and displayed in **KES** (no USD)
- Phone numbers stored as `254XXXXXXXXX` (E.164 without the `+`)
- Dates stored as ISO 8601 UTC, displayed in `en-KE` locale
- Error messages passed through `handleSupabaseError()` before showing to users
- Mutations must show a toast on both success and failure

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">
  Built for Kenya 🇰🇪 &nbsp;·&nbsp; Powered by Supabase + Safaricom + Celcom Africa
</div>
