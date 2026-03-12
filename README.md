# RentMS Kenya — Rental Property Management System

## Quick Start
1. Clone repo
2. cp .env.example .env.local and fill in Supabase credentials
3. npm install
4. Run Supabase migrations in order (001 → 006)
5. npm run dev

## Architecture
- Multi-tenant: each organization is isolated by organization_id + RLS
- M-Pesa: Pull API for C2B reconciliation (sandbox + production)
- Realtime: Supabase Realtime for messaging + notifications

## Deployment
- Frontend: Vercel (connect GitHub repo)
- Backend: Supabase (existing project)
- Edge Functions: supabase functions deploy --all
