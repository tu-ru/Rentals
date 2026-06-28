import dotenv from "dotenv"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")

dotenv.config({ path: path.join(projectRoot, ".env") })
dotenv.config({ path: path.join(projectRoot, ".env.local"), override: true })

const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPER_ADMIN_EMAIL",
  "SUPER_ADMIN_PASSWORD",
]

const missingEnvVars = required.filter((key) => !process.env[key] || String(process.env[key]).trim().length === 0)

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required env var(s): ${missingEnvVars.join(", ")}`)
}

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.SUPER_ADMIN_EMAIL.trim().toLowerCase()
const password = process.env.SUPER_ADMIN_PASSWORD
const fullName = (process.env.SUPER_ADMIN_NAME || "Platform Super Admin").trim()
const phone = (process.env.SUPER_ADMIN_PHONE || "").trim() || null
const nationalId = (process.env.SUPER_ADMIN_NATIONAL_ID || "").trim() || null
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function resolveExistingUserId() {
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw new Error(`Failed to look up existing super admin: ${error.message}`)
    }

    const users = data?.users ?? []
    const match = users.find((user) => user.email?.trim().toLowerCase() === email)
    if (match?.id) {
      return match.id
    }

    if (users.length < perPage) {
      return null
    }

    page += 1
  }
}

async function upsertProfile(userId) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      role: "super_admin",
      phone,
      national_id: nationalId,
      organization_id: null,
      is_active: true,
      metadata: {
        email,
      },
    },
    {
      onConflict: "id",
    },
  )

  if (error) {
    throw new Error(`Failed to upsert super admin profile: ${error.message}`)
  }
}

async function main() {
  const existingUserId = await resolveExistingUserId()
  if (existingUserId) {
    throw new Error(`A user with email ${email} already exists. Aborting bootstrap.`)
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      phone,
      national_id: nationalId,
      role: "super_admin",
    },
  })

  if (error) {
    throw new Error(`Failed to create super admin user: ${error.message}`)
  }

  const userId = data.user?.id ?? null
  if (!userId) {
    throw new Error("Super admin user was created, but no user id was returned.")
  }

  await upsertProfile(userId)

  console.log("Loaded environment from .env and .env.local when present.")
  console.log(`Bootstrapped super admin: ${email}`)
  console.log(`User ID: ${userId}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
