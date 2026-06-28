import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useAuth } from "../../../app/providers"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import { useCreateMaintenanceRequest } from "../hooks"
import { createMaintenanceSchema, maintenanceCategoryValues, type CreateMaintenanceInput, type MaintenanceRequest } from "../types"

export function MaintenanceForm({ open, onOpenChange, unitId }: { open: boolean; onOpenChange: (open: boolean) => void; unitId: string }) {
  const { profile } = useAuth()
  const createMutation = useCreateMaintenanceRequest()

  const form = useForm<CreateMaintenanceInput>({
    resolver: zodResolver(createMaintenanceSchema),
    defaultValues: {
      organization_id: profile?.organization_id ?? "",
      tenant_id: profile?.id ?? "",
      unit_id: unitId,
      title: "",
      description: "",
      category: "plumbing",
      priority: "medium",
    },
  })

  useEffect(() => {
    form.setValue("unit_id", unitId)
  }, [form, unitId])

  const submit = form.handleSubmit(async (values) => {
    await createMutation.mutateAsync({ data: values, images: [] })
    form.reset({ ...values, title: "", description: "" })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Maintenance Request</DialogTitle>
          <DialogDescription>Describe the issue so the team can act on it.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <Label>Title</Label>
            <Input {...form.register("title")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select {...form.register("category")}>
                {maintenanceCategoryValues.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {(["low", "medium", "high", "emergency"] as MaintenanceRequest["priority"][]).map((priority) => (
                  <label key={priority} className="flex items-center gap-2">
                    <input type="radio" value={priority} {...form.register("priority")} /> {priority}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background p-2 text-sm"
              {...form.register("description")}
            />
            <p className="text-xs text-red-500">{form.formState.errors.description?.message}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={createMutation.isPending || !unitId}>{createMutation.isPending ? "Submitting..." : "Submit Request"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
