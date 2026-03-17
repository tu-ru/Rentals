import type { ReactElement } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../providers"
import { PageLoader } from "../../components/shared"

export function PrivateRoute({ children }: { children: ReactElement }) {
  const location = useLocation()
  const { initialized, user } = useAuth()

  if (!initialized) return <PageLoader />

  if (!user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  return children
}
