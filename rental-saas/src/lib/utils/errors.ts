export function handleSupabaseError(error: unknown): string {
  if (!error) return "Something went wrong. Please try again."

  const maybeError = error as { code?: string; message?: string; name?: string; status?: number }
  const code = maybeError.code
  const message = maybeError.message ?? ""

  if (code === "23505") return "This record already exists"
  if (code === "23503") return "Related record not found"
  if (code === "42501") return "You don't have permission to do this"

  if (message.toLowerCase().includes("invalid login credentials")) return "Incorrect email or password"
  if (message.toLowerCase().includes("email not confirmed")) return "Please confirm your email before signing in"
  if (message.toLowerCase().includes("jwt") || maybeError.status === 401) {
    return "Your session has expired. Please sign in again"
  }

  return message || "Something went wrong. Please try again."
}
