import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { useToast } from "../../../components/ui/toast"
import * as smsService from "../services/smsService"
import type { SendSmsInput } from "../types/sms.types"

const SMS_KEYS = {
  logs: (orgId: string) => ["sms_logs", orgId],
  stats: (orgId: string) => ["sms_stats", orgId],
  templates: (orgId: string) => ["sms_templates", orgId],
} as const

export function useSmsLogs(filters?: Parameters<typeof smsService.getSmsLogs>[1]) {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [...SMS_KEYS.logs(profile?.organization_id ?? ""), filters],
    queryFn: () => smsService.getSmsLogs(profile!.organization_id!, filters),
    enabled: !!profile?.organization_id,
    refetchInterval: 30_000,
  })
}

export function useSmsStats() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: SMS_KEYS.stats(profile?.organization_id ?? ""),
    queryFn: () => smsService.getSmsStats(profile!.organization_id!),
    enabled: !!profile?.organization_id,
  })
}

export function useSmsTemplates() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: SMS_KEYS.templates(profile?.organization_id ?? ""),
    queryFn: () => smsService.getSmsTemplates(profile!.organization_id!),
    enabled: !!profile?.organization_id,
  })
}

export function useSendSms() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: SendSmsInput) =>
      smsService.sendSms(profile!.organization_id!, input),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: SMS_KEYS.logs(profile!.organization_id!) })
      qc.invalidateQueries({ queryKey: SMS_KEYS.stats(profile!.organization_id!) })
      toast({
        title: result.success ? "SMS Sent" : "SMS Failed",
        description: result.success
          ? "Message delivered to Celcom gateway"
          : `Error ${result.response_code}: ${result.response_description}`,
        variant: result.success ? "default" : "destructive",
      })
    },
    onError: (err: Error) => {
      toast({ title: "Failed to send SMS", description: err.message, variant: "destructive" })
    },
  })
}

export function useSendBulkSms() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      tenantIds,
      messageType,
      templateVariables,
    }: {
      tenantIds: string[]
      messageType: string
      templateVariables?: Record<string, string>
    }) => smsService.sendBulkSms(
      profile!.organization_id!,
      tenantIds,
      messageType,
      templateVariables,
    ),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: SMS_KEYS.logs(profile!.organization_id!) })
      toast({
        title: "Bulk SMS Complete",
        description: `${result.sent} sent successfully, ${result.failed} failed`,
      })
    },
  })
}

export function useUpsertSmsTemplate() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: { messageType: string; body: string; name: string }) =>
      smsService.upsertSmsTemplate(
        profile!.organization_id!,
        data.messageType,
        data.body,
        data.name,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SMS_KEYS.templates(profile!.organization_id!) })
      toast({ title: "Template saved" })
    },
  })
}
