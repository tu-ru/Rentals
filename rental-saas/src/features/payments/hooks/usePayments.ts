import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { useToast } from "../../../components/ui/toast"
import { QUERY_KEYS } from "../../../lib/constants"
import { createNotification } from "../../notifications/services"
import * as smsService from "../../sms/services"
import * as paymentService from "../services/paymentService"
import type { PaymentFilters, RecordManualPaymentInput } from "../types"

export function usePayments(filters?: PaymentFilters) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.PAYMENTS, profile?.organization_id, filters],
    queryFn: () => paymentService.getPayments(profile?.organization_id as string, filters),
    enabled: Boolean(profile?.organization_id),
  })
}

export function usePayment(id?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PAYMENTS, id],
    queryFn: () => paymentService.getPayment(id as string),
    enabled: Boolean(id),
  })
}

export function useOpenInvoices() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.INVOICES, "open", profile?.organization_id],
    queryFn: () => paymentService.getOpenInvoices(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useRecordManualPayment() {
  const queryClient = useQueryClient()
  const { profile, organization } = useAuth()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: RecordManualPaymentInput) => {
      await paymentService.recordManualPayment(data)
      if (data.send_sms) {
        const invoice = await paymentService.getInvoiceForPaymentNotice(data.invoice_id)
        if (invoice?.tenant_id && profile?.organization_id) {
          const prefs = (organization?.settings as any)?.notification_preferences ?? {}
          const smsPrefs = (organization?.settings as any)?.sms_automation ?? {}
          if (prefs.payment_confirmed !== false) {
            await createNotification({
              organization_id: profile.organization_id,
              recipient_id: invoice.tenant_id,
              type: "payment_confirmed",
              title: "Payment received",
              body: `We received your payment of KES ${Number(data.amount).toLocaleString("en-KE")}.`,
              metadata: {
                invoice_id: data.invoice_id,
                amount: data.amount,
                source: "manual_payment_sms",
                target: "/tenant/payments",
              },
            })
          }
          if (smsPrefs.payment_confirmed !== false) {
            try {
              await smsService.sendSms(profile.organization_id, {
                tenant_id: invoice.tenant_id,
                message_type: "payment_confirmed",
                template_variables: {
                  amount: `KES ${Number(data.amount).toLocaleString("en-KE")}`,
                  transaction_id: data.mpesa_transaction_id ?? "Manual",
                  balance: `KES ${Number(invoice.balance ?? 0).toLocaleString("en-KE")}`,
                  invoice_number: invoice.invoice_number ?? "",
                },
              })
            } catch {
              // Do not block payment flow if SMS fails
            }
          }
        }
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENTS] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] })
      toast({
        title: "Payment recorded",
        description: variables.send_sms
          ? "Payment saved and confirmation SMS queued."
          : "Payment saved successfully.",
      })
    },
    onError: (error) => {
      toast({ title: "Failed to record payment", description: String(error), variant: "destructive" })
    },
  })
}

export function usePaymentStats(month?: number, year?: number) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.PAYMENTS, "stats", profile?.organization_id, month, year],
    queryFn: () => paymentService.getPaymentStats(profile?.organization_id as string, month, year),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useRecentPayments(limit = 10) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.PAYMENTS, "recent", profile?.organization_id, limit],
    queryFn: () => paymentService.getRecentPayments(profile?.organization_id as string, limit),
    enabled: Boolean(profile?.organization_id),
  })
}
