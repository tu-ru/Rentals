# Database Migrations — K535

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
pnpm exec supabase link --project-ref <your-project-ref>
```
Your project ref is in the Supabase dashboard URL:
`https://supabase.com/dashboard/project/YOUR-PROJECT-REF`

---

## Running Migrations

**Push all pending migrations to the remote database:**
```bash
pnpm exec supabase db push
```

Migrations are located in `supabase/migrations/` and run in order (001 → 006).

---

## Creating a New Migration

```bash
pnpm exec supabase migration new your_migration_name
```

This generates a new timestamped `.sql` file in `supabase/migrations/`. Write your SQL, then push:

```bash
pnpm exec supabase db push
```

---

## Useful Commands

| Command | Description |
|---|---|
| `pnpm exec supabase migration list` | View all migrations and their status |
| `pnpm exec supabase db pull` | Pull remote schema into a local migration file |
| `pnpm exec supabase db diff` | Show schema diff between local and remote |
| `pnpm exec supabase db reset` | Re-run all migrations locally (requires Docker) |

---

## Notes

- Always run migrations in order — do not skip or rename existing files.
- The linked project ref is saved in `supabase/.temp/project-ref`.
- Database password can be found in **Supabase Dashboard → Settings → Database**.
- RLS (Row Level Security) policies are included in migrations — do not disable RLS on any tenant-facing table.
## Bootstrap first super admin

For a fresh hosted Supabase project, do not seed `auth.users` directly.

Use the one-time bootstrap script to create the first `super_admin`:

```powershell
$env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
$env:SUPER_ADMIN_EMAIL="you@example.com"
$env:SUPER_ADMIN_PASSWORD="ChangeMe123!"
$env:SUPER_ADMIN_NAME="Your Name"
$env:SUPER_ADMIN_PHONE="2547XXXXXXXX"
$env:SUPER_ADMIN_NATIONAL_ID="12345678"
npm run bootstrap:super-admin
```

The package script loads `.env` first and `.env.local` second when they exist, so you can keep bootstrap credentials in either file during development.

After that:
1. run the SQL seed for business data
2. sign in as the bootstrapped `super_admin`
3. invite or provision everyone else through the app
