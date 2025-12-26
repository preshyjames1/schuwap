import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Plus, Search, Filter } from "lucide-react"
import { StudentTable } from "@/components/students/student-table" // Import the interactive table

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

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

  // Build query
  // NOTE: We alias 'classes' to 'class' so it matches the property expected by StudentTable
  let query = supabase
    .from("students")
    .select("*, class:classes(name)") 
    .eq("school_id", profile.school_id)
    .order("created_at", { ascending: false })

  // Apply filters
  if (params.search) {
    query = query.or(
      `first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,admission_number.ilike.%${params.search}%`,
    )
  }

  if (params.status) {
    query = query.eq("status", params.status)
  }

  const { data: students, error } = await query.limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">Manage student information and enrollment</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/students/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-3xl">{students?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl">{students?.filter((s) => s.status === "active").length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Suspended</CardDescription>
            <CardTitle className="text-3xl">{students?.filter((s) => s.status === "suspended").length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Graduated</CardDescription>
            <CardTitle className="text-3xl">{students?.filter((s) => s.status === "graduated").length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or admission number..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Table Content */}
          {error ? (
            <p className="text-sm text-red-600">Error loading students: {error.message}</p>
          ) : students && students.length > 0 ? (
            // Render the new interactive table here
            <StudentTable students={students} />
          ) : (
            // Empty State
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No students found</p>
              <Button asChild>
                <Link href="/dashboard/students/new">Add your first student</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}