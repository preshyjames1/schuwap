"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { GraduationCap } from "lucide-react"

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    schoolName: "",
    subdomain: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/
    if (!subdomainRegex.test(formData.subdomain)) {
      setError("Subdomain can only contain lowercase letters, numbers, and hyphens")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      // Check if subdomain is available
      const { data: existingSchool } = await supabase
        .from("schools")
        .select("id")
        .eq("subdomain", formData.subdomain)
        .single()

      if (existingSchool) {
        setError("This subdomain is already taken")
        setIsLoading(false)
        return
      }

      // For development, use the dev redirect URL
      // For production, construct the subdomain URL (e.g., https://kingscollege.schuwap.com/onboarding)
      //const isProduction = window.location.hostname !== "localhost"
      const redirectUrl =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        (`https://${formData.subdomain}.schuwap.com/onboarding`)

      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            school_name: formData.schoolName,
            subdomain: formData.subdomain,
            phone: formData.phone,
          },
        },
      })

      if (authError) throw authError

      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <GraduationCap className="h-12 w-12 text-blue-600" />
            <h1 className="text-2xl font-bold">Register Your School</h1>
            <p className="text-sm text-muted-foreground">Start your 30-day free trial today</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">School Registration</CardTitle>
              <CardDescription>Create your school account and get started in minutes</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  {/* School Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">School Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="schoolName">School Name *</Label>
                        <Input
                          id="schoolName"
                          name="schoolName"
                          placeholder="Kings College"
                          required
                          value={formData.schoolName}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="subdomain">Subdomain *</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="subdomain"
                            name="subdomain"
                            placeholder="kingscollege"
                            required
                            value={formData.subdomain}
                            onChange={handleChange}
                            disabled={isLoading}
                            className="lowercase"
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">.schuwap.com</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Administrator Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="admin@school.com"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+234 800 000 0000"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create School Account"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="underline underline-offset-4">
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
