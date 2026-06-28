import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../app/providers"
import { useToast } from "../../components/ui/toast"
import { QUERY_KEYS } from "../constants"
import { supabase } from "../supabase/client"

function getFunctionsBaseUrl() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL")
  return `${supabaseUrl}/functions/v1`
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const token = data.session?.access_token
  if (!token) throw new Error("Not authenticated")
  return token
}

export function useMpesaRegisterPull() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ organization_id }: { organization_id: string }) => {
      const token = await getAccessToken()
      const response = await fetch(`${getFunctionsBaseUrl()}/mpesa-register-pull`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ organization_id }),
      })
      if (!response.ok) throw new Error(await response.text())
      return (await response.json()) as { description?: string }
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SETTINGS] })
      toast({ title: "M-Pesa Pull API registered", description: result.description ?? "Registration successful" })
    },
    onError: (error) => toast({ title: "Registration failed", description: String(error), variant: "destructive" }),
  })
}

export function useMpesaQueryTransactions() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (payload: { organization_id: string; start_date: string; end_date: string }) => {
      const token = await getAccessToken()
      const response = await fetch(`${getFunctionsBaseUrl()}/mpesa-query-transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(await response.text())
      return (await response.json()) as {
        synced?: number
        matched?: number
        totalFetched?: number
        newPayments?: number
        invoicesUpdated?: number
        duplicatesSkipped?: number
        lastSyncedAt?: string
      }
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PAYMENTS] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] })

      toast({
        title: `Synced ${result.newPayments ?? result.synced ?? 0} new payments, matched ${result.invoicesUpdated ?? result.matched ?? 0} invoices`,
      })

      if ((result.invoicesUpdated ?? result.matched ?? 0) > 0 && profile?.organization_id) {
        toast({ title: "Payment confirmation SMS queued for matched invoices" })
      }
    },
    onError: (error) => toast({ title: "Transaction sync failed", description: String(error), variant: "destructive" }),
  })
}
