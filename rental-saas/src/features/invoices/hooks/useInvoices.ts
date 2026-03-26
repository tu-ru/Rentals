import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { useToast } from "../../../components/ui/toast"
import { QUERY_KEYS } from "../../../lib/constants"
import * as invoiceService from "../services/invoiceService"
import type { CreateInvoiceInput, InvoiceFilters, InvoiceFormInput, InvoiceStatus } from "../types"

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
  const { profile } = useAuth()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => invoiceService.createInvoice(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      if (profile?.organization_id) {
        void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] })
      }
      toast({ title: "Draft invoice created" })
    },
    onError: (error) => toast({ title: "Failed to create invoice", description: String(error), variant: "destructive" }),
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InvoiceFormInput }) => invoiceService.updateInvoice(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES, variables.id] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] })
      toast({ title: "Invoice updated" })
    },
    onError: (error) => toast({ title: "Failed to update invoice", description: String(error), variant: "destructive" }),
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

export function useInvoiceTenantUnits(tenantId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.INVOICES, "tenant-units", tenantId],
    queryFn: () => invoiceService.getTenantUnitsForInvoice(tenantId as string),
    enabled: Boolean(tenantId),
  })
}

export function useTenantAvailableCredit(tenantId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.INVOICES, "tenant-credit", tenantId],
    queryFn: () => invoiceService.getTenantAvailableCredit(tenantId as string),
    enabled: Boolean(tenantId),
  })
}

export function useMarkInvoiceSent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => invoiceService.markInvoiceSent(id),
    onSuccess: (_data, invoiceId) => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES, invoiceId] })
    },
  })
}

export function useApplyInvoiceCredit() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => invoiceService.applyInvoiceCredit(id),
    onSuccess: (result, invoiceId) => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES, invoiceId] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENTS] })
      toast({
        title: result.applied_amount > 0 ? "Credit applied" : "No credit available",
        description: result.applied_amount > 0
          ? `Applied KES ${result.applied_amount.toLocaleString("en-KE")} to the invoice.`
          : "This tenant has no unapplied credit for this invoice.",
      })
    },
    onError: (error) => toast({ title: "Failed to apply credit", description: String(error), variant: "destructive" }),
  })
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) => invoiceService.updateInvoiceStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] }),
  })
}
