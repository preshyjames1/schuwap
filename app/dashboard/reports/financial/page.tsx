import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

export default async function FinancialReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("school_id, role").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/error?error=Profile not found")
  }

  // Check if user has permission to view financial reports
  const canViewFinancial = ["super_admin", "school_admin", "accountant"].includes(profile.role)

  if (!canViewFinancial) {
    redirect("/dashboard")
  }

  const reportTypes = [
    {
      title: "Revenue Report",
      description: "Total revenue and payment collection summary",
      action: "Generate Report",
    },
    {
      title: "Outstanding Fees Report",
      description: "List of students with pending payments",
      action: "Generate Report",
    },
    {
      title: "Payment Collection Report",
      description: "Detailed payment transactions and methods",
      action: "Generate Report",
    },
    {
      title: "Expense Report",
      description: "School expenses and expenditure analysis",
      action: "Generate Report",
    },
    {
      title: "Financial Statement",
      description: "Comprehensive income and expense statement",
      action: "Generate Report",
    },
    {
      title: "Fee Structure Report",
      description: "Current fee structures and pricing",
      action: "Generate Report",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Reports</h2>
          <p className="text-muted-foreground">Generate financial reports and analyze revenue data.</p>
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
