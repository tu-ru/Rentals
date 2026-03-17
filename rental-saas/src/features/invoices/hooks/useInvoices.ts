import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { useToast } from "../../../components/ui/toast"
import { QUERY_KEYS } from "../../../lib/constants"
import { createNotification } from "../../notifications/services"
import * as invoiceService from "../services/invoiceService"
import type { CreateInvoiceInput, InvoiceFilters, InvoiceStatus } from "../types"

export function useInvoices(filters?: InvoiceFilters) {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.INVOICES, profile?.organization_id, filters],
    queryFn: () => invoiceService.getInvoices(profile?.organization_id as string, filters),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useInvoice(id?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.INVOICES, id],
    queryFn: () => invoiceService.getInvoice(id as string),
    enabled: Boolean(id),
  })
}

export function useOverdueInvoices() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.INVOICES, "overdue", profile?.organization_id],
    queryFn: () => invoiceService.getOverdueInvoices(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  const { profile, organization } = useAuth()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => invoiceService.createInvoice(data),
    onSuccess: async (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      const prefs = (organization?.settings as any)?.notification_preferences ?? {}
      if (prefs.rent_reminder !== false && profile?.organization_id) {
        await createNotification({
          organization_id: profile.organization_id,
          recipient_id: variables.tenant_id,
          type: "rent_reminder",
          title: "New invoice",
          body: "A new invoice has been issued.",
          metadata: { invoice_id: data?.id, target: "/tenant/invoices" },
        })
      }
      toast({ title: "Invoice created" })
    },
    onError: (error) => toast({ title: "Failed to create invoice", description: String(error), variant: "destructive" }),
  })
}

export function useGenerateMonthlyInvoices() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      invoiceService.generateMonthlyInvoices(profile?.organization_id as string, month, year),
    onSuccess: (count) => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      toast({ title: `Generated ${count} invoices` })
    },
  })
}

export function usePreviewMonthlyInvoicesCount() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.INVOICES, "preview-count", profile?.organization_id],
    queryFn: () => invoiceService.previewMonthlyInvoicesCount(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useMarkInvoiceSent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoiceService.markInvoiceSent(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] }),
  })
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) => invoiceService.updateInvoiceStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] }),
  })
}
