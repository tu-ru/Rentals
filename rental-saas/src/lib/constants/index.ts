export const APP_NAME = "RentMS Kenya"
export const APP_VERSION = "1.0.0"

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  LANDLORD: "landlord",
  AGENT: "agent",
  TENANT: "tenant",
} as const

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  INVITE_REQUIRED: "/invite-required",
  ONBOARDING: "/onboarding",
  DASHBOARD: "/dashboard",
  PROPERTIES: "/dashboard/properties",
  TENANTS: "/dashboard/tenants",
  LEASES: "/dashboard/leases",
  PAYMENTS: "/dashboard/payments",
  INVOICES: "/dashboard/invoices",
  MAINTENANCE: "/dashboard/maintenance",
  MESSAGES: "/dashboard/messages",
  REPORTS: "/dashboard/reports",
  SETTINGS: "/dashboard/settings",
  TENANT_HOME: "/tenant",
} as const

export const QUERY_KEYS = {
  AGENT: "agent",
  PROPERTIES: "properties",
  UNITS: "units",
  TENANTS: "tenants",
  LEASES: "leases",
  INVOICES: "invoices",
  PAYMENTS: "payments",
  MAINTENANCE: "maintenance",
  MESSAGES: "messages",
  NOTIFICATIONS: "notifications",
  REPORTS: "reports",
  SETTINGS: "settings",
  TEAM_MEMBERS: "team-members",
} as const
