import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, TrendingUp, DollarSign, AlertCircle, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface ParentDashboardProps {
  stats: {
    totalChildren: number
    totalPendingFees: number
    averageAttendance: number
    upcomingEvents: number
  }
  profile: {
    first_name: string
    last_name: string
  }
  children: Array<{
    id: string
    name: string
    class: string
    attendanceRate: number
    averageGrade: number
    pendingFees: number
    recentActivity: string
  }>
}

export function ParentDashboard({ stats, profile, children }: ParentDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome, {profile.first_name}!</h2>
        <p className="text-muted-foreground">Monitor your children&apos;s academic progress and school activities.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChildren}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageAttendance}%</div>
            <Progress value={stats.averageAttendance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalPendingFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPendingFees > 0 ? "Payment required" : "All paid up!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Children Overview */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Children Overview</h3>
        {children.map((child) => (
          <Card key={child.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{child.name}</CardTitle>
                  <CardDescription>{child.class}</CardDescription>
                </div>
                <Badge variant="outline">{child.class}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Attendance</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">{child.attendanceRate}%</span>
                    {child.attendanceRate >= 90 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Average Grade</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">{child.averageGrade}%</span>
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Pending Fees</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">₦{child.pendingFees.toLocaleString()}</span>
                    {child.pendingFees > 0 && <DollarSign className="h-4 w-4 text-orange-600" />}
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Recent Activity</span>
                  <span className="text-sm mt-1">{child.recentActivity}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <a
                  href={`/dashboard/students/${child.id}/grades`}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors"
                >
                  View Grades
                </a>
                <a
                  href={`/dashboard/students/${child.id}/attendance`}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-accent transition-colors"
                >
                  View Attendance
                </a>
                {child.pendingFees > 0 && (
                  <a
                    href="/dashboard/finance/invoices"
                    className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Pay Fees
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
