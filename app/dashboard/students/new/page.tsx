import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StudentForm } from "@/components/students/student-form"

export default async function NewStudentPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single()

  if (!profile?.school_id) {
    redirect("/onboarding")
  }

  // Get classes for dropdown
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("school_id", profile.school_id)
    .order("name")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add New Student</h2>
        <p className="text-muted-foreground">Enter student information to create a new record</p>
      </div>

      <StudentForm schoolId={profile.school_id} classes={classes || []} />
    </div>
  )
}
