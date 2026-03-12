import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { QUERY_KEYS } from "../../../lib/constants"
import { useToast } from "../../../components/ui/toast"
import * as maintenanceService from "../services"
import type { CreateMaintenanceInput, MaintenanceRequest, UpdateMaintenanceInput } from "../types"

export function useMaintenanceRequests(filters?: {
  propertyId?: string
  priority?: MaintenanceRequest["priority"]
  category?: MaintenanceRequest["category"]
  status?: MaintenanceRequest["status"]
}) {
  const { profile } = useAuth()
  const organizationId = profile?.organization_id

  return useQuery({
    queryKey: [QUERY_KEYS.MAINTENANCE, organizationId, filters],
    queryFn: () => maintenanceService.getRequests(organizationId as string, filters),
    enabled: Boolean(organizationId),
  })
}

export function useMaintenanceRequest(id?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.MAINTENANCE, id],
    queryFn: () => maintenanceService.getRequest(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ data, images }: { data: CreateMaintenanceInput; images?: File[] }) =>
      maintenanceService.createRequest(data, images),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAINTENANCE] })
      toast({ title: "Maintenance request submitted" })
    },
    onError: (error) => toast({ title: "Failed to submit request", description: String(error), variant: "destructive" }),
  })
}

export function useUpdateMaintenanceRequest() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaintenanceInput }) => maintenanceService.updateRequest(id, data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAINTENANCE] }),
    onError: (error) => toast({ title: "Failed to update request", description: String(error), variant: "destructive" }),
  })
}

export function useAssignMaintenanceRequest() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string }) => maintenanceService.assignRequest(id, assignedToId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAINTENANCE] }),
    onError: (error) => toast({ title: "Failed to assign request", description: String(error), variant: "destructive" }),
  })
}

export function useUpdateMaintenanceStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, status, resolutionNotes }: { id: string; status: MaintenanceRequest["status"]; resolutionNotes?: string }) =>
      maintenanceService.updateStatus(id, status, resolutionNotes),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAINTENANCE] }),
    onError: (error) => toast({ title: "Failed to update status", description: String(error), variant: "destructive" }),
  })
}

export function useTenantMaintenanceRequests() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.MAINTENANCE, "tenant", profile?.id],
    queryFn: () => maintenanceService.getTenantRequests(profile?.id as string),
    enabled: Boolean(profile?.id),
  })
}

export function useMaintenanceStats() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.MAINTENANCE, "stats", profile?.organization_id],
    queryFn: () => maintenanceService.getRequestStats(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useAssignableStaff() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.MAINTENANCE, "staff", profile?.organization_id],
    queryFn: () => maintenanceService.getAssignableStaff(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}
