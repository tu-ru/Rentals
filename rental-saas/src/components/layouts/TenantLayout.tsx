import type { ReactNode } from "react"
import { TopNav } from "./TopNav"

export function TenantLayout({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav title={title} />
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  )
}
