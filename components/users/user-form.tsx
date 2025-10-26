"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { UserRole } from "@/lib/types/database"
import { PassportUpload } from "@/components/ui/passport-upload"

interface UserFormProps {
  schoolId: string
  userProfile?: any
  role: UserRole
  classes: Array<{ id: string; name: string }>
  subjects: Array<{ id: string; name: string }>
}

export function UserForm({ schoolId, userProfile, role, classes, subjects }: UserFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: userProfile?.first_name || "",
    lastName: userProfile?.last_name || "",
    email: userProfile?.email || "",
    phone: userProfile?.phone || "",
    dateOfBirth: userProfile?.date_of_birth || "",
    gender: userProfile?.gender || "male",
    address: userProfile?.address || "",
    // Teacher-specific fields
    employeeId: userProfile?.teachers?.[0]?.employee_id || userProfile?.staff?.[0]?.employee_id || "",
    qualification: userProfile?.teachers?.[0]?.qualification || "",
    specialization: userProfile?.teachers?.[0]?.specialization || "",
    // Parent-specific fields
    occupation: userProfile?.parents?.[0]?.occupation || "",
    // Staff-specific fields
    role: userProfile?.staff?.[0]?.role || "",
    photoUrl: userProfile?.avatar_url || null,
    classId: "",
    subjectId: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePhotoUpload = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      photoUrl: url,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const profileData = {
        school_id: schoolId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        role: role,
        is_active: true,
        avatar_url: formData.photoUrl,
      }

      let userId = userProfile?.id

      if (userProfile) {
        // Update existing user profile
        const { error: updateError } = await supabase.from("profiles").update(profileData).eq("id", userProfile.id)
        if (updateError) throw updateError
      } else {
        // For new users, we need to create an auth user first
        const { data, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: "password", // Set a temporary password
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
            },
          },
        })
        if (authError) throw authError
        if (!data.user) throw new Error("Could not create user")

        userId = data.user.id

        // Now create the profile
        const { error: insertError } = await supabase.from("profiles").insert({ ...profileData, id: userId })
        if (insertError) throw insertError
      }

      if (role === "teacher") {
        const teacherData = {
          school_id: schoolId,
          user_id: userId,
          employee_id: formData.employeeId,
          qualification: formData.qualification,
          specialization: formData.specialization,
        }

        if (userProfile?.teachers?.[0]?.id) {
          const { error: teacherError } = await supabase.from("teachers").update(teacherData).eq("id", userProfile.teachers[0].id)
          if (teacherError) throw teacherError
        } else {
          const { error: teacherError } = await supabase.from("teachers").insert(teacherData)
          if (teacherError) throw teacherError
        }

        if (formData.classId) {
          await supabase.from("classes").update({ class_teacher_id: userId }).eq("id", formData.classId)
        }
        if (formData.subjectId) {
          await supabase.from("class_subjects").insert({
            school_id: schoolId,
            class_id: formData.classId,
            subject_id: formData.subjectId,
            teacher_id: userId,
          })
        }
      }

      if (role === "parent") {
        const parentData = {
          school_id: schoolId,
          user_id: userId,
          occupation: formData.occupation,
        }

        if (userProfile?.parents?.[0]?.id) {
          const { error: parentError } = await supabase.from("parents").update(parentData).eq("id", userProfile.parents[0].id)
          if (parentError) throw parentError
        } else {
          const { error: parentError } = await supabase.from("parents").insert(parentData)
          if (parentError) throw parentError
        }
      }

      if (role === "staff") {
        const staffData = {
          school_id: schoolId,
          user_id: userId,
          employee_id: formData.employeeId,
          role: formData.role,
        }

        if (userProfile?.staff?.[0]?.id) {
          const { error: staffError } = await supabase.from("staff").update(staffData).eq("id", userProfile.staff[0].id)
          if (staffError) throw staffError
        } else {
          const { error: staffError } = await supabase.from("staff").insert(staffData)
          if (staffError) throw staffError
        }
      }

      router.push(`/dashboard/${role}s`)
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/dashboard/${role}s`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PassportUpload url={formData.photoUrl} onUpload={handlePhotoUpload} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" name="firstName" required value={formData.firstName} onChange={handleChange} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" name="lastName" required value={formData.lastName} onChange={handleChange} disabled={isLoading} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} disabled={isLoading || !!userProfile} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={isLoading} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={(value) => handleSelectChange("gender", value)} value={formData.gender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" value={formData.address} onChange={handleChange} disabled={isLoading} />
          </div>
        </CardContent>
      </Card>

      {role === "teacher" && (
        <Card>
          <CardHeader>
            <CardTitle>Teacher Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input id="employeeId" name="employeeId" required value={formData.employeeId} onChange={handleChange} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input id="qualification" name="qualification" value={formData.qualification} onChange={handleChange} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input id="specialization" name="specialization" value={formData.specialization} onChange={handleChange} disabled={isLoading} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="classId">Assign Class</Label>
                <Select onValueChange={(value) => handleSelectChange("classId", value)} value={formData.classId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjectId">Assign Subject</Label>
                <Select onValueChange={(value) => handleSelectChange("subjectId", value)} value={formData.subjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {role === "parent" && (
        <Card>
          <CardHeader>
            <CardTitle>Parent Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input id="occupation" name="occupation" value={formData.occupation} onChange={handleChange} disabled={isLoading} />
            </div>
          </CardContent>
        </Card>
      )}

      {role === "staff" && (
        <Card>
          <CardHeader>
            <CardTitle>Staff Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input id="employeeId" name="employeeId" required value={formData.employeeId} onChange={handleChange} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" name="role" value={formData.role} onChange={handleChange} disabled={isLoading} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : userProfile ? "Update" : "Add"} {role.charAt(0).toUpperCase() + role.slice(1)}
        </Button>
      </div>
    </form>
  )
}