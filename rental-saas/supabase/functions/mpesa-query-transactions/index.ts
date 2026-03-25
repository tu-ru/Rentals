import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  getMpesaCredentials,
  mpesaPost,
  normalizeMpesaAmount,
  normalizeMpesaTransactionId,
  normalizeOrganizationName,
  normalizePhone,
  normalizeReference,
  normalizeTransactionDate,
  normalizeTransactionList,
  type MpesaOrganizationConfig,
} from "../_shared/mpesa.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface QueryTransactionsInput {
  organization_id: string
  start_date: string
  end_date: string
}

function toIsoOrThrow(value: string, label: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid ${label}.`)
  return parsed.toISOString()
}

function truncateToDateTimeString(value: string) {
  return value.replace("T", " ").slice(0, 19)
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "")

  try {
    const authHeader = req.headers.get("Authorization") ?? ""
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
    }

    const input = (await req.json()) as QueryTransactionsInput
    if (!input.organization_id || !input.start_date || !input.end_date) {
      return new Response(
        JSON.stringify({ error: "organization_id, start_date, and end_date are required." }),
        { status: 400, headers: corsHeaders },
      )
    }

    const startIso = toIsoOrThrow(input.start_date, "start_date")
    const endIso = toIsoOrThrow(input.end_date, "end_date")
    const hours = Math.abs(new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60 * 60)
    if (hours > 48) {
      return new Response(JSON.stringify({ error: "Query window must be 48 hours or less." }), { status: 400, headers: corsHeaders })
    }

    const { data: callerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single()

    if (profileError || !callerProfile) {
      return new Response(JSON.stringify({ error: "Profile not found." }), { status: 403, headers: corsHeaders })
    }

    const canQueryMpesa =
      callerProfile.role === "super_admin" ||
      ((callerProfile.role === "admin" || callerProfile.role === "landlord") && callerProfile.organization_id === input.organization_id)

    if (!canQueryMpesa) {
      return new Response(JSON.stringify({ error: "You do not have permission to query this organization." }), { status: 403, headers: corsHeaders })
    }

    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .select("id, name, mpesa_shortcode, mpesa_nominated_number, mpesa_env, settings")
      .eq("id", input.organization_id)
      .single()

    if (organizationError || !organization) {
      return new Response(JSON.stringify({ error: "Organization not found." }), { status: 404, headers: corsHeaders })
    }

    const config = organization as MpesaOrganizationConfig
    const credentials = getMpesaCredentials(config)
    const transactions: Record<string, unknown>[] = []
    let offset = 0
    let keepPaging = true
    let lastResponse: Record<string, unknown> = {}

    while (keepPaging) {
      const response = await mpesaPost<Record<string, unknown>>(config, "/pulltransactions/v1/query", {
        ShortCode: credentials.shortcode,
        StartDate: truncateToDateTimeString(startIso),
        EndDate: truncateToDateTimeString(endIso),
        Offset: offset,
      })

      lastResponse = response
      const page = normalizeTransactionList(response)
      transactions.push(...page)

      const nextOffsetCandidate = Number(response.NextOffset ?? response.nextOffset ?? response.offset)
      if (page.length === 0 || !Number.isFinite(nextOffsetCandidate) || nextOffsetCandidate <= offset) {
        keepPaging = false
      } else {
        offset = nextOffsetCandidate
      }
    }

    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("id, invoice_number, tenant_id, lease_id, unit_id, amount_due, amount_paid, balance, status")
      .eq("organization_id", organization.id)
      .in("status", ["draft", "sent", "overdue"])

    if (invoicesError) throw invoicesError

    const invoiceByNumber = new Map((invoices ?? []).map((invoice) => [invoice.invoice_number, invoice]))

    let newPayments = 0
    let invoicesUpdated = 0
    let duplicatesSkipped = 0

    for (const transaction of transactions) {
      const transactionId = normalizeMpesaTransactionId(transaction)
      if (!transactionId) continue

      const { data: existingPayment, error: duplicateError } = await supabase
        .from("payments")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("mpesa_transaction_id", transactionId)
        .maybeSingle()

      if (duplicateError) throw duplicateError
      if (existingPayment?.id) {
        duplicatesSkipped += 1
        continue
      }

      const reference = normalizeReference(transaction)
      const matchingInvoice = reference ? invoiceByNumber.get(reference) : null
      const amount = normalizeMpesaAmount(transaction)
      const existingAmountPaid = Number(matchingInvoice?.amount_paid ?? 0)
      const nextAmountPaid = existingAmountPaid + amount
      const amountDue = Number(matchingInvoice?.amount_due ?? 0)
      const nextStatus = nextAmountPaid >= amountDue ? "paid" : "sent"

      const { error: paymentInsertError } = await supabase.from("payments").insert({
        organization_id: organization.id,
        invoice_id: matchingInvoice?.id ?? null,
        lease_id: matchingInvoice?.lease_id ?? null,
        tenant_id: matchingInvoice?.tenant_id ?? null,
        amount,
        payment_method: "mpesa",
        status: "reconciled",
        mpesa_transaction_id: transactionId,
        mpesa_phone: normalizePhone(transaction),
        mpesa_reference: reference,
        mpesa_organization_name: normalizeOrganizationName(transaction),
        mpesa_trx_date: normalizeTransactionDate(transaction),
        recorded_by: user.id,
        reconciled_at: new Date().toISOString(),
        notes: "Imported from M-Pesa Pull Transactions API",
      })

      if (paymentInsertError) throw paymentInsertError
      newPayments += 1

      if (matchingInvoice?.id) {
        const { error: invoiceUpdateError } = await supabase
          .from("invoices")
          .update({ amount_paid: nextAmountPaid, status: nextStatus })
          .eq("id", matchingInvoice.id)

        if (invoiceUpdateError) throw invoiceUpdateError
        invoicesUpdated += 1
      }
    }

    const { error: pullLogError } = await supabase.from("mpesa_pull_logs").insert({
      organization_id: organization.id,
      query_start_date: startIso,
      query_end_date: endIso,
      offset_value: offset,
      response_ref_id:
        (typeof lastResponse.ConversationID === "string" && lastResponse.ConversationID) ||
        (typeof lastResponse.ReferenceId === "string" && lastResponse.ReferenceId) ||
        null,
      response_code:
        (typeof lastResponse.ResponseCode === "string" && lastResponse.ResponseCode) ||
        (typeof lastResponse.responseCode === "string" && lastResponse.responseCode) ||
        null,
      transactions_count: transactions.length,
      raw_response: lastResponse,
    })

    if (pullLogError) throw pullLogError

    return new Response(
      JSON.stringify({
        success: true,
        totalFetched: transactions.length,
        newPayments,
        invoicesUpdated,
        duplicatesSkipped,
        lastSyncedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
