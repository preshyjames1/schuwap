import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard"
import { StudentDashboard } from "@/components/dashboard/student-dashboard"
import { ParentDashboard } from "@/components/dashboard/parent-dashboard"
import { AccountantDashboard } from "@/components/dashboard/accountant-dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*, school:schools(*)").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/error?error=Profile not found")
  }

  switch (profile.role) {
    case "super_admin":
    case "school_admin":
      return <AdminDashboardView profile={profile} />

    case "teacher":
      return <TeacherDashboardView profile={profile} />

    case "student":
      return <StudentDashboardView profile={profile} />

    case "parent":
      return <ParentDashboardView profile={profile} />

    case "accountant":
      return <AccountantDashboardView profile={profile} />

    default:
      return <div>Unsupported role: {profile.role}</div>
  }
}

async function AdminDashboardView({ profile }: { profile: any }) {
  const supabase = await createClient()

  // Get dashboard stats
  const { count: studentsCount } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("school_id", profile.school_id)
    .eq("status", "active")

  const { count: teachersCount } = await supabase
    .from("teachers")
    .select("*", { count: "exact", head: true })
    .eq("school_id", profile.school_id)
    .eq("status", "active")

  const { count: classesCount } = await supabase
    .from("classes")
    .select("*", { count: "exact", head: true })
    .eq("school_id", profile.school_id)

  // Get financial stats
  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("school_id", profile.school_id)
    .eq("status", "completed")

  const revenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const { count: pendingPayments } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("school_id", profile.school_id)
    .in("status", ["pending", "overdue"])

  // Get attendance rate
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const { data: attendanceData } = await supabase
    .from("attendance")
    .select("status")
    .eq("school_id", profile.school_id)
    .gte("date", weekAgo.toISOString().split("T")[0])

  const presentCount = attendanceData?.filter((a) => a.status === "present").length || 0
  const totalAttendance = attendanceData?.length || 1
  const attendanceRate = Math.round((presentCount / totalAttendance) * 100)

  // Get recent enrollments
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const { count: recentEnrollments } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("school_id", profile.school_id)
    .gte("admission_date", thirtyDaysAgo.toISOString().split("T")[0])

  return (
    <AdminDashboard
      stats={{
        studentsCount: studentsCount || 0,
        teachersCount: teachersCount || 0,
        classesCount: classesCount || 0,
        revenue,
        pendingPayments: pendingPayments || 0,
        attendanceRate,
        recentEnrollments: recentEnrollments || 0,
      }}
      profile={profile}
    />
  )
}

async function TeacherDashboardView({ profile }: { profile: any }) {
  const supabase = await createClient()

  // Get teacher record
  const { data: teacher } = await supabase.from("teachers").select("id").eq("user_id", profile.id).single()

  if (!teacher) {
    return <div>Teacher profile not found</div>
  }

  // Get assigned classes
  const { count: assignedClasses } = await supabase
    .from("class_subjects")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", teacher.id)

  // Get total students across all classes
  const { data: classSubjects } = await supabase.from("class_subjects").select("class_id").eq("teacher_id", teacher.id)

  const classIds = classSubjects?.map((cs) => cs.class_id) || []

  const { count: totalStudents } = await supabase
    .from("student_enrollments")
    .select("*", { count: "exact", head: true })
    .in("class_id", classIds.length > 0 ? classIds : [""])
    .eq("status", "active")

  // Get today's schedule
  const today = new Date().getDay() || 7 // Convert Sunday (0) to 7
  const { data: todaySchedule } = await supabase
    .from("timetables")
    .select("*, subject:subjects(name), class:classes(name)")
    .eq("teacher_id", teacher.id)
    .eq("day_of_week", today)
    .order("start_time")

  const formattedSchedule =
    todaySchedule?.map((t: any) => ({
      id: t.id,
      subject: t.subject?.name || "Unknown",
      class: t.class?.name || "Unknown",
      time: `${t.start_time.slice(0, 5)} - ${t.end_time.slice(0, 5)}`,
      room: t.room || "TBA",
    })) || []

  // Get pending grades count
  const { data: assessments } = await supabase
    .from("assessments")
    .select("id")
    .in("class_id", classIds.length > 0 ? classIds : [""])

  const assessmentIds = assessments?.map((a) => a.id) || []

  // This is a simplified count - in production you'd want to count students without grades
  const { count: pendingGrades } = await supabase
    .from("assessments")
    .select("*", { count: "exact", head: true })
    .in("id", assessmentIds.length > 0 ? assessmentIds : [""])

  return (
    <TeacherDashboard
      stats={{
        assignedClasses: assignedClasses || 0,
        totalStudents: totalStudents || 0,
        todayClasses: formattedSchedule.length,
        pendingGrades: pendingGrades || 0,
        attendanceMarked: 0, // Would need to track this separately
        upcomingAssessments: 0, // Would need to query future assessments
      }}
      profile={profile}
      todaySchedule={formattedSchedule}
    />
  )
}

