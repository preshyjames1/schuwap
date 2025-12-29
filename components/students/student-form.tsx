"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
// Import both actions
import { createStudentAction, updateStudentAction } from "@/app/actions/student"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StudentFormProps {
  schoolId: string
  classes: Array<{ id: string; name: string }>
  student?: any // This contains the data if we are in "Edit Mode"
}

export function StudentForm({ schoolId, classes, student }: StudentFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State initialization
  const [formData, setFormData] = useState({
    admissionNumber: student?.admission_number || "",
    firstName: student?.first_name || "",
    lastName: student?.last_name || "",
    middleName: student?.middle_name || "",
    dateOfBirth: student?.date_of_birth || "",
    gender: student?.gender || "male",
    bloodGroup: student?.blood_group || "",
    email: student?.email || "",
    phone: student?.phone || "",
    address: student?.address || "",
    classId: student?.class_id || "",
    status: student?.status || "active",
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const payload = new FormData()

      // 1. Append the School ID
      payload.append("schoolId", schoolId)

      // 2. Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          payload.append(key, value.toString())
        }
      })

      let result;

      // 3. DECIDE: Create or Update?
      if (student?.id) {
        // --- UPDATE MODE ---
        // We pass the payload AND the specific Student ID
        result = await updateStudentAction(payload, student.id)
      } else {
        // --- CREATE MODE ---
        result = await createStudentAction(payload)
      }

      // 4. Handle Response
      if (result.error) {
        setError(result.error)
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
      } else {
        toast({
          title: "Success",
          description: result.message || "Saved successfully.",
        })

        // Redirect
        router.push("/dashboard/students")
        router.refresh()
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An unexpected error occurred")
      toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} type="button">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {student ? "Edit Student" : "Add New Student"}
        </h1>
      </div>

      {/* Personal Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Select
                value={formData.bloodGroup}
                onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <SelectItem key={bg} value={bg}>
                      {bg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Academic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="admissionNumber">Admission Number</Label>
              <Input
                id="admissionNumber"
                value={formData.admissionNumber}
                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classId">Class</Label>
              <Select
                value={formData.classId}
                onValueChange={(value) => setFormData({ ...formData, classId: value })}
              >
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : student ? "Update Student" : "Add Student"}
        </Button>
      </div>
    </form>
  )
}