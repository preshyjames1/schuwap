import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AnnouncementForm } from "@/components/communication/announcement-form"

export default async function NewAnnouncementPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("school_id").eq("id", user.id).single()

  if (!profile?.school_id) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Announcement</h1>
        <p className="text-muted-foreground">Create a new school announcement</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Announcement Details</CardTitle>
          <CardDescription>Fill in the announcement information</CardDescription>
        </CardHeader>
        <CardContent>
          <AnnouncementForm schoolId={profile.school_id} userId={user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
