import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Bell, Mail, Users } from "lucide-react"
import Link from "next/link"

async function getCommunicationStats(schoolId: string) {
  const supabase = await createServerClient()

  const [announcementsResult, messagesResult, notificationsResult] = await Promise.all([
    supabase.from("announcements").select("id").eq("school_id", schoolId),
    supabase.from("messages").select("id").eq("school_id", schoolId),
    supabase.from("notifications").select("id").eq("school_id", schoolId).eq("is_read", false),
  ])

  return {
    totalAnnouncements: announcementsResult.data?.length || 0,
    totalMessages: messagesResult.data?.length || 0,
    unreadNotifications: notificationsResult.data?.length || 0,
  }
}

export default async function CommunicationPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("school_id").eq("id", user.id).single()

  if (!profile?.school_id) return null

  const stats = await getCommunicationStats(profile.school_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communication</h1>
          <p className="text-muted-foreground">Manage announcements, messages, and notifications</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAnnouncements}</div>
            <p className="text-xs text-muted-foreground">Total announcements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">Total messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadNotifications}</div>
            <p className="text-xs text-muted-foreground">Pending notifications</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Create and manage school-wide announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/communication/announcements">
              <Button className="w-full">Manage Announcements</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>Send and receive messages</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/communication/messages">
              <Button className="w-full">View Messages</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>View all system notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/communication/notifications">
              <Button className="w-full">View Notifications</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulk Messaging</CardTitle>
            <CardDescription>Send messages to multiple recipients</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/communication/bulk">
              <Button className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Send Bulk Message
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
