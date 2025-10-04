import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AnalyticsCharts } from "@/components/reports/analytics-charts"

export default async function AnalyticsPage() {
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

  // Get enrollment trends (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data: students } = await supabase
    .from("students")
    .select("admission_date")
    .eq("school_id", profile.school_id)
    .gte("admission_date", sixMonthsAgo.toISOString().split("T")[0])

  // Group by month
  const enrollmentByMonth: Record<string, number> = {}
  students?.forEach((student) => {
    const month = new Date(student.admission_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    enrollmentByMonth[month] = (enrollmentByMonth[month] || 0) + 1
  })

  const enrollmentData = Object.entries(enrollmentByMonth).map(([month, count]) => ({
    month,
    students: count,
  }))

  // Get attendance trends (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: attendanceRecords } = await supabase
    .from("attendance")
    .select("date, status")
    .eq("school_id", profile.school_id)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])

  // Group by date
  const attendanceByDate: Record<string, { present: number; absent: number; total: number }> = {}
  attendanceRecords?.forEach((record) => {
    const date = new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    if (!attendanceByDate[date]) {
      attendanceByDate[date] = { present: 0, absent: 0, total: 0 }
    }
    attendanceByDate[date].total++
    if (record.status === "present") {
      attendanceByDate[date].present++
    } else {
      attendanceByDate[date].absent++
    }
  })

  const attendanceData = Object.entries(attendanceByDate)
    .map(([date, data]) => ({
      date,
      rate: Math.round((data.present / data.total) * 100),
    }))
    .slice(-14) // Last 14 days

  // Get payment trends (last 6 months)
  const { data: payments } = await supabase
    .from("payments")
    .select("amount, payment_date")
    .eq("school_id", profile.school_id)
    .eq("status", "completed")
    .gte("payment_date", sixMonthsAgo.toISOString().split("T")[0])

  // Group by month
  const revenueByMonth: Record<string, number> = {}
  payments?.forEach((payment) => {
    const month = new Date(payment.payment_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(payment.amount)
  })

  const revenueData = Object.entries(revenueByMonth).map(([month, revenue]) => ({
    month,
    revenue,
  }))

  // Get grade distribution
  const { data: grades } = await supabase
    .from("grades")
    .select("score, assessment:assessments(max_score)")
    .eq("school_id", profile.school_id)

  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  grades?.forEach((grade: any) => {
    const percentage = (grade.score / grade.assessment.max_score) * 100
    if (percentage >= 90) gradeDistribution.A++
    else if (percentage >= 80) gradeDistribution.B++
    else if (percentage >= 70) gradeDistribution.C++
    else if (percentage >= 60) gradeDistribution.D++
    else gradeDistribution.F++
  })

  const gradeData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    grade,
    students: count,
  }))

  return (
    <AnalyticsCharts
      enrollmentData={enrollmentData}
      attendanceData={attendanceData}
      revenueData={revenueData}
      gradeData={gradeData}
    />
  )
}
