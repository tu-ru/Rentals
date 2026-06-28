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
    mutationFn: (data: RecordManualPaymentInput) => paymentService.recordManualPayment(data),
    onSuccess: async (result, variables) => {
      if (variables.send_sms) {
        const invoice = await paymentService.getInvoiceForPaymentNotice(variables.invoice_id)
        if (invoice?.tenant_id && profile?.organization_id) {
          const prefs = (organization?.settings as any)?.notification_preferences ?? {}
          const smsPrefs = (organization?.settings as any)?.sms_automation ?? {}
          if (prefs.payment_confirmed !== false) {
            await createNotification({
              organization_id: profile.organization_id,
              recipient_id: invoice.tenant_id,
              type: "payment_confirmed",
              title: "Payment received",
              body: `We received your payment of KES ${Number(variables.amount).toLocaleString("en-KE")}.`,
              metadata: {
                invoice_id: variables.invoice_id,
                amount: variables.amount,
                source: "manual_payment_sms",
                target: "/tenant/payments",
                allocated_amount: result.allocated_amount,
                credit_amount: result.credit_amount,
              },
            })
          }
          if (smsPrefs.payment_confirmed !== false) {
            try {
              await smsService.sendSms(profile.organization_id, {
                tenant_id: invoice.tenant_id,
                message_type: "payment_confirmed",
                template_variables: {
                  amount: `KES ${Number(variables.amount).toLocaleString("en-KE")}`,
                  transaction_id: variables.mpesa_transaction_id ?? "Manual",
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
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENTS] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] })
      toast({
        title: "Payment recorded",
        description:
          result.credit_amount > 0
            ? `Allocated KES ${result.allocated_amount.toLocaleString("en-KE")} and created KES ${result.credit_amount.toLocaleString("en-KE")} tenant credit.`
            : variables.send_sms
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
