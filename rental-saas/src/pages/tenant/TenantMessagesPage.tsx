import { useEffect, useState } from "react"
import { useAuth } from "../../app/providers"
import { TenantLayout } from "../../components/layouts"
import { supabase } from "../../lib/supabase/client"
import { ChatWindow, ConversationList } from "../../features/messaging/components"
import { useConversations } from "../../features/messaging/hooks"
import { getOrCreateDirectConversation } from "../../features/messaging/services"

export function TenantMessagesPage() {
  const { profile } = useAuth()
  const { data: conversations = [] } = useConversations()
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [mobileMode, setMobileMode] = useState<"list" | "chat">("list")
  const [ensuringDefaultConversation, setEnsuringDefaultConversation] = useState(false)

  useEffect(() => {
    if (!conversations.length) {
      if (selectedId) setSelectedId(undefined)
      if (mobileMode !== "list") setMobileMode("list")
      return
    }

    const selectedStillExists = selectedId && conversations.some((conversation) => conversation.id === selectedId)
    if (!selectedStillExists) {
      setSelectedId(conversations[0]?.id)
    }
  }, [conversations, selectedId, mobileMode])

  useEffect(() => {
    if (!profile?.id || !profile.organization_id || profile.role !== "tenant") return
    if (conversations.length > 0 || ensuringDefaultConversation) return

    setEnsuringDefaultConversation(true)

    void (async () => {
      try {
        const { data: staff, error } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("organization_id", profile.organization_id)
          .in("role", ["landlord", "agent", "admin"])
          .limit(1)

        if (error) throw error

        const target = staff?.[0]?.id
        if (!target) return

        const conversation = await getOrCreateDirectConversation(profile.id, target, profile.organization_id)
        setSelectedId(conversation.id)
      } finally {
        setEnsuringDefaultConversation(false)
      }
    })()
  }, [conversations.length, ensuringDefaultConversation, profile?.id, profile?.organization_id, profile?.role])

  const unreadByConversation = {}

  return (
    <TenantLayout title="Messages">
      <div className="h-[calc(100vh-10rem)] overflow-hidden rounded-lg border bg-background">
        <div className="hidden h-full md:grid md:grid-cols-3">
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            unreadByConversation={unreadByConversation}
            onSelect={(id) => setSelectedId(id)}
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
            />
          ) : (
            <div className="h-full">
              <button className="border-b px-4 py-2 text-sm" onClick={() => setMobileMode("list")}>← Back</button>
              <ChatWindow conversationId={selectedId} />
            </div>
          )}
        </div>
      </div>
    </TenantLayout>
  )
}
