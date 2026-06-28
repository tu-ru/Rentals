import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { QUERY_KEYS } from "../../../lib/constants"
import { useToast } from "../../../components/ui/toast"
import { createNotification } from "../../notifications/services"
import * as smsService from "../../sms/services"
import * as maintenanceService from "../services"
import type { CreateMaintenanceInput, MaintenanceRequest, MaintenanceWorkflowInput, UpdateMaintenanceInput } from "../types"

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
  const workflowMutation = useUpdateMaintenanceWorkflow()

  return useMutation({
    mutationFn: ({
      id,
      assignedToId,
      tenantId,
      organizationId,
      title,
    }: {
      id: string
      assignedToId: string
      tenantId?: string
      organizationId?: string
      title?: string
    }) =>
      workflowMutation.mutateAsync({
        id,
        assignedToId,
        tenantId,
        organizationId,
        title,
      }),
  })
}

export function useUpdateMaintenanceWorkflow() {
  const queryClient = useQueryClient()
  const { organization } = useAuth()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      assignedToId,
      status,
      resolutionNotes,
      tenantId,
      organizationId,
      title,
      previousStatus,
      previousAssignedTo,
    }: {
      id: string
      assignedToId?: string | null
      status?: MaintenanceRequest["status"]
      resolutionNotes?: string
      tenantId?: string
      organizationId?: string
      title?: string
      previousStatus?: MaintenanceRequest["status"]
      previousAssignedTo?: string | null
    }) => {
      const updated = await maintenanceService.updateWorkflow(id, { assignedToId, status, resolutionNotes })
      const prefs = (organization?.settings as any)?.notification_preferences ?? {}
      const smsPrefs = (organization?.settings as any)?.sms_automation ?? {}
      const assignmentChanged = typeof assignedToId !== "undefined" && (previousAssignedTo ?? null) !== (updated.assigned_to ?? null)
      const statusChanged = typeof status !== "undefined" && previousStatus !== updated.status
      const statusLabel = updated.status.replace(/_/g, " ")
      const body =
        assignmentChanged && updated.status === "assigned" && !statusChanged
          ? `${title ?? "Your request"} has been assigned to a staff member.`
          : `${title ?? "Your request"} is now ${statusLabel}.`

      if (tenantId && organizationId && prefs.maintenance_update !== false) {
        await createNotification({
          organization_id: organizationId,
          recipient_id: tenantId,
          type: "maintenance_update",
          title: assignmentChanged && updated.status === "assigned" && !statusChanged ? "Maintenance assigned" : "Maintenance update",
          body,
          metadata: { request_id: id, status: updated.status, source: "maintenance_status_sms", target: "/tenant/maintenance" },
        })
      }
      if (tenantId && organizationId && smsPrefs.maintenance_update !== false) {
        try {
          await smsService.sendSms(organizationId, {
            tenant_id: tenantId,
            message_type: "maintenance_update",
            related_maintenance_id: id,
            template_variables: {
              title: title ?? "Maintenance request",
              status: statusLabel,
              resolution_notes: updated.resolution_notes ?? "",
            },
          })
        } catch {
          // Do not block workflow update flow if SMS fails
        }
      }
      return updated
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MAINTENANCE] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AGENT, "workspace"] })
    },
    onError: (error) => toast({ title: "Failed to update workflow", description: String(error), variant: "destructive" }),
  })
}

export function useUpdateMaintenanceStatus() {
  const workflowMutation = useUpdateMaintenanceWorkflow()

  return useMutation({
    mutationFn: async ({
      id,
      status,
      resolutionNotes,
      tenantId,
      organizationId,
      title,
      previousStatus,
    }: {
      id: string
      status: MaintenanceRequest["status"]
      resolutionNotes?: string
      tenantId?: string
      organizationId?: string
      title?: string
      previousStatus?: MaintenanceRequest["status"]
    }) => {
      return workflowMutation.mutateAsync({
        id,
        status,
        resolutionNotes,
        tenantId,
        organizationId,
        title,
        previousStatus,
      })
    },
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
