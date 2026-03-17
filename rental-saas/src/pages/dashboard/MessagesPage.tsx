import { useMemo, useState } from "react"
import { ChatWindow, ConversationList, NewConversationDialog } from "../../features/messaging/components"
import { useConversations } from "../../features/messaging/hooks"

export function MessagesPage() {
  const { data: conversations = [] } = useConversations()
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [openNew, setOpenNew] = useState(false)
  const [mobileMode, setMobileMode] = useState<"list" | "chat">("list")

  const unreadByConversation = useMemo(() => ({}), [])

  return (
    <>
      <div className="h-[calc(100vh-8rem)] overflow-hidden rounded-lg border bg-background">
        <div className="hidden h-full md:grid md:grid-cols-3">
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            unreadByConversation={unreadByConversation}
            onSelect={(id) => setSelectedId(id)}
            onNew={() => setOpenNew(true)}
          />
          <div className="col-span-2">
            <ChatWindow conversationId={selectedId} />
          </div>
        </div>

        <div className="h-full md:hidden">
          {mobileMode === "list" ? (
            <ConversationList
              conversations={conversations}
              selectedId={selectedId}
              unreadByConversation={unreadByConversation}
              onSelect={(id) => {
                setSelectedId(id)
                setMobileMode("chat")
              }}
              onNew={() => setOpenNew(true)}
            />
          ) : (
            <div className="h-full">
              <button className="border-b px-4 py-2 text-sm" onClick={() => setMobileMode("list")}>â† Back</button>
              <ChatWindow conversationId={selectedId} />
            </div>
          )}
        </div>
      </div>

      <NewConversationDialog open={openNew} onOpenChange={setOpenNew} onCreated={(id) => setSelectedId(id)} />
    </>
  )
}
