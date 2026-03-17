/**
 * Shared Celcom Africa SMS utility
 * Used by all Edge Functions that need to send SMS
 * Never imported on the frontend
 */

export interface CelcomSendParams {
  mobile: string           // 254XXXXXXXXX format
  message: string
  shortcode: string        // Sender ID
  timeToSend?: string      // "YYYY-MM-DD HH:mm" for scheduling
}

export interface CelcomResponse {
  "respose-code": number   // Note: intentional typo in Celcom API
  "response-description": string
  mobile: number
  messageid: number
  networkid: string
}

export interface CelcomApiResponse {
  responses: CelcomResponse[]
}

export interface SendSmsResult {
  success: boolean
  messageId: number | null
  networkId: string | null
  responseCode: number
  responseDescription: string
  mobile: string
}

export interface DlrResult {
  messageId: number
  status: string
  deliveredAt?: string
  networkId: string
  responseCode: number
}

const CELCOM_SEND_URL = "https://isms.celcomafrica.com/api/services/sendsms/"
const CELCOM_DLR_URL = "https://isms.celcomafrica.com/api/services/getdlr/"
const CELCOM_BALANCE_URL = "https://isms.celcomafrica.com/api/services/getbalance/"

/**
 * Normalize phone to 254XXXXXXXXX format
 * Accepts: 07XXXXXXXX, 01XXXXXXXX, +254XXXXXXXXX, 254XXXXXXXXX
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("254") && digits.length === 12) return digits
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`
  if (digits.startsWith("7") && digits.length === 9) return `254${digits}`
  if (digits.startsWith("1") && digits.length === 9) return `254${digits}`
  throw new Error(`Cannot normalize phone number: ${phone}`)
}

/**
 * Interpolate template variables into message body
 * Replaces {{variable_name}} with actual values
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match  // Leave unreplaced if variable not provided
  })
}

/**
 * Send a single SMS via Celcom Africa API
 */
export async function sendSms(
  params: CelcomSendParams,
  apiKey: string,
  partnerId: string
): Promise<SendSmsResult> {
  const body = {
    apikey: apiKey,
    partnerID: partnerId,
    mobile: params.mobile,
    message: params.message,
    shortcode: params.shortcode,
    pass_type: "plain",
    ...(params.timeToSend ? { timeToSend: params.timeToSend } : {})
  }

  const response = await fetch(CELCOM_SEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })

  const data: CelcomApiResponse = await response.json()
  const result = data?.responses?.[0]

  if (!result) {
    return {
      success: false,
      messageId: null,
      networkId: null,
      responseCode: 0,
      responseDescription: "Empty response from Celcom API",
      mobile: params.mobile
    }
  }

  return {
    success: result["respose-code"] === 200,
    messageId: result.messageid ?? null,
    networkId: result.networkid ?? null,
    responseCode: result["respose-code"],
    responseDescription: result["response-description"],
    mobile: params.mobile
  }
}

/**
 * Get delivery report for a previously sent SMS
 */
export async function getDeliveryReport(
  messageId: number,
  apiKey: string,
  partnerId: string
): Promise<DlrResult> {
  const response = await fetch(CELCOM_DLR_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: apiKey,
      partnerID: partnerId,
      messageID: String(messageId)
    })
  })

  const data = await response.json()

  return {
    messageId,
    status: data?.status ?? "unknown",
    deliveredAt: data?.deliveredAt ?? undefined,
    networkId: data?.networkId ?? "",
    responseCode: data?.["respose-code"] ?? 0
  }
}

/**
 * Check Celcom account SMS balance
 */
export async function getAccountBalance(
  apiKey: string,
  partnerId: string
): Promise<{ balance: number; currency: string }> {
  const response = await fetch(CELCOM_BALANCE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey: apiKey, partnerID: partnerId })
  })

  const data = await response.json()
  return {
    balance: Number(data?.balance ?? 0),
    currency: data?.currency ?? "KES"
  }
}
