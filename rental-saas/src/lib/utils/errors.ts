export function handleSupabaseError(error: unknown): string {
  if (!error) return "Something went wrong. Please try again."

  const maybeError = error as { code?: string; message?: string; name?: string; status?: number }
  const code = maybeError.code
  const message = (maybeError.message ?? "").toLowerCase()

  if (code === "23505") return "This item already exists."
  if (code === "23503") return "We couldn't find the related record for this action."
  if (code === "42501") return "You don't have permission to do that."

  if (message.includes("invalid login credentials")) return "That email or password doesn't match our records."
  if (message.includes("email not confirmed")) return "Please confirm your email, then try signing in again."
  if (message.includes("user already registered") || message.includes("already registered")) {
    return "That email is already registered. Try signing in instead."
  }
  if (message.includes("weak password") || message.includes("password should be")) {
    return "Please use a stronger password (at least 8 characters)."
  }
  if (message.includes("invalid email") || message.includes("email") && message.includes("invalid")) {
    return "Please enter a valid email address."
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again."
  }
  if (message.includes("user not found")) {
    return "We couldn't find an account with that email."
  }
  if (message.includes("jwt") || maybeError.status === 401) {
    return "Your session has expired. Please sign in again."
  }

  return (maybeError.message ?? "") || "Something went wrong. Please try again."
}