async function StudentDashboardView({ profile }: { profile: any }) {
  const supabase = await createClient()

  // Get student record
  const { data: student } = await supabase
    .from("students")
    .select("*, current_class:classes(name)")
    .eq("user_id", profile.id)
    .single()

  if (!student) {
    return <div>Student profile not found</div>
  }

  // Get attendance rate
  const { data: attendanceData } = await supabase.from("attendance").select("status").eq("student_id", student.id)

  const presentCount = attendanceData?.filter((a) => a.status === "present").length || 0
  const totalAttendance = attendanceData?.length || 1
  const attendanceRate = Math.round((presentCount / totalAttendance) * 100)

  // Get average grade
  const { data: grades } = await supabase
    .from("grades")
    .select("score, assessment:assessments(max_score)")
    .eq("student_id", student.id)

  const averageGrade =
    grades && grades.length > 0
      ? Math.round(grades.reduce((sum, g: any) => sum + (g.score / g.assessment.max_score) * 100, 0) / grades.length)
      : 0

  // Get pending fees
  const { data: invoices } = await supabase
    .from("invoices")
    .select("balance")
    .eq("student_id", student.id)
    .in("status", ["pending", "partial", "overdue"])

  const pendingFees = invoices?.reduce((sum, inv) => sum + Number(inv.balance), 0) || 0

  // Get recent grades
  const { data: recentGrades } = await supabase
    .from("grades")
    .select("*, assessment:assessments(name, max_score, subject:subjects(name))")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const formattedGrades =
    recentGrades?.map((g: any) => ({
      id: g.id,
      subject: g.assessment.subject.name,
      assessment: g.assessment.name,
      score: g.score,
      maxScore: g.assessment.max_score,
      grade: g.grade || "N/A",
    })) || []

  // Get today's schedule
  const today = new Date().getDay() || 7
  const { data: todaySchedule } = await supabase
    .from("timetables")
    .select("*, subject:subjects(name), teacher:teachers(first_name, last_name)")
    .eq("class_id", student.current_class_id)
    .eq("day_of_week", today)
    .order("start_time")

  const formattedSchedule =
    todaySchedule?.map((t: any) => ({
      id: t.id,
      subject: t.subject?.name || "Unknown",
      time: `${t.start_time.slice(0, 5)} - ${t.end_time.slice(0, 5)}`,
      room: t.room || "TBA",
      teacher: t.teacher ? `${t.teacher.first_name} ${t.teacher.last_name}` : "TBA",
    })) || []

  return (
    <StudentDashboard
      stats={{
        currentClass: student.current_class?.name || "Not assigned",
        attendanceRate,
        averageGrade,
        pendingFees,
        upcomingAssessments: 0, // Would need to query future assessments
        completedAssignments: 0, // Would need assignment tracking
        totalAssignments: 0,
      }}
      profile={profile}
      recentGrades={formattedGrades}
      todaySchedule={formattedSchedule}
    />
  )
}

