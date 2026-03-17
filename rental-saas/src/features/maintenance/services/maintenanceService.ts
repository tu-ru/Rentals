import { supabase } from "../../../lib/supabase/client"
import type {
  CreateMaintenanceInput,
  MaintenanceRequest,
  MaintenanceStats,
  MaintenanceWithRelations,
  UpdateMaintenanceInput,
} from "../types"

interface RequestFilters {
  propertyId?: string
  priority?: MaintenanceRequest["priority"]
  category?: MaintenanceRequest["category"]
  status?: MaintenanceRequest["status"]
}

async function getMyOrgId() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  if (error) throw error
  const user = session?.user
  if (!user) throw new Error("Not authenticated")

  const { data, error: profileError } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single()
  if (profileError) throw profileError
  return data.organization_id as string
}

async function uploadImages(organizationId: string, files: File[] = []): Promise<string[]> {
  const uploadedUrls: string[] = []

  for (const file of files) {
    const filePath = `${organizationId}/${Date.now()}-${crypto.randomUUID()}-${file.name}`
    const { error } = await supabase.storage.from("maintenance-photos").upload(filePath, file, { upsert: false })
    if (error) throw error

    const { data: signedData, error: signedError } = await supabase.storage
      .from("maintenance-photos")
      .createSignedUrl(filePath, 60 * 60 * 24 * 30)
    if (signedError) throw signedError
    uploadedUrls.push(signedData.signedUrl)
  }

  return uploadedUrls
}

export async function getRequests(organizationId: string, filters?: RequestFilters): Promise<MaintenanceRequest[]> {
  let query = supabase
    .from("maintenance_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  if (filters?.priority) query = query.eq("priority", filters.priority)
  if (filters?.category) query = query.eq("category", filters.category)
  if (filters?.status) query = query.eq("status", filters.status)

  if (filters?.propertyId) {
    const { data: units, error: unitsError } = await supabase
      .from("units")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("property_id", filters.propertyId)
    if (unitsError) throw unitsError
    query = query.in("unit_id", (units ?? []).map((u) => u.id))
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as MaintenanceRequest[]
}

export async function getRequest(id: string): Promise<MaintenanceWithRelations> {
  const organizationId = await getMyOrgId()

  const { data, error } = await supabase
    .from("maintenance_requests")
    .select(
      "*, unit:units(id, unit_number, property_id), tenant:profiles!maintenance_requests_tenant_id_fkey(id, full_name, phone), assignedTo:profiles!maintenance_requests_assigned_to_fkey(id, full_name)",
    )
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single()
  if (error) throw error
  return data as MaintenanceWithRelations
}

export async function createRequest(data: CreateMaintenanceInput, imageFiles?: File[]): Promise<MaintenanceRequest> {
  const imageUrls = await uploadImages(data.organization_id, imageFiles ?? [])
  const { data: created, error } = await supabase
    .from("maintenance_requests")
    .insert({ ...data, images: imageUrls })
    .select("*")
    .single()
  if (error) throw error
  return created as MaintenanceRequest
}

export async function updateRequest(id: string, data: UpdateMaintenanceInput): Promise<MaintenanceRequest> {
  const organizationId = await getMyOrgId()
  const { data: updated, error } = await supabase
    .from("maintenance_requests")
    .update(data)
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return updated as MaintenanceRequest
}

export async function assignRequest(id: string, assignedToId: string): Promise<MaintenanceRequest> {
  const organizationId = await getMyOrgId()
  const { data, error } = await supabase
    .from("maintenance_requests")
    .update({ assigned_to: assignedToId, status: "assigned" })
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return data as MaintenanceRequest
}

export async function updateStatus(
  id: string,
  status: MaintenanceRequest["status"],
  resolutionNotes?: string,
): Promise<MaintenanceRequest> {
  const organizationId = await getMyOrgId()
  const payload: Record<string, unknown> = { status }
  if (status === "resolved") {
    if (!resolutionNotes || !resolutionNotes.trim()) {
      throw new Error("Resolution notes are required when resolving a request.")
    }
    payload.resolved_at = new Date().toISOString()
    payload.resolution_notes = resolutionNotes
  }

  const { data, error } = await supabase
    .from("maintenance_requests")
    .update(payload)
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return data as MaintenanceRequest
}

export async function getTenantRequests(tenantId: string): Promise<MaintenanceRequest[]> {
  const organizationId = await getMyOrgId()
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as MaintenanceRequest[]
}

export async function getRequestStats(organizationId: string): Promise<MaintenanceStats> {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select("status, priority")
    .eq("organization_id", organizationId)
  if (error) throw error

  return {
    open: data?.filter((request) => request.status === "open" || request.status === "assigned").length ?? 0,
    inProgress: data?.filter((request) => request.status === "in_progress").length ?? 0,
    resolved: data?.filter((request) => request.status === "resolved" || request.status === "closed").length ?? 0,
    emergency: data?.filter((request) => request.priority === "emergency").length ?? 0,
  }
}

export async function getAssignableStaff(organizationId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("organization_id", organizationId)
    .in("role", ["admin", "landlord", "agent"])
  if (error) throw error
  return data ?? []
}

