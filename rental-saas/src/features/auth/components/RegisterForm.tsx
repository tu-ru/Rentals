import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { useAuth } from "../../../app/providers"
import * as authService from "../services/authService"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Progress } from "../../../components/ui/progress"

const schema = z
  .object({
    full_name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().regex(/^(07|01)\d{8}$/, "Enter a valid Kenyan phone number"),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    organization_name: z.string().min(2),
    role: z.enum(["landlord", "agent"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

type Values = z.infer<typeof schema>

export function RegisterForm() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { role: "landlord" },
  })

  const submit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    const user = await signUp(values.email, values.password, {
      full_name: values.full_name,
      role: values.role,
    })

    const organization = await authService.createOrganization(values.organization_name, user.id)
    await authService.updateProfile(user.id, {
      full_name: values.full_name,
      phone: values.phone,
      organization_id: organization.id,
      role: values.role,
    })

    setSubmitting(false)
    navigate("/onboarding", { replace: true })
  })

  return (
    <form className="space-y-5" onSubmit={submit}>
      <Progress value={(step / 2) * 100} />

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label>Full name</Label>
            <Input {...form.register("full_name")} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input placeholder="07XXXXXXXX" {...form.register("phone")} />
            <p className="text-xs text-red-500">{form.formState.errors.phone?.message}</p>
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" {...form.register("password")} />
          </div>
          <div>
            <Label>Confirm password</Label>
            <Input type="password" {...form.register("confirmPassword")} />
            <p className="text-xs text-red-500">{form.formState.errors.confirmPassword?.message}</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Organization name</Label>
            <Input {...form.register("organization_name")} />
          </div>
          <div>
            <Label className="mb-2 block">Role</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="landlord" {...form.register("role")} /> Landlord
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="agent" {...form.register("role")} /> Agent
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between gap-2">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : (
          <span />
        )}

        {step < 2 ? (
          <Button type="button" onClick={() => setStep((s) => s + 1)}>
            Next
          </Button>
        ) : (
          <Button disabled={submitting}>{submitting ? "Creating account..." : "Create account"}</Button>
        )}
      </div>
    </form>
  )
}
