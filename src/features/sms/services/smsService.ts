import { supabase } from "../../../lib/supabase/client"
import type { SmsLog, SmsTemplate, SendSmsInput, SmsSendResult } from "../types/sms.types"

// Get SMS logs for org with optional filters
export async function getSmsLogs(
  organizationId: string,
  filters?: {
    tenantId?: string
    status?: string
    messageType?: string
    dateFrom?: string
    dateTo?: string
    limit?: number
  }
): Promise<SmsLog[]> {
  let query = supabase
    .from("sms_logs")
    .select(`
      *,
      tenant:profiles!sms_logs_tenant_id_fkey(full_name, phone)
    `)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 100)

  if (filters?.tenantId) query = query.eq("tenant_id", filters.tenantId)
  if (filters?.status) query = query.eq("status", filters.status)
  if (filters?.messageType) query = query.eq("message_type", filters.messageType)
  if (filters?.dateFrom) query = query.gte("created_at", filters.dateFrom)
  if (filters?.dateTo) query = query.lte("created_at", filters.dateTo)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// Get SMS stats for dashboard
export async function getSmsStats(organizationId: string): Promise<{
  totalSent: number
  delivered: number
  failed: number
  deliveryRate: number
  sentToday: number
}> {
  const today = new Date().toISOString().split("T")[0]

  const { data } = await supabase
    .from("sms_logs")
    .select("status, created_at")
    .eq("organization_id", organizationId)

  const all = data ?? []
  const totalSent = all.filter((l) => l.status !== "queued").length
  const delivered = all.filter((l) => l.status === "delivered").length
  const failed = all.filter((l) => l.status === "failed").length
  const sentToday = all.filter((l) => l.created_at.startsWith(today)).length
  const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0

  return { totalSent, delivered, failed, deliveryRate, sentToday }
}

// Send SMS via Edge Function
export async function sendSms(
  organizationId: string,
  input: SendSmsInput
): Promise<SmsSendResult> {
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ organization_id: organizationId, ...input })
    }
  )

  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? "SMS send failed")
  return data
}

// Send SMS to multiple tenants (bulk)
export async function sendBulkSms(
  organizationId: string,
  tenantIds: string[],
  messageType: string,
  templateVariables?: Record<string, string>
): Promise<{ sent: number; failed: number; results: SmsSendResult[] }> {
  const results: SmsSendResult[] = []
  let sent = 0
  let failed = 0

  // Send sequentially to avoid rate limits
  for (const tenantId of tenantIds) {
    try {
      const result = await sendSms(organizationId, {
        tenant_id: tenantId,
        message_type: messageType as any,
        template_variables: templateVariables
      })
      results.push(result)
      if (result.success) sent++
      else failed++
    } catch {
      failed++
    }
    // Small delay between sends
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  return { sent, failed, results }
}

// Check delivery status for a specific log entry
export async function checkDeliveryStatus(logId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()

  await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-sms-delivery`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ log_id: logId })
    }
  )
}

// SMS Templates CRUD
export async function getSmsTemplates(organizationId: string): Promise<SmsTemplate[]> {
  const { data, error } = await supabase
    .from("sms_templates")
    .select("*")
    .eq("organization_id", organizationId)
    .order("message_type")

  if (error) throw error
  return data ?? []
}

export async function upsertSmsTemplate(
  organizationId: string,
  messageType: string,
  templateBody: string,
  templateName: string
): Promise<SmsTemplate> {
  const { data, error } = await supabase
    .from("sms_templates")
    .upsert({
      organization_id: organizationId,
      message_type: messageType,
      template_name: templateName,
      template_body: templateBody,
      is_active: true
    }, { onConflict: "organization_id,message_type" })
    .select()
    .single()

  if (error) throw error
  return data
}
