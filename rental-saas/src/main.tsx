import React from "react"
import ReactDOM from "react-dom/client"
import "./styles/globals.css"

function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <h1 className="text-lg font-semibold">RentMS Kenya</h1>
          <span className="rounded-md bg-muted px-3 py-1 text-sm text-muted-foreground">
            UI Shell
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="mb-2 h-4 w-1/2 rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppShell />
  </React.StrictMode>,
)
