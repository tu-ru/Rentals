import { useEffect, useState } from "react"
import { useAuth } from "../../../app/providers"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { useCreateConversation } from "../hooks"
import { supabase } from "../../../lib/supabase/client"

export function NewConversationDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: (id: string) => void }) {
  const { profile } = useAuth()
  const mutation = useCreateConversation()
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [candidates, setCandidates] = useState<Array<{ id: string; full_name: string | null; role: string }>>([])

  useEffect(() => {
    if (!open || !profile?.organization_id) return
    void supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("organization_id", profile.organization_id)
      .neq("id", profile.id)
      .then(({ data }) => setCandidates((data ?? []) as any))
  }, [open, profile?.organization_id, profile?.id])

  const filtered = candidates.filter((c) => c.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
  const allowed = filtered.filter((c) =>
    profile?.role === "tenant" ? ["landlord", "agent", "admin"].includes(c.role) : true,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>Select people to message.</DialogDescription>
        </DialogHeader>

        <Input placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="max-h-56 space-y-1 overflow-auto rounded-md border p-2">
          {allowed.map((person) => (
            <button
              key={person.id}
              onClick={() => setSelected((prev) => (prev.includes(person.id) ? prev.filter((id) => id !== person.id) : [...prev, person.id]))}
              className={`w-full rounded px-2 py-1 text-left text-sm ${selected.includes(person.id) ? "bg-primary/10" : "hover:bg-muted"}`}
            >
              {person.full_name} <span className="text-xs text-muted-foreground">({person.role})</span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!selected.length || mutation.isPending}
            onClick={async () => {
              const conversation = await mutation.mutateAsync({ title: "", memberIds: selected, isGroup: selected.length > 1 })
              onCreated(conversation.id)
              onOpenChange(false)
              setSelected([])
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
