import { z } from "zod"
import { kenyanPhone } from "../../../lib/utils/validators"

export const leaseStatusValues = ["pending", "active", "expired", "terminated"] as const
export type LeaseStatus = (typeof leaseStatusValues)[number]
export const leaseCreateStatusValues: LeaseStatus[] = ["pending", "active"]

export const tenantInviteSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: kenyanPhone,
  national_id: z.string().optional(),
  unit_id: z.string().uuid().optional(),
})

export const tenantUpdateSchema = z.object({
  full_name: z.string().min(2),
  phone: kenyanPhone,
  national_id: z.string().optional(),
})

export const leaseSchema = z.object({
  tenant_id: z.string().uuid(),
  unit_id: z.string().uuid(),
  start_date: z.string().min(1),
  end_date: z.string().optional(),
  monthly_rent: z.number().min(0),
  deposit_paid: z.number().min(0),
  terms: z.string().optional(),
  status: z.enum(leaseStatusValues).default("pending"),
})

export type TenantInviteInput = z.infer<typeof tenantInviteSchema>
export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>
export type LeaseFormInput = z.infer<typeof leaseSchema>

export interface TenantRow {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  national_id: string | null
  avatar_url: string | null
  is_active: boolean
  role: "tenant"
  created_at: string
  activeLease: {
    id: string
    status: string
    unit_number: string | null
    property_name: string | null
  } | null
  outstanding_balance: number
  available_credit: number
}

export interface LeaseRecord {
  id: string
  unit_id: string
  tenant_id: string
  start_date: string
  end_date: string | null
  monthly_rent: number
  deposit_paid: number
  status: LeaseStatus
  terms: string | null
  termination_reason: string | null
  terminated_at: string | null
  unit_number?: string | null
  property_name?: string | null
  tenant_name?: string | null
  tenant_phone?: string | null
  tenant_national_id?: string | null
  tenant_email?: string | null
}

export interface PaymentRecord {
  id: string
  amount: number
  allocated_amount?: number
  unapplied_credit_amount?: number
  created_at: string
  status: string
  payment_method: string
}

export interface MaintenanceRecord {
  id: string
  title: string
  status: string
  priority: string
  created_at: string
}

export interface TenantDetails extends TenantRow {
  leases: LeaseRecord[]
  payments: PaymentRecord[]
  maintenanceRequests: MaintenanceRecord[]
}

export function getLeaseEffectiveStatus(lease: Pick<LeaseRecord, "status" | "end_date">): LeaseStatus {
  if (lease.status === "terminated") return "terminated"
  if (lease.end_date) {
    const endDate = new Date(`${lease.end_date}T23:59:59`)
    if (!Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now()) return "expired"
  }
  return lease.status
}
