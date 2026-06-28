import { Link } from "react-router-dom"
import { Button } from "../../components/ui/button"

export function InviteRequiredPage() {
  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">
        This system is provisioned by invitation. Your account is not linked to an organization yet.
      </p>
      <p className="text-sm text-muted-foreground">
        Contact a super admin to receive an invitation or to complete your organization assignment.
      </p>
      <div className="flex justify-center gap-3">
        <Link to="/login">
          <Button variant="outline">Back to login</Button>
        </Link>
        <Link to="/contact">
          <Button>Request access</Button>
        </Link>
      </div>
    </div>
  )
}
