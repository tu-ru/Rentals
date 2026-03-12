import type { ReactElement } from "react"
import { Navigate } from "react-router-dom"
import type { UserRole } from "../../types/auth.types"
import { useAuth } from "../providers"
import { PrivateRoute } from "./PrivateRoute"

function fallback(role?: UserRole) {
  if (role === "tenant") return "/tenant"
  if (role === "agent") return "/agent"
  return "/dashboard"
}

export function RoleRoute({ children, allowedRoles }: { children: ReactElement; allowedRoles: UserRole[] }) {
  const { profile } = useAuth()

  return (
    <PrivateRoute>
      {profile && allowedRoles.includes(profile.role) ? children : <Navigate to={fallback(profile?.role)} replace />}
    </PrivateRoute>
  )
}
