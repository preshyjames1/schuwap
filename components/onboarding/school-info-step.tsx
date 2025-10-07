"use client"

import type React from "react"
import { useState, useEffect } from "react" // Import useEffect
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SchoolInfoStepProps {
  onNext: () => void
  onSchoolCreated: (schoolId: string) => void
}

export function SchoolInfoStep({ onNext, onSchoolCreated }: SchoolInfoStepProps) {
  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Nigeria",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start with loading true

  // Fetch user metadata on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setFormData(prev => ({
          ...prev,
          name: user.user_metadata.school_name || "",
          subdomain: user.user_metadata.subdomain || "",
          phone: user.user_metadata.phone || "",
        }))
      }
      setIsLoading(false)
    }
    fetchUserData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Create school
      const { data: school, error: schoolError } = await supabase
        .from("schools")
        .insert({
          name: formData.name,
          subdomain: formData.subdomain,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          subscription_plan: "trial",
          subscription_status: "active",
        })
        .select()
        .single()
      if (schoolError) throw schoolError

      // Create profile for the user
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        school_id: school.id,
        first_name: user.user_metadata.first_name,
        last_name: user.user_metadata.last_name,
        email: user.email!,
        phone: user.user_metadata.phone,
        role: "school_admin",
        is_active: true,
      })
      if (profileError) throw profileError

      onSchoolCreated(school.id)
      onNext()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div>Loading user data...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">School Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            readOnly // Make read-only
            className="bg-gray-100"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subdomain">Subdomain *</Label>
          <div className="flex items-center gap-2">
            <Input
              id="subdomain"
              name="subdomain"
              value={formData.subdomain}
              readOnly // Make read-only
              className="lowercase bg-gray-100"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">.schuwap.xyz</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">School Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="info@school.com"
            required
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+234 800 000 0000"
            required
            value={formData.phone}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Textarea
          id="address"
          name="address"
          placeholder="Enter school address"
          required
          value={formData.address}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            name="city"
            placeholder="Lagos"
            required
            value={formData.city}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            name="state"
            placeholder="Lagos"
            required
            value={formData.state}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select
            value={formData.country}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nigeria">Nigeria</SelectItem>
              <SelectItem value="Ghana">Ghana</SelectItem>
              <SelectItem value="Kenya">Kenya</SelectItem>
              <SelectItem value="South Africa">South Africa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Continue"}
        </Button>
      </div>
    </form>
  )
}
