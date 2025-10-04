import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { StudentForm } from "@/components/students/student-form"

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

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

  // Get student
  const { data: student, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .eq("school_id", profile.school_id)
    .single()

  if (error || !student) {
    notFound()
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
        <h2 className="text-3xl font-bold tracking-tight">Edit Student</h2>
        <p className="text-muted-foreground">Update student information</p>
      </div>

      <StudentForm schoolId={profile.school_id} classes={classes || []} student={student} />
    </div>
  )
}
