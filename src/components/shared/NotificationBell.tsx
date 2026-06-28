import { Bell, CreditCard, FileText, Wrench } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { useMarkAllAsRead, useMarkAsRead, useNotifications, useRealtimeNotifications } from "../../features/notifications/hooks"
import { useAuth } from "../../app/providers"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

function notificationIcon(type: string) {
  if (type.includes("payment")) return <CreditCard className="h-4 w-4" />
  if (type.includes("maintenance")) return <Wrench className="h-4 w-4" />
  if (type.includes("lease") || type.includes("invoice")) return <FileText className="h-4 w-4" />
  return <Bell className="h-4 w-4" />
}

export function NotificationBell() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const { data: notifications = [] } = useNotifications(10)
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const { unreadCount } = useRealtimeNotifications(profile?.id)

  const onItemClick = async (notification: (typeof notifications)[number]) => {
    await markAsRead.mutateAsync(notification.id)
    const target = (notification.metadata?.target as string) ||
      (notification.type.includes("maintenance") ? "/dashboard/maintenance" :
      notification.type.includes("payment") ? "/dashboard/payments" :
      notification.type.includes("lease") || notification.type.includes("invoice") ? "/dashboard/invoices" :
      "/dashboard")
    navigate(target)
    setOpen(false)
  }

  const unreadIds = useMemo(() => new Set(notifications.filter((n) => !n.is_read).map((n) => n.id)), [notifications])

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((prev) => !prev)} aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1">{unreadCount}</Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-md border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b p-3">
            <p className="text-sm font-semibold">Notifications</p>
            <button className="text-xs text-primary" onClick={() => void markAllAsRead.mutateAsync()}>
              Mark all as read
            </button>
          </div>

          <div className="max-h-96 overflow-auto p-2">
            {notifications.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No notifications.</p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => void onItemClick(notification)}
                  className={`mb-1 w-full rounded-md p-3 text-left hover:bg-muted ${unreadIds.has(notification.id) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 text-muted-foreground">{notificationIcon(notification.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${unreadIds.has(notification.id) ? "font-semibold" : "font-medium"}`}>{notification.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{notification.body}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {unreadIds.has(notification.id) && <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t p-3 text-xs">
            <button className="text-primary" onClick={() => void markAllAsRead.mutateAsync()}>Mark all as read</button>
            <button className="text-primary" onClick={() => navigate("/dashboard/messages")}>View all</button>
          </div>
        </div>
      )}
    </div>
  )
}
