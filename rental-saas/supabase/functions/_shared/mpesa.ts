export interface MpesaOrganizationConfig {
  id: string
  name: string
  mpesa_shortcode: string | null
  mpesa_nominated_number: string | null
  mpesa_env: "sandbox" | "production"
  settings?: Record<string, unknown> | null
}

export interface MpesaAccessTokenResult {
  accessToken: string
  baseUrl: string
}

const SANDBOX_BASE_URL = "https://sandbox.safaricom.co.ke"
const PRODUCTION_BASE_URL = "https://api.safaricom.co.ke"

function getBaseUrl(env: "sandbox" | "production") {
  return env === "production" ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL
}

export function getMpesaCredentials(organization: MpesaOrganizationConfig) {
  const settings = (organization.settings ?? {}) as Record<string, unknown>
  const consumerKey = typeof settings.mpesa_consumer_key === "string" ? settings.mpesa_consumer_key.trim() : ""
  const consumerSecret = typeof settings.mpesa_consumer_secret === "string" ? settings.mpesa_consumer_secret.trim() : ""

  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa credentials are not configured for this organization.")
  }

  if (!organization.mpesa_shortcode?.trim()) {
    throw new Error("M-Pesa shortcode is not configured for this organization.")
  }

  return {
    consumerKey,
    consumerSecret,
    shortcode: organization.mpesa_shortcode.trim(),
    nominatedNumber: organization.mpesa_nominated_number?.trim() || "",
    environment: organization.mpesa_env ?? "sandbox",
  }
}

export async function getAccessToken(organization: MpesaOrganizationConfig): Promise<MpesaAccessTokenResult> {
  const { consumerKey, consumerSecret, environment } = getMpesaCredentials(organization)
  const baseUrl = getBaseUrl(environment)
  const encoded = btoa(`${consumerKey}:${consumerSecret}`)

  const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${encoded}`,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.errorMessage ?? data.error_description ?? "Failed to obtain M-Pesa access token.")
  }

  if (typeof data.access_token !== "string" || data.access_token.length === 0) {
    throw new Error("M-Pesa access token response did not contain access_token.")
  }

  return {
    accessToken: data.access_token,
    baseUrl,
  }
}

export async function mpesaPost<TResponse>(
  organization: MpesaOrganizationConfig,
  path: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const { accessToken, baseUrl } = await getAccessToken(organization)
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.ResponseDescription ?? data.errorMessage ?? data.error_description ?? "M-Pesa request failed.")
  }

  return data as TResponse
}

export function normalizeTransactionList(payload: Record<string, unknown>): Record<string, unknown>[] {
  const candidates = [
    payload.Transactions,
    payload.transactions,
    payload.Result,
    payload.result,
    payload.data,
    payload.items,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    }
  }

  return []
}

export function normalizeReference(transaction: Record<string, unknown>): string | null {
  const candidates = [
    transaction.BillReference,
    transaction.billreference,
    transaction.billReference,
    transaction.AccountReference,
    transaction.accountreference,
    transaction.accountReference,
    transaction.reference,
  ]

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim()
  }

  return null
}

export function normalizeMpesaTransactionId(transaction: Record<string, unknown>): string | null {
  const candidates = [
    transaction.TransID,
    transaction.transId,
    transaction.transactionId,
    transaction.transaction_id,
    transaction.ReceiptNumber,
    transaction.receiptNumber,
  ]

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim()
  }

  return null
}

export function normalizeMpesaAmount(transaction: Record<string, unknown>): number {
  const candidates = [
    transaction.TransAmount,
    transaction.transAmount,
    transaction.Amount,
    transaction.amount,
  ]

  for (const value of candidates) {
    const amount = Number(value)
    if (Number.isFinite(amount) && amount >= 0) return amount
  }

  return 0
}

export function normalizePhone(transaction: Record<string, unknown>): string | null {
  const candidates = [
    transaction.MSISDN,
    transaction.msisdn,
    transaction.PhoneNumber,
    transaction.phoneNumber,
    transaction.phone,
  ]

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim()
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
  }

  return null
}

export function normalizeOrganizationName(transaction: Record<string, unknown>): string | null {
  const candidates = [
    transaction.BusinessShortCode,
    transaction.businessShortCode,
    transaction.OrganizationName,
    transaction.organizationName,
    transaction.OrgName,
  ]

  for (const value of candidates) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim()
  }

  return null
}

export function normalizeTransactionDate(transaction: Record<string, unknown>): string | null {
  const candidates = [
    transaction.TransTime,
    transaction.transTime,
    transaction.TransactionDate,
    transaction.transactionDate,
    transaction.time,
  ]

  for (const value of candidates) {
    if (typeof value !== "string" || value.trim().length === 0) continue
    const trimmed = value.trim()
    if (/^\d{14}$/.test(trimmed)) {
      const yyyy = trimmed.slice(0, 4)
      const mm = trimmed.slice(4, 6)
      const dd = trimmed.slice(6, 8)
      const hh = trimmed.slice(8, 10)
      const mi = trimmed.slice(10, 12)
      const ss = trimmed.slice(12, 14)
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}+03:00`
    }

    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }

  return null
}
