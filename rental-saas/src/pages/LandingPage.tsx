import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"

export function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-semibold">RentMS Kenya</h1>
        <p className="mt-3 text-muted-foreground">Modern rental operations for landlords, agents and tenants.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link to="/login">
            <Button>Login</Button>
          </Link>
          <Link to="/register">
            <Button variant="outline">Create account</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
