import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { QUERY_KEYS } from "../../../lib/constants"
import * as reportService from "../services"

export function useRentCollection(months = 12, dateFrom?: string, dateTo?: string) {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS, "rent-collection", profile?.organization_id, months, dateFrom, dateTo],
    queryFn: () => reportService.getRentCollectionByMonth(profile?.organization_id as string, months, dateFrom, dateTo),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useOccupancy(months = 6, dateFrom?: string, dateTo?: string) {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS, "occupancy", profile?.organization_id, months, dateFrom, dateTo],
    queryFn: () => reportService.getOccupancyOverTime(profile?.organization_id as string, months, dateFrom, dateTo),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useRevenueExpenses(months = 6, dateFrom?: string, dateTo?: string) {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS, "revenue-expenses", profile?.organization_id, months, dateFrom, dateTo],
    queryFn: () => reportService.getRevenueVsExpenses(profile?.organization_id as string, months, dateFrom, dateTo),
    enabled: Boolean(profile?.organization_id),
  })
}

export function usePropertyBreakdown(dateFrom?: string, dateTo?: string) {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS, "property-breakdown", profile?.organization_id, dateFrom, dateTo],
    queryFn: () => reportService.getPropertyBreakdown(profile?.organization_id as string, dateFrom, dateTo),
    enabled: Boolean(profile?.organization_id),
  })
}

export function usePaymentMethodBreakdown(dateFrom?: string, dateTo?: string) {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS, "payment-method", profile?.organization_id, dateFrom, dateTo],
    queryFn: () => reportService.getPaymentMethodBreakdown(profile?.organization_id as string, dateFrom, dateTo),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useArrearsReport(dateFrom?: string, dateTo?: string) {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS, "arrears", profile?.organization_id, dateFrom, dateTo],
    queryFn: () => reportService.getArrearsReport(profile?.organization_id as string, dateFrom, dateTo),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useDashboardKPIs() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS, "kpis", profile?.organization_id],
    queryFn: () => reportService.getDashboardKPIs(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useRecentPayments() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS, "recent-payments", profile?.organization_id],
    queryFn: () => reportService.getRecentPayments(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useExpiringLeases() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS, "expiring-leases", profile?.organization_id],
    queryFn: () => reportService.getExpiringLeases(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function usePendingMaintenance() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS, "pending-maintenance", profile?.organization_id],
    queryFn: () => reportService.getPendingMaintenance(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function usePaymentsExport(dateFrom?: string, dateTo?: string) {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.REPORTS, "payments-export", profile?.organization_id, dateFrom, dateTo],
    queryFn: () => reportService.getPaymentsExport(profile?.organization_id as string, dateFrom, dateTo),
    enabled: Boolean(profile?.organization_id),
  })
}
