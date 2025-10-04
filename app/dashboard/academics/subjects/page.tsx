import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddSubjectDialog } from "@/components/academics/add-subject-dialog"

export default async function SubjectsPage() {
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

  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .eq("school_id", profile.school_id)
    .order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Subjects</h2>
          <p className="text-muted-foreground">Manage school subjects and curriculum</p>
        </div>
        <AddSubjectDialog schoolId={profile.school_id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subject List</CardTitle>
        </CardHeader>
        <CardContent>
          {subjects && subjects.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>{subject.code || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={subject.is_core ? "default" : "secondary"}>
                          {subject.is_core ? "Core" : "Elective"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{subject.description || "No description"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No subjects found</p>
              <AddSubjectDialog schoolId={profile.school_id} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
