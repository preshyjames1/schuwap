"use client"

import { useEffect, useState } from "react" // Import useState
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client" // Import Supabase client

interface CompletionStepProps {
  schoolId: string
}

export function CompletionStep({ schoolId }: CompletionStepProps) {
  const router = useRouter()
  const [subdomain, setSubdomain] = useState<string | null>(null)

  useEffect(() => {
    const getSubdomainAndRedirect = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.user_metadata.subdomain) {
        const schoolSubdomain = user.user_metadata.subdomain
        setSubdomain(schoolSubdomain)
        
        // Construct the full URL for the redirect
        const redirectUrl = process.env.NODE_ENV === 'production'
          ? `https://${schoolSubdomain}.schuwap.xyz/dashboard`
          : `http://localhost:3000/dashboard` // For local testing, subdomains are harder

        // Auto-redirect after 3 seconds
        const timer = setTimeout(() => {
          window.location.href = redirectUrl;
        }, 3000)

        return () => clearTimeout(timer)
      }
    }

    getSubdomainAndRedirect()
  }, [router])

  const handleRedirect = () => {
    if (subdomain) {
      const redirectUrl = process.env.NODE_ENV === 'production'
        ? `https://${subdomain}.schuwap.xyz/dashboard`
        : `http://localhost:3000/dashboard`
      window.location.href = redirectUrl;
    }
  }
  return (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="relative">
          <CheckCircle className="h-24 w-24 text-green-600" />
          <Sparkles className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Setup Complete!</h2>
        <p className="text-muted-foreground">Your school is now ready to use Schuwap</p>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg space-y-3 text-left max-w-md mx-auto">
        <h3 className="font-semibold">What&apos;s Next?</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Add teachers and staff members</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Enroll students into classes</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Set up subjects and timetables</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Start managing your school!</span>
          </li>
        </ul>
      </div>

      <Button size="lg" onClick={() => router.push("/dashboard")}>
        Go to Dashboard
      </Button>

      <p className="text-xs text-muted-foreground">Redirecting automatically in 3 seconds...</p>
    </div>
  )
}
