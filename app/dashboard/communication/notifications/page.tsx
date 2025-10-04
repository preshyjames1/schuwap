import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle } from "lucide-react"

async function getNotifications(schoolId: string, userId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("school_id", schoolId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  return data || []
}

export default async function NotificationsPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("school_id").eq("id", user.id).single()

  if (!profile?.school_id) return null

  const notifications = await getNotifications(profile.school_id, user.id)

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      info: "default",
      success: "secondary",
      warning: "destructive",
    }
    return <Badge variant={variants[type] || "default"}>{type}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">View all your notifications</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 border rounded-lg ${!notification.is_read ? "bg-accent" : ""}`}
              >
                <div className="mt-1">
                  {notification.is_read ? (
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Bell className="h-5 w-5 text-primary" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold">{notification.title}</p>
                    {getTypeBadge(notification.type)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notification.content}</p>
                  <p className="text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
