export type SmsMessageType =
  | "welcome"
  | "rent_reminder"
  | "overdue_notice"
  | "payment_confirmed"
  | "invoice_generated"
  | "maintenance_update"
  | "lease_expiry"
  | "paybill_info"
  | "custom"

export type SmsStatus = "queued" | "sent" | "delivered" | "failed" | "scheduled"

export interface SmsLog {
  id: string
  organization_id: string
  tenant_id: string | null
  message_type: SmsMessageType
  message_body: string
  recipient_phone: string
  shortcode: string
  celcom_message_id: number | null
  celcom_network_id: string | null
  status: SmsStatus
  response_code: string | null
  response_description: string | null
  delivered_at: string | null
  failed_reason: string | null
  scheduled_for: string | null
  related_invoice_id: string | null
  related_payment_id: string | null
  related_lease_id: string | null
  related_maintenance_id: string | null
  sent_by: string | null
  is_automated: boolean
  created_at: string
  // Joined
  tenant?: { full_name: string; phone: string }
}

export interface SmsTemplate {
  id: string
  organization_id: string
  message_type: SmsMessageType
  template_name: string
  template_body: string
  is_active: boolean
  created_at: string
}

export interface SendSmsInput {
  tenant_id: string
  message_type: SmsMessageType
  message_body?: string
  template_variables?: Record<string, string>
  related_invoice_id?: string
  related_payment_id?: string
  related_lease_id?: string
  related_maintenance_id?: string
  scheduled_for?: string
}

export interface SmsSendResult {
  success: boolean
  log_id: string
  message_id: number | null
  response_code: number
  response_description: string
}

// Default templates - shown in UI and used as seeds
export const DEFAULT_SMS_TEMPLATES: Record<SmsMessageType, string> = {
  welcome:
    "Hello {{tenant_name}}, welcome to {{property_name}}, Unit {{unit_number}}. " +
    "Your monthly rent of {{amount}} is due on the 1st of every month. " +
    "Pay via M-Pesa Paybill {{paybill}}, Account: {{account_number}}. " +
    "- {{org_name}}",

  rent_reminder:
    "Dear {{tenant_name}}, this is a reminder that your rent of {{amount}} " +
    "for {{unit_number}} is due on {{due_date}}. " +
    "Pay via M-Pesa Paybill {{paybill}}, Acc: {{account_number}}. - {{org_name}}",

  overdue_notice:
    "URGENT: Dear {{tenant_name}}, your rent payment of {{amount}} " +
    "for {{unit_number}} is OVERDUE (Invoice {{invoice_number}}). " +
    "Please pay immediately via Paybill {{paybill}}, Acc: {{account_number}}. " +
    "Contact us to avoid penalties. - {{org_name}}",

  payment_confirmed:
    "Payment received! Dear {{tenant_name}}, we have received {{amount}} " +
    "via M-Pesa (Ref: {{transaction_id}}). " +
    "Remaining balance: {{balance}}. Thank you! - {{org_name}}",

  invoice_generated:
    "Dear {{tenant_name}}, your rent invoice of {{amount}} " +
    "for {{unit_number}} has been generated. " +
    "Due date: {{due_date}}. " +
    "Pay via Paybill {{paybill}}, Acc: {{account_number}}. - {{org_name}}",

  maintenance_update:
    "Dear {{tenant_name}}, your maintenance request '{{title}}' " +
    "has been updated to: {{status}}. " +
    "{{resolution_notes}} - {{org_name}}",

  lease_expiry:
    "Dear {{tenant_name}}, your lease for {{unit_number}} expires on {{lease_end_date}}. " +
    "Please contact us to discuss renewal. - {{org_name}}",

  paybill_info:
    "Dear {{tenant_name}}, your M-Pesa payment details: " +
    "Paybill: {{paybill}}, Account Number: {{account_number}}. " +
    "Monthly rent: {{amount}} due on the 1st. - {{org_name}}",

  custom: "",
}
