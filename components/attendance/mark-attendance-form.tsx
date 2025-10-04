"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Check, X, Clock } from "lucide-react"
import Link from "next/link"

interface MarkAttendanceFormProps {
  schoolId: string
  classes: Array<{ id: string; name: string }>
  markedBy: string
}

interface StudentAttendance {
  id: string
  first_name: string
  last_name: string
  admission_number: string
  photo_url?: string
  status: "present" | "absent" | "late" | "excused"
}

export function MarkAttendanceForm({ schoolId, classes, markedBy }: MarkAttendanceFormProps) {
  const router = useRouter()
  const [selectedClass, setSelectedClass] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [students, setStudents] = useState<StudentAttendance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (selectedClass) {
      loadStudents()
    }
  }, [selectedClass])

  const loadStudents = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("students")
      .select("id, first_name, last_name, admission_number, photo_url")
      .eq("school_id", schoolId)
      .eq("current_class_id", selectedClass)
      .eq("status", "active")
      .order("first_name")

    if (error) {
      setError(error.message)
      return
    }

    setStudents(
      data.map((student) => ({
        ...student,
        status: "present" as const,
      })),
    )
  }

  const updateStudentStatus = (studentId: string, status: StudentAttendance["status"]) => {
    setStudents((prev) => prev.map((student) => (student.id === studentId ? { ...student, status } : student)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const attendanceRecords = students.map((student) => ({
        school_id: schoolId,
        student_id: student.id,
        class_id: selectedClass,
        date,
        status: student.status,
        marked_by: markedBy,
      }))

      const { error: insertError } = await supabase.from("attendance").insert(attendanceRecords)

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard/attendance")
        router.refresh()
      }, 2000)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800"
      case "absent":
        return "bg-red-100 text-red-800"
      case "late":
        return "bg-orange-100 text-orange-800"
      case "excused":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/attendance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Class and Date</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance ({students.length} students)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={student.photo_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {student.first_name[0]}
                        {student.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{student.admission_number}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant={student.status === "present" ? "default" : "outline"}
                        onClick={() => updateStudentStatus(student.id, "present")}
                        disabled={isLoading}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant={student.status === "absent" ? "destructive" : "outline"}
                        onClick={() => updateStudentStatus(student.id, "absent")}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant={student.status === "late" ? "default" : "outline"}
                        onClick={() => updateStudentStatus(student.id, "late")}
                        disabled={isLoading}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>Attendance marked successfully! Redirecting...</AlertDescription>
        </Alert>
      )}

      {students.length > 0 && (
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      )}
    </form>
  )
}
