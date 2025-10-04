"use client"

import { useAuth } from "./use-auth"
import type { UserRole } from "@/lib/types/database"

export function useRole() {
  const { profile } = useAuth()

  const hasRole = (role: UserRole): boolean => {
    return profile?.role === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return profile ? roles.includes(profile.role) : false
  }

  const isSuperAdmin = (): boolean => hasRole("super_admin")
  const isSchoolAdmin = (): boolean => hasRole("school_admin")
  const isTeacher = (): boolean => hasRole("teacher")
  const isStudent = (): boolean => hasRole("student")
  const isParent = (): boolean => hasRole("parent")
  const isAccountant = (): boolean => hasRole("accountant")

  const canManageSchool = (): boolean => hasAnyRole(["super_admin", "school_admin"])
  const canManageStudents = (): boolean => hasAnyRole(["super_admin", "school_admin", "teacher"])
  const canManageFinances = (): boolean => hasAnyRole(["super_admin", "school_admin", "accountant"])
  const canManageAcademics = (): boolean => hasAnyRole(["super_admin", "school_admin", "teacher"])

  return {
    role: profile?.role,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    isSchoolAdmin,
    isTeacher,
    isStudent,
    isParent,
    isAccountant,
    canManageSchool,
    canManageStudents,
    canManageFinances,
    canManageAcademics,
  }
}
