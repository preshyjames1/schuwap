"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { UserRole } from "@/lib/types/database"
import { TeacherForm } from "./teacher-form"
import { ParentForm } from "./parent-form"
import { StaffForm } from "./staff-form"

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
    // Teacher-specific fields
    employeeId: userProfile?.teachers?.[0]?.employee_id || userProfile?.staff?.[0]?.employee_id || "",
    qualification: userProfile?.teachers?.[0]?.qualification || "",
    specialization: userProfile?.teachers?.[0]?.specialization || "",
    // Parent-specific fields
    occupation: userProfile?.parents?.[0]?.occupation || "",
    // Staff-specific fields
    role: userProfile?.staff?.[0]?.role || "",
    photoUrl: userProfile?.photo_url || null,
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

  const renderForm = () => {
    switch (role) {
      case "teacher":
        return (
          <TeacherForm
            formData={formData}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handlePhotoUpload={handlePhotoUpload}
            isLoading={isLoading}
            userProfile={userProfile}
            classes={classes}
            subjects={subjects}
          />
        )
      case "parent":
        return (
          <ParentForm
            formData={formData}
            handleChange={handleChange}
            handlePhotoUpload={handlePhotoUpload}
            isLoading={isLoading}
            userProfile={userProfile}
          />
        )
      case "staff":
        return (
          <StaffForm
            formData={formData}
            handleChange={handleChange}
            handlePhotoUpload={handlePhotoUpload}
            isLoading={isLoading}
            userProfile={userProfile}
          />
        )
      default:
        return null
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

      {renderForm()}

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