import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import * as authService from "../../features/auth/services/authService"
import { supabase } from "../../lib/supabase/client"
import type { AuthState, Organization, UserProfile, UserRole } from "../../types/auth.types"

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    metadata: { full_name: string; role: UserRole },
  ) => Promise<authService.SignUpResult>
  signOut: () => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
  setOrganization: (organization: Organization | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function roleHome(role?: UserRole | null) {
  if (role === "tenant") return "/tenant"
  if (role === "agent") return "/agent"
  return "/dashboard"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const mountedRef = useRef(true)
  const authRequestIdRef = useRef(0)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const loadUserData = useCallback(async (nextUser: User | null) => {
    const requestId = ++authRequestIdRef.current
    setUser(nextUser)

    if (!nextUser) {
      if (requestId !== authRequestIdRef.current) return null
      setProfile(null)
      setOrganization(null)
      setLoading(false)
      return null
    }

    setLoading(true)

    try {
      const nextProfile = await authService.getProfile(nextUser.id)
      if (!mountedRef.current || requestId !== authRequestIdRef.current) return null
      setProfile(nextProfile)

      if (nextProfile?.organization_id) {
        const nextOrg = await authService.getOrganization(nextProfile.organization_id)
        if (!mountedRef.current || requestId !== authRequestIdRef.current) return null
        setOrganization(nextOrg)
      } else {
        setOrganization(null)
      }

      return nextProfile
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes("Lock broken by another request")) {
        return null
      }
      console.error("Failed to load authenticated user data", error)
      if (requestId === authRequestIdRef.current) {
        setProfile(null)
        setOrganization(null)
      }
      return null
    } finally {
      if (requestId === authRequestIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const handleAuthStateChange = useCallback(
    async (event: AuthChangeEvent, session: Session | null) => {
      if (!mountedRef.current) return

      const nextProfile = await loadUserData(session?.user ?? null)
      if (!mountedRef.current) return

      setInitialized(true)

      if (!session?.user) {
        if (event === "SIGNED_OUT") {
          navigate("/login", { replace: true })
        }
        return
      }

      if (!nextProfile.organization_id) {
        navigate("/onboarding", { replace: true })
      } else {
        navigate(roleHome(nextProfile.role), { replace: true })
      }
    },
    [loadUserData, navigate],
  )

  useEffect(() => {
    mountedRef.current = true

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      window.setTimeout(() => {
        void handleAuthStateChange(event, session).catch((error) => {
          console.error("Unhandled auth state change error", error)
        })
      }, 0)
    })

    return () => {
      mountedRef.current = false
      subscription.subscription.unsubscribe()
    }
  }, [handleAuthStateChange])

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      await authService.signInWithEmail(email, password)
    } finally {
      setLoading(false)
    }
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, metadata: { full_name: string; role: UserRole }) => {
      setLoading(true)
      try {
        return await authService.signUpWithEmail(email, password, metadata)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const handleSignOut = useCallback(async () => {
    await authService.signOut()
  }, [])

  const sendMagicLink = useCallback(async (email: string) => {
    await authService.signInWithMagicLink(email)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const fresh = await authService.getProfile(user.id)
    setProfile(fresh)
    if (fresh?.organization_id) {
      const org = await authService.getOrganization(fresh.organization_id)
      setOrganization(org)
    }
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      organization,
      loading,
      initialized,
      signIn,
      signUp,
      signOut: handleSignOut,
      sendMagicLink,
      refreshProfile,
      setOrganization,
    }),
    [user, profile, organization, loading, initialized, signIn, handleSignOut, sendMagicLink, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
