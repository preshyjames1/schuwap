"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/lib/types/database"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireSchool?: boolean
}

export function ProtectedRoute({ children, allowedRoles, requireSchool = true }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get user profile
      const { data: profile } = await supabase.from("profiles").select("role, school_id").eq("id", user.id).single()

      if (!profile) {
        router.push("/auth/error?error=Profile not found")
        return
      }

      // Check if school is required
      if (requireSchool && !profile.school_id) {
        router.push("/onboarding")
        return
      }

      // Check role authorization
      if (allowedRoles && !allowedRoles.includes(profile.role)) {
        router.push("/dashboard?error=unauthorized")
        return
      }

      setIsAuthorized(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [router, allowedRoles, requireSchool])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
