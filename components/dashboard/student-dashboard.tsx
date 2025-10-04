import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, TrendingUp, DollarSign, Award, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface StudentDashboardProps {
  stats: {
    currentClass: string
    attendanceRate: number
    averageGrade: number
    pendingFees: number
    upcomingAssessments: number
    completedAssignments: number
    totalAssignments: number
  }
  profile: {
    first_name: string
    last_name: string
  }
  recentGrades: Array<{
    id: string
    subject: string
    assessment: string
    score: number
    maxScore: number
    grade: string
  }>
  todaySchedule: Array<{
    id: string
    subject: string
    time: string
    room: string
    teacher: string
  }>
}

export function StudentDashboard({ stats, profile, recentGrades, todaySchedule }: StudentDashboardProps) {
  const assignmentProgress = (stats.completedAssignments / stats.totalAssignments) * 100

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {profile.first_name}!</h2>
        <p className="text-muted-foreground">
          {stats.currentClass} • Track your academic progress and stay on top of your studies.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <Progress value={stats.attendanceRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.attendanceRate >= 90 ? "Excellent!" : "Keep it up!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageGrade}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-600" /> Keep up the good work!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedAssignments}/{stats.totalAssignments}
            </div>
            <Progress value={assignmentProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">{Math.round(assignmentProgress)}% complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.pendingFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingFees > 0 ? "Payment required" : "All paid up!"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule and Recent Grades */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Classes</CardTitle>
            <CardDescription>Your schedule for today</CardDescription>
          </CardHeader>
          <CardContent>
            {todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {todaySchedule.slice(0, 4).map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{schedule.subject}</span>
                        <span className="text-xs text-muted-foreground">{schedule.teacher}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{schedule.time}</div>
                      <div className="text-xs text-muted-foreground">{schedule.room}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No classes scheduled for today.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
            <CardDescription>Your latest assessment results</CardDescription>
          </CardHeader>
          <CardContent>
            {recentGrades.length > 0 ? (
              <div className="space-y-3">
                {recentGrades.slice(0, 4).map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{grade.subject}</span>
                      <span className="text-xs text-muted-foreground">{grade.assessment}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {grade.score}/{grade.maxScore}
                      </span>
                      <Badge variant={grade.score / grade.maxScore >= 0.7 ? "default" : "secondary"}>
                        {grade.grade}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No grades available yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Assessments */}
      {stats.upcomingAssessments > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assessments</CardTitle>
            <CardDescription>Tests and exams scheduled this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">{stats.upcomingAssessments}</div>
              <div className="text-sm text-muted-foreground">
                assessments scheduled
                <br />
                <a href="/dashboard/academics/grades" className="text-primary hover:underline">
                  View details →
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
