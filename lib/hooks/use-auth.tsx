"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Profile, School } from "@/lib/types/database"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  school: School | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = async () => {
    const supabase = createClient()
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (currentUser) {
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single()

      if (profileData) {
        setProfile(profileData)

        // Fetch school data
        if (profileData.school_id) {
          const { data: schoolData } = await supabase
            .from("schools")
            .select("*")
            .eq("id", profileData.school_id)
            .single()

          setSchool(schoolData)
        }
      }
    }
  }

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser)
      if (currentUser) {
        refreshProfile()
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        refreshProfile()
      } else {
        setProfile(null)
        setSchool(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSchool(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, school, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
