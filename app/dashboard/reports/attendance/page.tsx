import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

export default async function AttendanceReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/error?error=Profile not found")
  }

  const reportTypes = [
    {
      title: "Daily Attendance Report",
      description: "Attendance records for a specific date",
      action: "Generate Report",
    },
    {
      title: "Weekly Attendance Summary",
      description: "Attendance statistics for the current week",
      action: "Generate Report",
    },
    {
      title: "Monthly Attendance Report",
      description: "Comprehensive monthly attendance analysis",
      action: "Generate Report",
    },
    {
      title: "Class-wise Attendance",
      description: "Attendance rates grouped by class",
      action: "Generate Report",
    },
    {
      title: "Student Attendance History",
      description: "Individual student attendance records",
      action: "Generate Report",
    },
    {
      title: "Absenteeism Report",
      description: "Students with low attendance rates",
      action: "Generate Report",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance Reports</h2>
          <p className="text-muted-foreground">Generate attendance reports and track student presence.</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reportTypes.map((report, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="mt-1">{report.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button size="sm" className="ml-auto">
                  {report.action}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
