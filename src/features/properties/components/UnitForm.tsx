import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createUnitSchema, type CreateUnitInput, type Unit } from "../types/property.types"
import { useCreateUnit, useUpdateUnit } from "../hooks/useProperties"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"

interface UnitFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  unit?: Unit
}

const FEATURE_TAGS = ["Balcony", "Ensuite", "Parking", "Water Included", "Furnished", "WiFi Ready"]

export function UnitForm({ open, onOpenChange, propertyId, unit }: UnitFormProps) {
  const createMutation = useCreateUnit()
  const updateMutation = useUpdateUnit()
  const [features, setFeatures] = useState<string[]>(unit?.features ?? [])
  const isEdit = Boolean(unit)

  const defaults = useMemo<CreateUnitInput>(
    () => ({
      property_id: propertyId,
      unit_number: unit?.unit_number ?? "",
      floor_number: unit?.floor_number ?? null,
      unit_type: unit?.unit_type ?? "",
      status: unit?.status ?? "vacant",
      rent_amount: Number(unit?.rent_amount ?? 0),
      deposit_amount: Number(unit?.deposit_amount ?? 0),
      size_sqft: unit?.size_sqft ?? null,
      features: unit?.features ?? [],
      images: unit?.images ?? [],
    }),
    [propertyId, unit],
  )

  const form = useForm<CreateUnitInput>({
    resolver: zodResolver(createUnitSchema),
    defaultValues: defaults,
  })

  useEffect(() => {
    form.reset(defaults)
    setFeatures(defaults.features ?? [])
  }, [defaults, form])

  const loading = createMutation.isPending || updateMutation.isPending

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = { ...values, property_id: propertyId, features, images: unit?.images ?? [] }
    if (isEdit && unit) {
      await updateMutation.mutateAsync({ id: unit.id, data: payload, propertyId })
    } else {
      await createMutation.mutateAsync(payload)
    }
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit unit" : "Add unit"}</DialogTitle>
          <DialogDescription>Configure rental details for this unit.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unit Number</Label>
              <Input placeholder="A1" {...form.register("unit_number")} />
            </div>
            <div>
              <Label>Floor Number</Label>
              <Input type="number" {...form.register("floor_number", { valueAsNumber: true })} />
            </div>
          </div>
          <div>
            <Label>Unit Type</Label>
            <Input placeholder="1BR" {...form.register("unit_type")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Monthly Rent (KES)</Label>
              <Input type="number" {...form.register("rent_amount", { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Security Deposit (KES)</Label>
              <Input type="number" {...form.register("deposit_amount", { valueAsNumber: true })} />
            </div>
          </div>
          <div>
            <Label>Size (sqft)</Label>
            <Input type="number" {...form.register("size_sqft", { valueAsNumber: true })} />
          </div>

          <div>
            <Label className="mb-2 block">Features</Label>
            <div className="flex flex-wrap gap-2">
              {FEATURE_TAGS.map((item) => {
                const active = features.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFeatures((prev) => (active ? prev.filter((a) => a !== item) : [...prev, item]))}
                    className={`rounded-full border px-3 py-1 text-xs ${active ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                  >
                    {item}
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={loading}>{loading ? "Saving..." : isEdit ? "Update unit" : "Create unit"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
