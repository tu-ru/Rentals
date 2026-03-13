import { supabase } from "../../../lib/supabase/client"
import type {
  CreatePropertyInput,
  CreateUnitInput,
  Property,
  PropertyStats,
  PropertyWithUnits,
  Unit,
  UpdatePropertyInput,
  UpdateUnitInput,
} from "../types/property.types"

async function requireOrganizationId(): Promise<string> {
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession()
  if (authError) throw authError
  const user = session?.user
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single()
  if (error) throw error
  if (!data.organization_id) throw new Error("User has no organization")
  return data.organization_id
}

function mapPropertyWithOccupancy(property: Property, units: Array<{ status: Unit["status"]; rent_amount?: number | null }>) {
  const totalUnits = Math.max(property.total_units, units.length)
  const occupiedUnits = units.filter((unit) => unit.status === "occupied").length
  const estimatedMonthlyRevenue = units
    .filter((unit) => unit.status === "occupied")
    .reduce((total, unit) => total + Number(unit.rent_amount ?? 0), 0)

  return {
    ...property,
    total_units: totalUnits,
    occupied_units: occupiedUnits,
    estimated_monthly_revenue: estimatedMonthlyRevenue,
  }
}

export async function uploadPropertyImages(organizationId: string, files: File[]): Promise<string[]> {
  const urls: string[] = []

  for (const file of files) {
    const filePath = `${organizationId}/${Date.now()}-${crypto.randomUUID()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from("property-images").upload(filePath, file, { upsert: false })
    if (uploadError) throw uploadError

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("property-images")
      .createSignedUrl(filePath, 60 * 60 * 24 * 30)
    if (signedUrlError) throw signedUrlError

    urls.push(signedUrlData.signedUrl)
  }

  return urls
}


export async function uploadUnitImages(organizationId: string, files: File[]): Promise<string[]> {
  return uploadPropertyImages(organizationId, files)
}

export async function getProperties(organizationId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*, units(status, rent_amount)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
  if (error) throw error

  return (data ?? []).map((row) => mapPropertyWithOccupancy(row as Property, (row.units ?? []) as Array<{ status: Unit["status"]; rent_amount?: number | null }>))
}

export async function getProperty(id: string): Promise<PropertyWithUnits> {
  const organizationId = await requireOrganizationId()
  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single()
  if (error) throw error

  const units = await getUnits(id)

  return {
    ...mapPropertyWithOccupancy(property as Property, units),
    units,
  }
}

export async function createProperty(data: CreatePropertyInput, organizationId: string): Promise<Property> {
  const { data: created, error } = await supabase
    .from("properties")
    .insert({ ...data, organization_id: organizationId })
    .select("*")
    .single()
  if (error) throw error
  return created as Property
}

export async function updateProperty(id: string, data: UpdatePropertyInput): Promise<Property> {
  const organizationId = await requireOrganizationId()
  const { data: updated, error } = await supabase
    .from("properties")
    .update(data)
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return updated as Property
}

export async function deleteProperty(id: string): Promise<void> {
  const organizationId = await requireOrganizationId()

  const { data: units, error: unitsError } = await supabase
    .from("units")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("property_id", id)
  if (unitsError) throw unitsError

  if ((units ?? []).length > 0) {
    const unitIds = (units ?? []).map((unit) => unit.id)
    const { data: leases, error: leasesError } = await supabase
      .from("leases")
      .select("id")
      .in("unit_id", unitIds)
      .eq("status", "active")
      .limit(1)

    if (leasesError) throw leasesError
    if ((leases ?? []).length > 0) {
      throw new Error("Cannot delete property with active leases")
    }
  }

  const { error } = await supabase.from("properties").delete().eq("organization_id", organizationId).eq("id", id)
  if (error) throw error
}

export async function getUnits(propertyId: string): Promise<Unit[]> {
  const organizationId = await requireOrganizationId()

  const { data: units, error } = await supabase
    .from("units")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .order("unit_number", { ascending: true })
  if (error) throw error

  const unitRows = (units ?? []) as Unit[]
  if (unitRows.length === 0) return []

  const unitIds = unitRows.map((unit) => unit.id)
  const { data: activeLeases, error: leasesError } = await supabase
    .from("leases")
    .select("unit_id, tenant_id")
    .in("unit_id", unitIds)
    .eq("status", "active")

  if (leasesError) throw leasesError

  const tenantIds = Array.from(new Set((activeLeases ?? []).map((lease) => lease.tenant_id).filter(Boolean)))
  let tenantNameById = new Map<string, string>()

  if (tenantIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", tenantIds)

    if (profileError) throw profileError
    tenantNameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name ?? "Unknown Tenant"]))
  }

  const leaseByUnitId = new Map((activeLeases ?? []).map((lease) => [lease.unit_id, lease.tenant_id]))

  return unitRows.map((unit) => {
    const tenantId = leaseByUnitId.get(unit.id) ?? null
    return {
      ...unit,
      tenant_id: tenantId,
      tenant_name: tenantId ? (tenantNameById.get(tenantId) ?? "Unknown Tenant") : null,
    }
  })
}

export async function getUnit(id: string): Promise<Unit> {
  const organizationId = await requireOrganizationId()
  const { data, error } = await supabase.from("units").select("*").eq("organization_id", organizationId).eq("id", id).single()
  if (error) throw error
  return data as Unit
}

export async function createUnit(data: CreateUnitInput): Promise<Unit> {
  const organizationId = await requireOrganizationId()
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("organization_id")
    .eq("id", data.property_id)
    .eq("organization_id", organizationId)
    .single()
  if (propertyError) throw propertyError

  const { data: created, error } = await supabase
    .from("units")
    .insert({ ...data, organization_id: property.organization_id })
    .select("*")
    .single()
  if (error) throw error
  return created as Unit
}

export async function updateUnit(id: string, data: UpdateUnitInput): Promise<Unit> {
  const organizationId = await requireOrganizationId()
  const { data: updated, error } = await supabase
    .from("units")
    .update(data)
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return updated as Unit
}

export async function updateUnitStatus(id: string, status: Unit["status"]): Promise<Unit> {
  const organizationId = await requireOrganizationId()
  const { data: updated, error } = await supabase
    .from("units")
    .update({ status })
    .eq("organization_id", organizationId)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return updated as Unit
}

export async function getPropertyStats(organizationId: string): Promise<PropertyStats> {
  const { data, error } = await supabase
    .from("properties")
    .select("id, units(status)")
    .eq("organization_id", organizationId)
  if (error) throw error

  const totalProperties = data?.length ?? 0
  const statuses = (data ?? []).flatMap((property) => (property.units ?? []).map((unit) => unit.status as Unit["status"]))
  const totalUnits = statuses.length
  const occupiedUnits = statuses.filter((status) => status === "occupied").length
  const vacantUnits = statuses.filter((status) => status === "vacant").length

  return {
    totalProperties,
    totalUnits,
    occupiedUnits,
    vacantUnits,
    occupancyRate: totalUnits > 0 ? Number(((occupiedUnits / totalUnits) * 100).toFixed(1)) : 0,
  }
}
