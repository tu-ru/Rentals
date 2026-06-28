import type { ReactElement } from "react"
import { Navigate } from "react-router-dom"
import type { UserRole } from "../../types/auth.types"
import { useAuth } from "../providers"
import { PageLoader } from "../../components/shared"
import { PrivateRoute } from "./PrivateRoute"

function fallback(role?: UserRole) {
  if (role === "tenant") return "/tenant"
  if (role === "agent") return "/agent"
  if (role === "super_admin") return "/super-admin"
  return "/dashboard"
}

export function RoleRoute({ children, allowedRoles }: { children: ReactElement; allowedRoles: UserRole[] }) {
  const { initialized, profile, user } = useAuth()
  const normalizedRole = profile?.role ? (profile.role.trim().toLowerCase() as UserRole) : undefined
  const isAllowed = normalizedRole ? allowedRoles.includes(normalizedRole) : false

  return (
    <PrivateRoute>
      {!initialized ? <PageLoader /> : user && !profile ? <PageLoader /> : isAllowed ? children : <Navigate to={fallback(normalizedRole)} replace />}
    </PrivateRoute>
  )
}
