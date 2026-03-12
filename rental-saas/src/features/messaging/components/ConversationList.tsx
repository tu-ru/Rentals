import { MessageSquarePlus, Search } from "lucide-react"
import { useMemo, useState } from "react"
import type { Conversation } from "../types"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"

export function ConversationList({
  conversations,
  selectedId,
  unreadByConversation,
  onSelect,
  onNew,
}: {
  conversations: Conversation[]
  selectedId?: string
  unreadByConversation?: Record<string, number>
  onSelect: (conversationId: string) => void
  onNew: () => void
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(
    () => conversations.filter((c) => (c.title ?? "Direct Conversation").toLowerCase().includes(query.toLowerCase())),
    [conversations, query],
  )

  return (
    <div className="flex h-full flex-col border-r">
      <div className="space-y-2 border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search conversations" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Button className="w-full" onClick={onNew}><MessageSquarePlus className="mr-2 h-4 w-4" />New Message</Button>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {filtered.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            className={`mb-1 w-full rounded-md p-3 text-left hover:bg-muted ${selectedId === conversation.id ? "bg-muted" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{conversation.title ?? "Direct conversation"}</p>
              {!!unreadByConversation?.[conversation.id] && <Badge>{unreadByConversation[conversation.id]}</Badge>}
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">No recent preview yet</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{new Date(conversation.created_at).toLocaleString()}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
