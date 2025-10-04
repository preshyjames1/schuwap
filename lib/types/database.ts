export type UserRole =
  | "super_admin"
  | "school_admin"
  | "teacher"
  | "student"
  | "parent"
  | "accountant"
  | "librarian"
  | "nurse"

export type SubscriptionPlan = "trial" | "basic" | "standard" | "premium"
export type SubscriptionStatus = "active" | "suspended" | "cancelled"

export interface School {
  id: string
  name: string
  subdomain: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country: string
  logo_url?: string
  website?: string
  subscription_plan: SubscriptionPlan
  subscription_status: SubscriptionStatus
  subscription_expires_at?: string
  max_students: number
  max_staff: number
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  school_id: string
  first_name: string
  last_name: string
  middle_name?: string
  email: string
  phone?: string
  date_of_birth?: string
  gender?: "male" | "female" | "other"
  address?: string
  city?: string
  state?: string
  country: string
  avatar_url?: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  school_id: string
  user_id?: string
  admission_number: string
  first_name: string
  last_name: string
  middle_name?: string
  date_of_birth: string
  gender: "male" | "female"
  blood_group?: string
  email?: string
  phone?: string
  address: string
  city?: string
  state?: string
  country: string
  nationality: string
  religion?: string
  photo_url?: string
  admission_date: string
  current_class_id?: string
  status: "active" | "suspended" | "graduated" | "withdrawn" | "transferred"
  created_at: string
  updated_at: string
}
