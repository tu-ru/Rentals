import { CalendarClock } from "lucide-react"
import { EmptyState, PageHeader } from "../components/shared"

export function StubPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={description} />
      <EmptyState icon={CalendarClock} title="Coming soon" description={description} />
    </div>
  )
}
