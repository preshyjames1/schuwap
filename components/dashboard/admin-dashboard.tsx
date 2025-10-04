import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, DollarSign, Calendar, TrendingUp, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AdminDashboardProps {
  stats: {
    studentsCount: number
    teachersCount: number
    classesCount: number
    revenue: number
    pendingPayments: number
    attendanceRate: number
    recentEnrollments: number
  }
  profile: {
    first_name: string
    last_name: string
  }
}

export function AdminDashboard({ stats, profile }: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {profile.first_name}!</h2>
        <p className="text-muted-foreground">Here&apos;s an overview of your school&apos;s performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.studentsCount}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.recentEnrollments}</span> new this term
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teaching Staff</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teachersCount}</div>
            <p className="text-xs text-muted-foreground">Active teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.classesCount}</div>
            <p className="text-xs text-muted-foreground">This academic year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This term</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Average attendance rate this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">{stats.attendanceRate}%</div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.attendanceRate >= 90 ? "Excellent attendance!" : "Needs improvement"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Alerts</CardTitle>
            <CardDescription>Pending payments and overdue invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{stats.pendingPayments}</div>
                <p className="text-sm text-muted-foreground">Pending invoices</p>
              </div>
            </div>
            {stats.pendingPayments > 0 && (
              <Badge variant="outline" className="mt-2">
                Requires attention
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <a
              href="/dashboard/students"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Manage Students</span>
            </a>
            <a
              href="/dashboard/finances"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-sm font-medium">View Finances</span>
            </a>
            <a
              href="/dashboard/communication"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-sm font-medium">Send Announcement</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
