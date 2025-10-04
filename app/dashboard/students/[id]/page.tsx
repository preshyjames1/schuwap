import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, User } from "lucide-react"

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

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

  // Get student details
  const { data: student, error } = await supabase
    .from("students")
    .select(
      `
      *,
      current_class:classes(name),
      enrollments:student_enrollments(
        *,
        class:classes(name),
        academic_year:academic_years(name)
      ),
      parents:student_parents(
        *,
        parent:parents(*)
      )
    `,
    )
    .eq("id", id)
    .eq("school_id", profile.school_id)
    .single()

  if (error || !student) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "suspended":
        return "bg-red-100 text-red-800"
      case "graduated":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateAge = (dob: string) => {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/students">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Student Profile</h2>
            <p className="text-muted-foreground">View and manage student information</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/students/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </Button>
      </div>

      {/* Student Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={student.photo_url || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">
                {student.first_name[0]}
                {student.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold">
                  {student.first_name} {student.middle_name} {student.last_name}
                </h3>
                <p className="text-muted-foreground">Admission No: {student.admission_number}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="capitalize">{student.gender}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{calculateAge(student.date_of_birth)} years old</span>
                </div>
                {student.current_class && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Class: {student.current_class.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="parents">Parents/Guardians</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-muted-foreground">Date of Birth:</span>
                  <span className="text-sm font-medium">{new Date(student.date_of_birth).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-muted-foreground">Blood Group:</span>
                  <span className="text-sm font-medium">{student.blood_group || "Not specified"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-muted-foreground">Nationality:</span>
                  <span className="text-sm font-medium">{student.nationality}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-muted-foreground">Religion:</span>
                  <span className="text-sm font-medium">{student.religion || "Not specified"}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-muted-foreground">Admission Date:</span>
                  <span className="text-sm font-medium">{new Date(student.admission_date).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {student.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{student.phone}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p>{student.address}</p>
                    {student.city && student.state && (
                      <p className="text-muted-foreground">
                        {student.city}, {student.state}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment History</CardTitle>
              <CardDescription>Student&apos;s class enrollment records</CardDescription>
            </CardHeader>
            <CardContent>
              {student.enrollments && student.enrollments.length > 0 ? (
                <div className="space-y-3">
                  {student.enrollments.map((enrollment: any) => (
                    <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{enrollment.class?.name}</p>
                        <p className="text-sm text-muted-foreground">{enrollment.academic_year?.name}</p>
                      </div>
                      <Badge>{enrollment.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No enrollment records found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parents/Guardians</CardTitle>
              <CardDescription>Contact information for student&apos;s guardians</CardDescription>
            </CardHeader>
            <CardContent>
              {student.parents && student.parents.length > 0 ? (
                <div className="space-y-4">
                  {student.parents.map((sp: any) => (
                    <div key={sp.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">
                            {sp.parent.first_name} {sp.parent.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">{sp.relationship}</p>
                        </div>
                        {sp.is_primary_contact && <Badge>Primary Contact</Badge>}
                      </div>
                      <div className="space-y-1 text-sm">
                        {sp.parent.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span>{sp.parent.email}</span>
                          </div>
                        )}
                        {sp.parent.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{sp.parent.phone}</span>
                          </div>
                        )}
                        {sp.parent.occupation && (
                          <p className="text-muted-foreground">Occupation: {sp.parent.occupation}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No parent/guardian information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Summary</CardTitle>
              <CardDescription>Student&apos;s fee payment status</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Financial records will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
