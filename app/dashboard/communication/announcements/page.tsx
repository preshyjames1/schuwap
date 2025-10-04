import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import Link from "next/link"

async function getAnnouncements(schoolId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("announcements")
    .select(`
      *,
      users:created_by (
        first_name,
        last_name
      )
    `)
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })

  return data || []
}

export default async function AnnouncementsPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("school_id").eq("id", user.id).single()

  if (!profile?.school_id) return null

  const announcements = await getAnnouncements(profile.school_id)

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      high: "destructive",
      medium: "default",
      low: "secondary",
    }
    return <Badge variant={variants[priority] || "secondary"}>{priority}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Announcements</h1>
          <p className="text-muted-foreground">Create and manage school announcements</p>
        </div>
        <Link href="/dashboard/communication/announcements/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{announcement.title}</h3>
                    {getPriorityBadge(announcement.priority)}
                  </div>
                  <p className="text-muted-foreground mb-4">{announcement.content}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      By {announcement.users?.first_name} {announcement.users?.last_name}
                    </span>
                    <span>•</span>
                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    {announcement.target_audience && (
                      <>
                        <span>•</span>
                        <span className="capitalize">For: {announcement.target_audience}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/communication/announcements/${announcement.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {announcements.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No announcements yet</p>
              <Link href="/dashboard/communication/announcements/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Announcement
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
