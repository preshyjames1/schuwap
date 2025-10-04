import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Calendar, Plus } from "lucide-react"

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; date?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

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

  // Get classes
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("school_id", profile.school_id)
    .order("name")

  // Get today's attendance stats
  const today = new Date().toISOString().split("T")[0]
  const { count: presentCount } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("school_id", profile.school_id)
    .eq("date", today)
    .eq("status", "present")

  const { count: absentCount } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("school_id", profile.school_id)
    .eq("date", today)
    .eq("status", "absent")

  const { count: lateCount } = await supabase
    .from("attendance")
    .select("*", { count: "exact", head: true })
    .eq("school_id", profile.school_id)
    .eq("date", today)
    .eq("status", "late")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
          <p className="text-muted-foreground">Mark and track student attendance</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/attendance/mark">
            <Plus className="h-4 w-4 mr-2" />
            Mark Attendance
          </Link>
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today&apos;s Date</CardDescription>
            <CardTitle className="text-xl">{new Date().toLocaleDateString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Present</CardDescription>
            <CardTitle className="text-3xl text-green-600">{presentCount || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Absent</CardDescription>
            <CardTitle className="text-3xl text-red-600">{absentCount || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Late</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{lateCount || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>View and manage attendance history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Select Date
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Select a class and date to view attendance records</p>
        </CardContent>
      </Card>
    </div>
  )
}
