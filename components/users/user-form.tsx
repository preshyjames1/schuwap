"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProfilePictureUpload } from "@/components/upload/profile-picture-upload"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

// Define valid roles and user types
export type UserRole = "student" | "teacher" | "parent" | "receptionist" | "accountant" | "librarian"
export type UserType = "students" | "teachers" | "parents" | "staff"

interface Address {
  street: string
  city: string
  state: string
  country: string
  zipCode: string
}

interface UserProfile {
  id?: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  date_of_birth?: string
  gender?: "male" | "female" | "other"
  avatar_url?: string
  avatar_path?: string
  address?: Address
  role?: UserRole
  is_active?: boolean
  class_id?: string
  teachers?: {
    id?: string
    employee_id?: string
    qualification?: string
    specialization?: string
  }[]
}

interface UserFormProps {
  schoolId: string
  userProfile?: UserProfile
  userType: UserType // Used for navigation and section headers (e.g. "staff", "teachers")
  defaultRole?: UserRole // Optional: Specific role to set (e.g. "accountant" when userType is "staff")
  onSubmit?: (data: any) => Promise<void>
}

const roleMap: Record<UserType, UserRole> = {
  students: "student",
  teachers: "teacher",
  parents: "parent",
  staff: "receptionist", // Default for staff, but can be overridden
}

export function UserForm({ schoolId, userProfile, userType, defaultRole, onSubmit }: UserFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [classes, setClasses] = useState<Array<{ id: string; name: string; section: string }>>([])

  // Determine the actual role: 
  // 1. Existing profile role (edit mode)
  // 2. Explicitly passed defaultRole (add mode, e.g. adding an Accountant)
  // 3. Fallback based on userType
  const role = userProfile?.role || defaultRole || roleMap[userType]
  
  const isEditing = !!userProfile?.id
  const singularType = userType === "staff" ? "staff" : userType.slice(0, -1)

  const [formData, setFormData] = useState({
    firstName: userProfile?.first_name || "",
    lastName: userProfile?.last_name || "",
    email: userProfile?.email || "",
    phone: userProfile?.phone || "",
    dateOfBirth: userProfile?.date_of_birth || "",
    gender: userProfile?.gender || "",
    avatarUrl: userProfile?.avatar_url || "",
    avatarPath: userProfile?.avatar_path || "",
    classId: userProfile?.class_id || "",
    address: {
      street: userProfile?.address?.street || "",
      city: userProfile?.address?.city || "",
      state: userProfile?.address?.state || "",
      country: userProfile?.address?.country || "",
      zipCode: userProfile?.address?.zipCode || "",
    },
    role: role,
    isActive: userProfile?.is_active ?? true,
    employeeId: userProfile?.teachers?.[0]?.employee_id || "",
    qualification: userProfile?.teachers?.[0]?.qualification || "",
    specialization: userProfile?.teachers?.[0]?.specialization || "",
  })

  // Fetch classes for students
  useEffect(() => {
    if (userType !== "students" || !schoolId) return

    const fetchClasses = async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section")
        .eq("school_id", schoolId)
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.error("Error fetching classes:", error)
      } else {
        setClasses(data || [])
      }
    }

    fetchClasses()
  }, [userType, schoolId, supabase])

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith("address.")) {
      const key = field.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [key]: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleImageUpdate = (url: string, path: string) => {
    setFormData((prev) => ({
      ...prev,
      avatarUrl: url,
      avatarPath: path,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const profileData = {
        school_id: schoolId,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        avatar_url: formData.avatarUrl || null,
        avatar_path: formData.avatarPath || null,
        address: Object.values(formData.address).some((v) => v)
          ? formData.address
          : null,
        role: formData.role,
        is_active: formData.isActive,
      }

      let userId = userProfile?.id

      if (isEditing) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update(profileData)
          .eq("id", userId!)

        if (updateError) throw updateError
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: Math.random().toString(36).slice(-8) + "A1!",
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              role: formData.role, // Important: Save role in metadata as well if needed
            },
          },
        })

        if (authError) throw authError
        if (!authData.user) throw new Error("Failed to create user")

        userId = authData.user.id

        const { error: insertError } = await supabase
          .from("profiles")
          .insert({ ...profileData, id: userId })

        if (insertError) throw insertError
      }

      // Handle Student Class Assignment
      if (userType === "students" && userId) {
        if (formData.classId) {
          const { error } = await supabase
            .from("student_classes")
            .upsert({ user_id: userId, class_id: formData.classId }, { onConflict: "user_id" })
          if (error) throw error
        } else if (isEditing) {
          await supabase.from("student_classes").delete().eq("user_id", userId)
        }
      }

      // Handle Teacher-Specific Data
      if (role === "teacher" && userId) {
        const teacherData = {
          school_id: schoolId,
          user_id: userId,
          employee_id: formData.employeeId,
          qualification: formData.qualification || null,
          specialization: formData.specialization || null,
        }

        if (userProfile?.teachers?.[0]?.id) {
          const { error } = await supabase
            .from("teachers")
            .update(teacherData)
            .eq("id", userProfile.teachers[0].id)
          if (error) throw error
        } else {
          const { error } = await supabase.from("teachers").insert(teacherData)
          if (error) throw error
        }
      }

      if (onSubmit) {
        await onSubmit({ userId, ...profileData })
      } else {
        router.push(`/dashboard/${userType}`)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "Failed to save user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/${userType}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Edit" : "Add"} {isEditing ? role : (defaultRole || singularType)}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update user information" : `Create a new ${role} account`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic details and contact info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfilePictureUpload
              currentImage={formData.avatarUrl}
              currentImagePath={formData.avatarPath}
              onImageUpdate={handleImageUpdate}
              onError={setError}
              userName={`${formData.firstName} ${formData.lastName}`.trim() || "User"}
              className="max-w-sm"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  disabled={isLoading || isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(v) => handleInputChange("gender", v)}
                  disabled={isLoading}
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
            </div>

            {/* Render Class Selection only for Students */}
            {userType === "students" && (
              <div className="space-y-2">
                <Label htmlFor="classId">Assign to Class</Label>
                <Select
                  value={formData.classId || "none"}
                  onValueChange={(v) => handleInputChange("classId", v === "none" ? "" : v)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Class Assigned</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} - {cls.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address Card (Same as before) ... */}
        {/* You can keep the existing Address Card code here */}
        
        {/* Teacher Info Card - Only for Teachers */}
        {role === "teacher" && (
          <Card>
            <CardHeader>
              <CardTitle>Teacher Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange("employeeId", e.target.value)}
                    required={role === "teacher"}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={formData.qualification}
                    onChange={(e) => handleInputChange("qualification", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => handleInputChange("specialization", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEditing ? "Update User" : "Create User"}</>
            )}
          </Button>
          <Link href={`/dashboard/${userType}`}>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}