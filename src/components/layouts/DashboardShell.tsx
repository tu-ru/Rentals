import { Outlet, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TopNav } from "./TopNav"

const titleMap: Array<{ path: string; title: string; exact?: boolean }> = [
  { path: "/dashboard", title: "Dashboard", exact: true },
  { path: "/dashboard/properties", title: "Properties" },
  { path: "/dashboard/tenants", title: "Tenants" },
  { path: "/dashboard/leases", title: "Leases" },
  { path: "/dashboard/payments", title: "Payments" },
  { path: "/dashboard/invoices", title: "Invoices" },
  { path: "/dashboard/maintenance", title: "Maintenance" },
  { path: "/dashboard/messages", title: "Messages" },
  { path: "/dashboard/reports", title: "Reports" },
  { path: "/dashboard/settings", title: "Settings" },
]

function resolveTitle(pathname: string) {
  const exact = titleMap.find((item) => item.exact && pathname === item.path)
  if (exact) return exact.title

  const partial = titleMap.find((item) => !item.exact && pathname.startsWith(item.path))
  if (partial) return partial.title

  if (pathname.startsWith("/dashboard/properties/")) return "Property Details"
  return "Dashboard"
}

export function DashboardShell() {
  const { pathname } = useLocation()
  const title = resolveTitle(pathname)

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
