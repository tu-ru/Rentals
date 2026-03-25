import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import type { UserRole } from "../../types/auth.types"
import { useAuth } from "../../app/providers"
import { toast } from "../../components/ui/toast"
import { LoginForm } from "../../features/auth/components/LoginForm"

export function LoginPage() {
  const { user, profile, initialized } = useAuth()
  const navigate = useNavigate()
  const notifiedRef = useRef(false)

  useEffect(() => {
    if (!initialized || !user || notifiedRef.current) return
    notifiedRef.current = true
    const normalizedRole = profile?.role ? (profile.role.trim().toLowerCase() as UserRole) : undefined
    const dashboardHref = normalizedRole === "tenant" ? "/tenant" : normalizedRole === "agent" ? "/agent" : normalizedRole === "super_admin" ? "/super-admin" : "/dashboard"
    toast({ title: "You're already signed in", description: "Redirecting you to your dashboard." })
    navigate(dashboardHref, { replace: true })
  }, [initialized, user, profile, navigate])

  return <LoginForm />
}
