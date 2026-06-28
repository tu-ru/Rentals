import { Link } from "react-router-dom"
import { Button } from "../../components/ui/button"

export function OrganizationArchivedPage() {
  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">
        Your organization has been archived. Workspace access is disabled until a super admin restores it.
      </p>
      <p className="text-sm text-muted-foreground">
        Contact platform support or your super admin for restoration.
      </p>
      <div className="flex justify-center gap-3">
        <Link to="/login">
          <Button variant="outline">Back to login</Button>
        </Link>
        <Link to="/contact">
          <Button>Contact support</Button>
        </Link>
      </div>
    </div>
  )
}
