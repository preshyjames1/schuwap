import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, Users, DollarSign, Calendar, BookOpen } from "lucide-react"
import Link from "next/link"

export default async function ReportsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/error?error=Profile not found")
  }

  const canViewFinancial = ["super_admin", "school_admin", "accountant"].includes(profile.role)
  const canViewAcademic = ["super_admin", "school_admin", "teacher"].includes(profile.role)

  const reportCategories = [
    {
      title: "Student Reports",
      description: "Student performance, attendance, and progress reports",
      icon: Users,
      href: "/dashboard/reports/students",
      show: canViewAcademic,
    },
    {
      title: "Academic Reports",
      description: "Class performance, grades, and subject analysis",
      icon: BookOpen,
      href: "/dashboard/reports/academic",
      show: canViewAcademic,
    },
    {
      title: "Attendance Reports",
      description: "Daily, weekly, and monthly attendance statistics",
      icon: Calendar,
      href: "/dashboard/reports/attendance",
      show: canViewAcademic,
    },
    {
      title: "Financial Reports",
      description: "Revenue, payments, expenses, and financial summaries",
      icon: DollarSign,
      href: "/dashboard/reports/financial",
      show: canViewFinancial,
    },
    {
      title: "Analytics Dashboard",
      description: "Visual analytics and trends across all metrics",
      icon: TrendingUp,
      href: "/dashboard/reports/analytics",
      show: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground">Generate comprehensive reports and view analytics for your school.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportCategories
          .filter((category) => category.show)
          .map((category) => (
            <Link key={category.href} href={category.href}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{category.title}</CardTitle>
                      <CardDescription className="mt-1">{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Export</CardTitle>
          <CardDescription>Export common reports quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            <button className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Student List</span>
            </button>
            <button className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Fee Summary</span>
            </button>
            <button className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Attendance Sheet</span>
            </button>
            <button className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Grade Report</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
