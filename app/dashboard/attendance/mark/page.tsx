import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MarkAttendanceForm } from "@/components/attendance/mark-attendance-form"

export default async function MarkAttendancePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("school_id, id").eq("id", user.id).single()

  if (!profile?.school_id) {
    redirect("/onboarding")
  }

  // Get classes
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("school_id", profile.school_id)
    .order("name")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mark Attendance</h2>
        <p className="text-muted-foreground">Record student attendance for today</p>
      </div>

      <MarkAttendanceForm schoolId={profile.school_id} classes={classes || []} markedBy={profile.id} />
    </div>
  )
}
