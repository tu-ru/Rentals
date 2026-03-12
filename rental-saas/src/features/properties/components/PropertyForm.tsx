import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createPropertySchema, propertyTypeValues, type CreatePropertyInput, type Property } from "../types/property.types"
import { useCreateProperty, useUpdateProperty } from "../hooks/useProperties"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"

const AMENITIES = ["WiFi", "Parking", "Security", "Water", "Generator", "CCTV", "Gym", "Swimming Pool"]

interface PropertyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property?: Property
}

export function PropertyForm({ open, onOpenChange, property }: PropertyFormProps) {
  const isEdit = Boolean(property)
  const createMutation = useCreateProperty()
  const updateMutation = useUpdateProperty()
  const [amenities, setAmenities] = useState<string[]>(property?.amenities ?? [])

  const defaults = useMemo<CreatePropertyInput>(() => ({
    name: property?.name ?? "",
    property_type: property?.property_type ?? "apartment",
    address: property?.address ?? "",
    city: property?.city ?? "Nairobi",
    county: property?.county ?? "Nairobi",
    description: property?.description ?? "",
    amenities: property?.amenities ?? [],
    images: property?.images ?? [],
    total_units: property?.total_units ?? 0,
    occupied_units: property?.occupied_units ?? 0,
    is_active: property?.is_active ?? true,
  }), [property])

  const form = useForm<CreatePropertyInput>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: defaults,
  })

  useEffect(() => {
    form.reset(defaults)
    setAmenities(defaults.amenities ?? [])
  }, [defaults, form])

  const loading = createMutation.isPending || updateMutation.isPending

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = { ...values, amenities }
    if (isEdit && property) {
      await updateMutation.mutateAsync({ id: property.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit property" : "Add property"}</DialogTitle>
          <DialogDescription>Capture essential property details.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label>Name</Label>
            <Input {...form.register("name")} />
          </div>
          <div>
            <Label>Type</Label>
            <Select {...form.register("property_type")}>
              {propertyTypeValues.map((type) => (
                <option key={type} value={type}>{type.replace("_", " ")}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Address</Label>
            <Input {...form.register("address")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City</Label>
              <Input {...form.register("city")} />
            </div>
            <div>
              <Label>County</Label>
              <Input {...form.register("county")} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <textarea className="min-h-20 w-full rounded-md border border-input bg-background p-2 text-sm" {...form.register("description")} />
          </div>

          <div>
            <Label className="mb-2 block">Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((item) => {
                const active = amenities.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAmenities((prev) => (active ? prev.filter((a) => a !== item) : [...prev, item]))}
                    className={`rounded-full border px-3 py-1 text-xs ${active ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
                  >
                    {item}
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={loading}>{loading ? "Saving..." : isEdit ? "Update property" : "Create property"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
