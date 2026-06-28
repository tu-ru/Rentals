import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { QUERY_KEYS } from "../../../lib/constants"
import * as agentWorkspaceService from "../services"

export function useAgentWorkspace() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: [QUERY_KEYS.AGENT, "workspace", profile?.id],
    queryFn: () => agentWorkspaceService.getAgentWorkspaceData(profile?.id as string),
    enabled: profile?.role === "agent" && Boolean(profile?.id),
  })
}

export function useStartTenantConversation() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tenantId, propertyId }: { tenantId: string; propertyId: string }) =>
      agentWorkspaceService.startTenantConversation(profile?.id as string, tenantId, profile?.organization_id as string, propertyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MESSAGES, "conversations"] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AGENT, "workspace"] })
    },
  })
}
