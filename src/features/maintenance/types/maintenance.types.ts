import { z } from "zod"

export const maintenanceCategoryValues = [
  "plumbing",
  "electrical",
  "structural",
  "appliance",
  "security",
  "cleaning",
  "other",
] as const

export const maintenanceStatusValues = ["open", "assigned", "in_progress", "resolved", "closed"] as const
export const maintenancePriorityValues = ["low", "medium", "high", "emergency"] as const

export const maintenanceRequestSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  unit_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  assigned_to: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  description: z.string().min(20),
  category: z.enum(maintenanceCategoryValues),
  priority: z.enum(maintenancePriorityValues).default("medium"),
  status: z.enum(maintenanceStatusValues).default("open"),
  images: z.array(z.string()).default([]),
  resolution_notes: z.string().nullable().optional(),
  resolved_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const createMaintenanceSchema = z.object({
  organization_id: z.string().uuid(),
  unit_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().min(20, "Please provide at least 20 characters."),
  category: z.enum(maintenanceCategoryValues),
  priority: z.enum(maintenancePriorityValues).default("medium"),
})

export const updateMaintenanceSchema = z.object({
  assigned_to: z.string().uuid().nullable().optional(),
  title: z.string().min(3).optional(),
  description: z.string().min(20).optional(),
  category: z.enum(maintenanceCategoryValues).optional(),
  priority: z.enum(maintenancePriorityValues).optional(),
  status: z.enum(maintenanceStatusValues).optional(),
  resolution_notes: z.string().optional(),
})

export type MaintenanceCategory = typeof maintenanceCategoryValues[number]
export type MaintenanceRequest = z.infer<typeof maintenanceRequestSchema>
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>
export interface MaintenanceWorkflowInput {
  assignedToId?: string | null
  status?: MaintenanceRequest["status"]
  resolutionNotes?: string
}

export interface MaintenanceWithRelations extends MaintenanceRequest {
  unit: { id: string; unit_number: string; property_id: string } | null
  tenant: { id: string; full_name: string | null; phone: string | null } | null
  assignedTo: { id: string; full_name: string | null } | null
}

export interface MaintenanceStats {
  open: number
  inProgress: number
  resolved: number
  emergency: number
}
