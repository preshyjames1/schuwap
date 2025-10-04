import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { BookOpen, Calendar, ClipboardCheck, GraduationCap } from "lucide-react"

export default async function AcademicsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("school_id, role").eq("id", user.id).single()

  if (!profile?.school_id) {
    redirect("/onboarding")
  }

  // Get stats
  const { count: subjectsCount } = await supabase
    .from("subjects")
    .select("*", { count: "exact", head: true })
    .eq("school_id", profile.school_id)

  const { count: assessmentsCount } = await supabase
    .from("assessments")
    .select("*", { count: "exact", head: true })
    .eq("school_id", profile.school_id)

  const { count: classesCount } = await supabase
    .from("classes")
    .select("*", { count: "exact", head: true })
    .eq("school_id", profile.school_id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Academic Management</h2>
        <p className="text-muted-foreground">Manage subjects, assessments, grades, and attendance</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Subjects</CardDescription>
            <CardTitle className="text-3xl">{subjectsCount || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Assessments</CardDescription>
            <CardTitle className="text-3xl">{assessmentsCount || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Classes</CardDescription>
            <CardTitle className="text-3xl">{classesCount || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/academics/subjects">
            <CardHeader>
              <BookOpen className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Subjects</CardTitle>
              <CardDescription>Manage school subjects and curriculum</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/academics/assessments">
            <CardHeader>
              <ClipboardCheck className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Assessments</CardTitle>
              <CardDescription>Create and manage exams and tests</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/academics/grades">
            <CardHeader>
              <GraduationCap className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Grades</CardTitle>
              <CardDescription>Enter and view student grades</CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link href="/dashboard/attendance">
            <CardHeader>
              <Calendar className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Attendance</CardTitle>
              <CardDescription>Mark and track student attendance</CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Academic Activity</CardTitle>
          <CardDescription>Latest updates and actions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent activity to display</p>
        </CardContent>
      </Card>
    </div>
  )
}
