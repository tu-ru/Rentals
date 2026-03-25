import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { useToast } from "../../../components/ui/toast"
import { QUERY_KEYS } from "../../../lib/constants"
import * as settingsService from "../services"
import type { OrganizationSettingsInput, ProvisionOrganizationInput } from "../types"

export function useOrganizationSettings() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.SETTINGS, profile?.organization_id],
    queryFn: () => settingsService.getOrganizationSettings(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: OrganizationSettingsInput) =>
      settingsService.updateOrganizationSettings(profile?.organization_id as string, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SETTINGS] })
      toast({ title: "Organization settings updated" })
    },
    onError: (error) => {
      toast({ title: "Failed to update settings", description: String(error), variant: "destructive" })
    },
  })
}

export function useTeamMembers() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.TEAM_MEMBERS, profile?.organization_id],
    queryFn: () => settingsService.listTeamMembers(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useOrganizationProperties() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, "settings-options", profile?.organization_id],
    queryFn: () => settingsService.listOrganizationProperties(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useAgentPropertyAssignments() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.SETTINGS, "agent-assignments", profile?.organization_id],
    queryFn: () => settingsService.listAgentPropertyAssignments(profile?.organization_id as string),
    enabled: Boolean(profile?.organization_id),
  })
}

export function useUpdateTeamMemberStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ memberId, isActive }: { memberId: string; isActive: boolean }) =>
      settingsService.updateTeamMemberStatus(memberId, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TEAM_MEMBERS] })
      toast({ title: "Team member status updated" })
    },
    onError: (error) => {
      toast({ title: "Failed to update team member", description: String(error), variant: "destructive" })
    },
  })
}

export function useReplaceAgentAssignments() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ agentId, propertyIds }: { agentId: string; propertyIds: string[] }) =>
      settingsService.replaceAgentAssignments({
        organizationId: profile?.organization_id as string,
        agentId,
        propertyIds,
        assignedBy: profile?.id ?? null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SETTINGS, "agent-assignments"] })
      toast({ title: "Agent assignments updated" })
    },
    onError: (error) => {
      toast({ title: "Failed to update assignments", description: String(error), variant: "destructive" })
    },
  })
}

export function usePlatformOrganizations() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.SETTINGS, "platform-organizations"],
    queryFn: settingsService.listPlatformOrganizations,
    enabled: profile?.role === "super_admin",
  })
}

export function useInvitations() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.SETTINGS, "platform-invitations"],
    queryFn: settingsService.listInvitations,
    enabled: profile?.role === "super_admin",
  })
}

export function usePlatformUsers() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.SETTINGS, "platform-users"],
    queryFn: settingsService.listPlatformUsers,
    enabled: profile?.role === "super_admin",
  })
}

export function useAuditLogs() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.SETTINGS, "platform-audit-logs"],
    queryFn: settingsService.listAuditLogs,
    enabled: profile?.role === "super_admin",
  })
}

export function useProvisionOrganization() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: ProvisionOrganizationInput) => settingsService.provisionOrganization(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SETTINGS, "platform-organizations"] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SETTINGS, "platform-invitations"] })
      toast({ title: "Organization provisioned" })
    },
    onError: (error) => {
      toast({ title: "Provisioning failed", description: String(error), variant: "destructive" })
    },
  })
}

function invalidatePlatformQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SETTINGS, "platform-organizations"] })
  void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SETTINGS, "platform-invitations"] })
  void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SETTINGS, "platform-users"] })
  void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SETTINGS, "platform-audit-logs"] })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (invitationId: string) => settingsService.revokeInvitation(invitationId),
    onSuccess: () => {
      invalidatePlatformQueries(queryClient)
      toast({ title: "Invitation revoked" })
    },
    onError: (error) => {
      toast({ title: "Failed to revoke invitation", description: String(error), variant: "destructive" })
    },
  })
}

export function useResendInvitation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (invitationId: string) => settingsService.resendInvitation(invitationId),
    onSuccess: () => {
      invalidatePlatformQueries(queryClient)
      toast({ title: "Invitation resent" })
    },
    onError: (error) => {
      toast({ title: "Failed to resend invitation", description: String(error), variant: "destructive" })
    },
  })
}

export function useReassignUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: settingsService.reassignUser,
    onSuccess: () => {
      invalidatePlatformQueries(queryClient)
      toast({ title: "User reassigned" })
    },
    onError: (error) => {
      toast({ title: "Failed to reassign user", description: String(error), variant: "destructive" })
    },
  })
}

export function useSetPlatformUserActiveState() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: settingsService.setUserActiveState,
    onSuccess: () => {
      invalidatePlatformQueries(queryClient)
      toast({ title: "User status updated" })
    },
    onError: (error) => {
      toast({ title: "Failed to update user status", description: String(error), variant: "destructive" })
    },
  })
}

export function useDeleteOrganizationAsSuperAdmin() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: settingsService.deleteOrganizationAsSuperAdmin,
    onSuccess: () => {
      invalidatePlatformQueries(queryClient)
      toast({ title: "Organization deleted" })
    },
    onError: (error) => {
      toast({ title: "Failed to delete organization", description: String(error), variant: "destructive" })
    },
  })
}

export function useArchiveOrganizationAsSuperAdmin() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: settingsService.archiveOrganizationAsSuperAdmin,
    onSuccess: () => {
      invalidatePlatformQueries(queryClient)
      toast({ title: "Organization archived" })
    },
    onError: (error) => {
      toast({ title: "Failed to archive organization", description: String(error), variant: "destructive" })
    },
  })
}

export function useRestoreOrganizationAsSuperAdmin() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: settingsService.restoreOrganizationAsSuperAdmin,
    onSuccess: () => {
      invalidatePlatformQueries(queryClient)
      toast({ title: "Organization restored" })
    },
    onError: (error) => {
      toast({ title: "Failed to restore organization", description: String(error), variant: "destructive" })
    },
  })
}

export function useDeleteUserAsSuperAdmin() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: settingsService.deleteUserAsSuperAdmin,
    onSuccess: () => {
      invalidatePlatformQueries(queryClient)
      toast({ title: "User deleted" })
    },
    onError: (error) => {
      toast({ title: "Failed to delete user", description: String(error), variant: "destructive" })
    },
  })
}