async function ParentDashboardView({ profile }: { profile: any }) {
  const supabase = await createClient()

  // Get parent record
  const { data: parent } = await supabase.from("parents").select("id").eq("user_id", profile.id).single()

  if (!parent) {
    return <div>Parent profile not found</div>
  }

  // Get linked children
  const { data: studentParents } = await supabase
    .from("student_parents")
    .select("student:students(*, current_class:classes(name))")
    .eq("parent_id", parent.id)

  const children = await Promise.all(
    (studentParents || []).map(async (sp: any) => {
      const student = sp.student

      // Get attendance rate
      const { data: attendanceData } = await supabase.from("attendance").select("status").eq("student_id", student.id)

      const presentCount = attendanceData?.filter((a) => a.status === "present").length || 0
      const totalAttendance = attendanceData?.length || 1
      const attendanceRate = Math.round((presentCount / totalAttendance) * 100)

      // Get average grade
      const { data: grades } = await supabase
        .from("grades")
        .select("score, assessment:assessments(max_score)")
        .eq("student_id", student.id)

      const averageGrade =
        grades && grades.length > 0
          ? Math.round(
              grades.reduce((sum, g: any) => sum + (g.score / g.assessment.max_score) * 100, 0) / grades.length,
            )
          : 0

      // Get pending fees
      const { data: invoices } = await supabase
        .from("invoices")
        .select("balance")
        .eq("student_id", student.id)
        .in("status", ["pending", "partial", "overdue"])

      const pendingFees = invoices?.reduce((sum, inv) => sum + Number(inv.balance), 0) || 0

      return {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        class: student.current_class?.name || "Not assigned",
        attendanceRate,
        averageGrade,
        pendingFees,
        recentActivity: "No recent activity",
      }
    }),
  )

  const totalPendingFees = children.reduce((sum, child) => sum + child.pendingFees, 0)
  const averageAttendance =
    children.length > 0
      ? Math.round(children.reduce((sum, child) => sum + child.attendanceRate, 0) / children.length)
      : 0

  return (
    <ParentDashboard
      stats={{
        totalChildren: children.length,
        totalPendingFees,
        averageAttendance,
        upcomingEvents: 0, // Would need to query events
      }}
      profile={profile}
      children={children}
    />
  )
}

async function AccountantDashboardView({ profile }: { profile: any }) {
  const supabase = await createClient()

  // Get financial stats
  const { data: payments } = await supabase
    .from("payments")
    .select("amount, created_at, student:students(first_name, last_name), payment_method, payment_reference")
    .eq("school_id", profile.school_id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })

  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  const today = new Date().toISOString().split("T")[0]
  const paymentsToday = payments?.filter((p) => p.created_at.startsWith(today)).length || 0

  const { count: pendingInvoices } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("school_id", profile.school_id)
    .eq("status", "pending")

  const { data: overdueInvoicesData } = await supabase
    .from("invoices")
    .select("*, student:students(first_name, last_name)")
    .eq("school_id", profile.school_id)
    .eq("status", "overdue")
    .order("due_date")

  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount")
    .eq("school_id", profile.school_id)
    .eq("status", "approved")

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
  const netIncome = totalRevenue - totalExpenses

  // Calculate collection rate
  const { data: allInvoices } = await supabase
    .from("invoices")
    .select("total_amount, paid_amount")
    .eq("school_id", profile.school_id)

  const totalBilled = allInvoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 1
  const totalCollected = allInvoices?.reduce((sum, inv) => sum + Number(inv.paid_amount), 0) || 0
  const collectionRate = Math.round((totalCollected / totalBilled) * 100)

  const recentPayments =
    payments?.slice(0, 5).map((p: any) => ({
      id: p.id,
      studentName: `${p.student.first_name} ${p.student.last_name}`,
      amount: Number(p.amount),
      method: p.payment_method,
      date: new Date(p.created_at).toLocaleDateString(),
      reference: p.payment_reference,
    })) || []

  const overdueInvoices =
    overdueInvoicesData?.map((inv: any) => {
      const dueDate = new Date(inv.due_date)
      const today = new Date()
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: inv.id,
        studentName: `${inv.student.first_name} ${inv.student.last_name}`,
        amount: Number(inv.balance),
        dueDate: dueDate.toLocaleDateString(),
        daysOverdue,
      }
    }) || []

  return (
    <AccountantDashboard
      stats={{
        totalRevenue,
        pendingInvoices: pendingInvoices || 0,
        overdueInvoices: overdueInvoicesData?.length || 0,
        paymentsToday,
        totalExpenses,
        netIncome,
        collectionRate,
      }}
      profile={profile}
      recentPayments={recentPayments}
      overdueInvoices={overdueInvoices}
    />
  )
}
