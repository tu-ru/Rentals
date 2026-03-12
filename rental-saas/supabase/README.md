# Database Migrations — RentMS Kenya

## Prerequisites

- [pnpm](https://pnpm.io/) installed
- Access to the Supabase project dashboard

---

## Setup (First Time)

**1. Install the Supabase CLI as a dev dependency:**
```bash
pnpm add -D supabase
```

**2. Authenticate with Supabase:**
```bash
pnpm dlx supabase login
```
This opens a browser window to authenticate your account.

**3. Link to the project:**
```bash
pnpm dlx supabase link --project-ref <your-project-ref>
```
Your project ref is in the Supabase dashboard URL:
`https://supabase.com/dashboard/project/YOUR-PROJECT-REF`

---

## Running Migrations

**Push all pending migrations to the remote database:**
```bash
pnpm dlx supabase db push
```

Migrations are located in `supabase/migrations/` and run in order (001 → 006).

---

## Creating a New Migration

```bash
pnpm dlx supabase migration new your_migration_name
```

This generates a new timestamped `.sql` file in `supabase/migrations/`. Write your SQL, then push:

```bash
pnpm dlx supabase db push
```

---

## Useful Commands

| Command | Description |
|---|---|
| `pnpm dlx supabase migration list` | View all migrations and their status |
| `pnpm dlx supabase db pull` | Pull remote schema into a local migration file |
| `pnpm dlx supabase db diff` | Show schema diff between local and remote |
| `pnpm dlx supabase db reset` | Re-run all migrations locally (requires Docker) |

---

## Notes

- Always run migrations in order — do not skip or rename existing files.
- The linked project ref is saved in `supabase/.temp/project-ref`.
- Database password can be found in **Supabase Dashboard → Settings → Database**.
- RLS (Row Level Security) policies are included in migrations — do not disable RLS on any tenant-facing table.