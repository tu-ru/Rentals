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

export async function getProperties(organizationId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Property[]
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

  const { data: units, error: unitsError } = await supabase
    .from("units")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("property_id", id)
    .order("unit_number", { ascending: true })
  if (unitsError) throw unitsError

  return { ...(property as Property), units: (units ?? []) as Unit[] }
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
  const { error } = await supabase.from("properties").delete().eq("organization_id", organizationId).eq("id", id)
  if (error) throw error
}

export async function getUnits(propertyId: string): Promise<Unit[]> {
  const organizationId = await requireOrganizationId()
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .order("unit_number", { ascending: true })
  if (error) throw error
  return (data ?? []) as Unit[]
}

export async function getUnit(id: string): Promise<Unit> {
  const organizationId = await requireOrganizationId()
  const { data, error } = await supabase.from("units").select("*").eq("organization_id", organizationId).eq("id", id).single()
  if (error) throw error
  return data as Unit
}

export async function createUnit(data: CreateUnitInput): Promise<Unit> {
  const { data: created, error } = await supabase
    .from("units")
    .insert(data)
    .select("*")
    .eq("organization_id", data.organization_id)
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
  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select("id")
    .eq("organization_id", organizationId)
  if (propertiesError) throw propertiesError

  const { data: units, error: unitsError } = await supabase
    .from("units")
    .select("status")
    .eq("organization_id", organizationId)
  if (unitsError) throw unitsError

  const totalProperties = properties?.length ?? 0
  const totalUnits = units?.length ?? 0
  const occupiedUnits = units?.filter((u) => u.status === "occupied").length ?? 0
  const vacantUnits = units?.filter((u) => u.status === "vacant").length ?? 0

  return {
    totalProperties,
    totalUnits,
    occupiedUnits,
    vacantUnits,
    occupancyRate: totalUnits > 0 ? Number(((occupiedUnits / totalUnits) * 100).toFixed(1)) : 0,
  }
}
