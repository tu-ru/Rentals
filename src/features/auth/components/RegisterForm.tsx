import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { z } from "zod"
import { useAuth } from "../../../app/providers"
import * as authService from "../services/authService"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Progress } from "../../../components/ui/progress"
import { useToast } from "../../../components/ui/toast"
import { handleSupabaseError } from "../../../lib/utils/errors"

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
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { role: "landlord" },
  })

  const submit = form.handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const { user, session } = await signUp(values.email, values.password, {
        full_name: values.full_name,
        role: values.role,
        organization_name: values.organization_name,
      })

      if (!session) {
        toast({
          title: "Confirm your email",
          description: "We sent a verification link. Confirm it, then sign in to finish setup.",
        })
        return
      }

      const organization = await authService.createOrganization(values.organization_name, user.id)
      await authService.updateProfile(user.id, {
        full_name: values.full_name,
        phone: values.phone,
        organization_id: organization.id,
        role: values.role,
      })

      toast({
        title: "Account created",
        description: "Your workspace is ready. Let’s finish onboarding.",
      })
      navigate("/onboarding", { replace: true })
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: handleSupabaseError(error),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <div className="space-y-5">
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
            <p className="text-xs text-muted-foreground">You can add your first property in onboarding after account creation.</p>
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

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
