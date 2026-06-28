import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../lib/supabase/client"

export function usePresence(conversationId?: string, profileId?: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    if (!conversationId || !profileId) return

    const channel = supabase.channel(`presence:${conversationId}`, {
      config: { presence: { key: profileId } },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<Record<string, any>[]>()
        setOnlineUsers(Object.keys(state))
      })
      .on("presence", { event: "join" }, () => {
        const state = channel.presenceState<Record<string, any>[]>()
        setOnlineUsers(Object.keys(state))
      })
      .on("presence", { event: "leave" }, () => {
        const state = channel.presenceState<Record<string, any>[]>()
        setOnlineUsers(Object.keys(state))
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: profileId, online_at: new Date().toISOString() })
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, profileId])

  return useMemo(() => ({ onlineUsers }), [onlineUsers])
}
