import { useEffect, useState } from "react"
import { TenantLayout } from "../../components/layouts"
import { ChatWindow } from "../../features/messaging/components"
import { useAuth } from "../../app/providers"
import { supabase } from "../../lib/supabase/client"
import { getOrCreateDirectConversation } from "../../features/messaging/services"

export function TenantMessagesPage() {
  const { profile } = useAuth()
  const [conversationId, setConversationId] = useState<string>()

  useEffect(() => {
    if (!profile?.id || !profile.organization_id || profile.role !== "tenant") return

    void (async () => {
      const { data: staff } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("organization_id", profile.organization_id)
        .in("role", ["landlord", "agent", "admin"])
        .limit(1)

      const target = staff?.[0]?.id
      const organizationId = profile.organization_id
      if (!target || !organizationId) return
      const conversation = await getOrCreateDirectConversation(profile.id, target, organizationId)
      setConversationId(conversation.id)
    })()
  }, [profile?.id, profile?.organization_id, profile?.role])

  return (
    <TenantLayout title="Messages">
      <div className="h-[calc(100vh-10rem)] overflow-hidden rounded-lg border bg-background">
        <ChatWindow conversationId={conversationId} />
      </div>
    </TenantLayout>
  )
}
