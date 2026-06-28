import { z } from "zod"

export const propertyTypeValues = ["apartment", "house", "commercial", "bedsitter", "single_room", "studio"] as const
export const unitStatusValues = ["vacant", "occupied", "maintenance", "reserved"] as const

export const propertySchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  name: z.string().min(1),
  property_type: z.enum(propertyTypeValues),
  address: z.string().min(1),
  city: z.string().min(1).default("Nairobi"),
  county: z.string().min(1).default("Nairobi"),
  total_units: z.number().int().min(0),
  occupied_units: z.number().int().min(0),
  description: z.string().nullable().optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  estimated_monthly_revenue: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const unitSchema = z.object({
  id: z.string().uuid(),
  property_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  unit_number: z.string().min(1),
  floor_number: z.number().int().nullable().optional(),
  unit_type: z.string().nullable().optional(),
  status: z.enum(unitStatusValues).default("vacant"),
  rent_amount: z.number().min(0),
  deposit_amount: z.number().min(0),
  size_sqft: z.number().min(0).nullable().optional(),
  features: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  tenant_name: z.string().nullable().optional(),
  tenant_id: z.string().uuid().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const createPropertySchema = z.object({
  name: z.string().min(1),
  property_type: z.enum(propertyTypeValues),
  address: z.string().min(1),
  city: z.string().min(1).default("Nairobi"),
  county: z.string().min(1).default("Nairobi"),
  total_units: z.number().int().min(0).optional().default(0),
  occupied_units: z.number().int().min(0).optional().default(0),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  is_active: z.boolean().optional().default(true),
}).refine((data) => (data.occupied_units ?? 0) <= (data.total_units ?? 0), {
  message: "Occupied units cannot exceed total units",
  path: ["occupied_units"],
})

export const createUnitSchema = z.object({
  property_id: z.string().uuid(),
  unit_number: z.string().min(1),
  floor_number: z.number().int().nullable().optional(),
  unit_type: z.string().optional(),
  status: z.enum(unitStatusValues).optional().default("vacant"),
  rent_amount: z.number().min(0),
  deposit_amount: z.number().min(0),
  size_sqft: z.number().min(0).nullable().optional(),
  features: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
})

export type Property = z.infer<typeof propertySchema>
export type Unit = z.infer<typeof unitSchema>
export type CreatePropertyInput = z.infer<typeof createPropertySchema>
export type UpdatePropertyInput = Partial<CreatePropertyInput>
export type CreateUnitInput = z.infer<typeof createUnitSchema>
export type UpdateUnitInput = Partial<Omit<CreateUnitInput, "property_id">>

export interface PropertyWithUnits extends Property {
  units: Unit[]
}

export interface PropertyStats {
  totalProperties: number
  totalUnits: number
  occupiedUnits: number
  vacantUnits: number
  occupancyRate: number
}
