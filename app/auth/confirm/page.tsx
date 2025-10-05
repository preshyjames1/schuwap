"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import type { EmailOtpType } from "@supabase/supabase-js" // Import the type

export default function AuthConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const confirmEmail = async () => {
      const supabase = createClient()
      const token_hash = searchParams.get("token_hash")
      const type = searchParams.get("type") as EmailOtpType | null // <--- THIS IS THE FIX

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (!error) {
          // On successful verification, redirect to the onboarding page
          router.push("/onboarding")
        } else {
          // Handle error, e.g., redirect to an error page
          console.error("Email confirmation error:", error.message)
          router.push("/auth/error?error=Email confirmation failed")
        }
      } else {
        // Redirect if the token is missing
        router.push("/auth/error?error=Invalid confirmation link")
      }
    }

    confirmEmail()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <h1 className="text-2xl font-bold">Verifying your email...</h1>
        <p className="text-sm text-muted-foreground">Please wait a moment.</p>
      </div>
    </div>
  )
}