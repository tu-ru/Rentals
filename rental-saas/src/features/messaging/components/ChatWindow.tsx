import { motion } from "framer-motion"
import { Send } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "../../../app/providers"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Avatar, AvatarFallback } from "../../../components/ui/avatar"
import { useConversation } from "../hooks"
import { usePresence } from "../hooks/usePresence"
import { useRealtimeMessages } from "../hooks/useRealtimeMessages"

function dayLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
}

export function ChatWindow({ conversationId }: { conversationId?: string }) {
  const { profile } = useAuth()
  const { data: conversation } = useConversation(conversationId)
  const { messages, sendMessage, loading } = useRealtimeMessages(conversationId)
  const { onlineUsers } = usePresence(conversationId, profile?.id)
  const [draft, setDraft] = useState("")
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const grouped = useMemo(() => {
    const out: Array<{ type: "date" | "message"; key: string; message?: (typeof messages)[number] }> = []
    let last = ""
    for (const message of messages) {
      const d = dayLabel(message.created_at)
      if (d !== last) {
        out.push({ type: "date", key: `date-${d}` })
        last = d
      }
      out.push({ type: "message", key: message.id, message })
    }
    return out
  }, [messages])

  if (!conversationId) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Select a conversation</div>

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{conversation?.title ?? "Conversation"}</h3>
          <span className="text-xs text-muted-foreground">{onlineUsers.length} online</span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-auto p-4">
        {loading ? <p className="text-sm text-muted-foreground">Loading messages...</p> : null}
        {!messages.length && !loading ? <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p> : null}

        {grouped.map((entry) =>
          entry.type === "date" ? (
            <div key={entry.key} className="my-3 text-center text-xs text-muted-foreground">{entry.key.replace("date-", "")}</div>
          ) : (
            <motion.div
              key={entry.key}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`group flex ${entry.message?.sender_id === profile?.id ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${entry.message?.sender_id === profile?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {entry.message?.sender_id !== profile?.id && (
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Avatar className="h-5 w-5"><AvatarFallback>{entry.message?.sender?.full_name?.[0] ?? "U"}</AvatarFallback></Avatar>
                    <span>{entry.message?.sender?.full_name ?? "User"}</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{entry.message?.body}</p>
                <p className="mt-1 hidden text-[10px] opacity-70 group-hover:block">{new Date(entry.message?.created_at ?? "").toLocaleTimeString()}</p>
              </div>
            </motion.div>
          ),
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                if (draft.trim()) {
                  await sendMessage(draft.trim())
                  setDraft("")
                }
              }
            }}
            placeholder="Type a message..."
          />
          <Button
            onClick={async () => {
              if (!draft.trim()) return
              await sendMessage(draft.trim())
              setDraft("")
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {draft.length > 850 && <p className="mt-1 text-right text-xs text-muted-foreground">{draft.length}/1000</p>}
      </div>
    </div>
  )
}
