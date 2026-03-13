import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { useToast } from "../../../components/ui/toast"
import { QUERY_KEYS } from "../../../lib/constants"
import * as tenantService from "../services/tenantService"
import type { LeaseFormInput, TenantInviteInput } from "../types"

export function useTenants() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.TENANTS, profile?.organization_id],
    queryFn: () => tenantService.getTenants(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useTenant(id?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.TENANTS, id],
    queryFn: () => tenantService.getTenant(id as string),
    enabled: Boolean(id),
  })
}

export function useInviteTenant() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: TenantInviteInput) =>
      tenantService.inviteTenant(input.email, input.full_name, input.phone, input.unit_id, profile?.organization_id as string, input.national_id),
    onSuccess: (_data, variables) => {
      toast({ title: `Invitation sent to ${variables.email}. They will receive a magic link to set up their account` })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] })
    },
    onError: (error) => {
      toast({ title: "Failed to invite tenant", description: String(error), variant: "destructive" })
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tenantService.updateTenant(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] })
      toast({ title: "Tenant updated" })
    },
  })
}

export function useVacantUnits() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.UNITS, "vacant", profile?.organization_id],
    queryFn: () => tenantService.getVacantUnits(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useCreateLease() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (data: LeaseFormInput) => tenantService.createLease(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEASES] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.UNITS] })
      toast({ title: "Lease created" })
    },
  })
}

export function useLeases() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.LEASES, profile?.organization_id],
    queryFn: () => tenantService.getLeases(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useTerminateLease() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => tenantService.terminateLease(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEASES] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.UNITS] })
    },
  })
}

export function useRenewLease() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, endDate, rent }: { id: string; endDate: string; rent: number }) => tenantService.renewLease(id, endDate, rent),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEASES] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TENANTS] })
    },
  })
}
