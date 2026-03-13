import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { useToast } from "../../../components/ui/toast"
import { QUERY_KEYS } from "../../../lib/constants"
import * as settingsService from "../services"
import type { OrganizationSettingsInput } from "../types"

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
