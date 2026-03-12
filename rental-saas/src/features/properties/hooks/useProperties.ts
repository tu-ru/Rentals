import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { QUERY_KEYS } from "../../../lib/constants"
import { useToast } from "../../../components/ui/toast"
import * as propertyService from "../services/propertyService"
import type { CreatePropertyInput, CreateUnitInput, UpdatePropertyInput, UpdateUnitInput, Unit } from "../types/property.types"

export function useProperties() {
  const { profile } = useAuth()
  const organizationId = profile?.organization_id

  return useQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, organizationId],
    queryFn: () => propertyService.getProperties(organizationId as string),
    enabled: Boolean(organizationId),
  })
}

export function useProperty(id?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, id],
    queryFn: () => propertyService.getProperty(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateProperty() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreatePropertyInput) => propertyService.createProperty(data, profile?.organization_id as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES] })
      toast({ title: "Property created successfully" })
    },
    onError: (error) => {
      toast({ title: "Failed to create property", description: String(error), variant: "destructive" })
    },
  })
}

export function useUpdateProperty() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePropertyInput }) => propertyService.updateProperty(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES, variables.id] })
    },
    onError: (error) => {
      toast({ title: "Failed to update property", description: String(error), variant: "destructive" })
    },
  })
}

export function useDeleteProperty() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => propertyService.deleteProperty(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES] })
    },
    onError: (error) => {
      toast({ title: "Failed to delete property", description: String(error), variant: "destructive" })
    },
  })
}

export function usePropertyStats() {
  const { profile } = useAuth()
  const organizationId = profile?.organization_id

  return useQuery({
    queryKey: [QUERY_KEYS.PROPERTIES, "stats", organizationId],
    queryFn: () => propertyService.getPropertyStats(organizationId as string),
    enabled: Boolean(organizationId),
  })
}

export function useUnits(propertyId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.UNITS, propertyId],
    queryFn: () => propertyService.getUnits(propertyId as string),
    enabled: Boolean(propertyId),
  })
}

export function useCreateUnit() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateUnitInput) => propertyService.createUnit(data),
    onSuccess: (unit) => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.UNITS, unit.property_id] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES] })
    },
    onError: (error) => {
      toast({ title: "Failed to create unit", description: String(error), variant: "destructive" })
    },
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data, propertyId }: { id: string; data: UpdateUnitInput; propertyId: string }) =>
      propertyService.updateUnit(id, data),
    onSuccess: (_unit, variables) => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.UNITS, variables.propertyId] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES] })
    },
    onError: (error) => {
      toast({ title: "Failed to update unit", description: String(error), variant: "destructive" })
    },
  })
}

export function useUpdateUnitStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, status, propertyId }: { id: string; status: Unit["status"]; propertyId: string }) =>
      propertyService.updateUnitStatus(id, status),
    onSuccess: (_unit, variables) => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.UNITS, variables.propertyId] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPERTIES] })
    },
    onError: (error) => {
      toast({ title: "Failed to update unit status", description: String(error), variant: "destructive" })
    },
  })
}
