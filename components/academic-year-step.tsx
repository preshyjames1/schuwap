"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AcademicYearStepProps {
  schoolId: string
  onNext: () => void
  onBack: () => void
  onAcademicYearCreated: (academicYearId: string) => void
}

export function AcademicYearStep({ schoolId, onNext, onBack, onAcademicYearCreated }: AcademicYearStepProps) {
  const [formData, setFormData] = useState({
    yearName: "2024/2025",
    startDate: "2024-09-01",
    endDate: "2025-07-31",
    term1Name: "First Term",
    term1Start: "2024-09-01",
    term1End: "2024-12-20",
    term2Name: "Second Term",
    term2Start: "2025-01-06",
    term2End: "2025-04-10",
    term3Name: "Third Term",
    term3Start: "2025-04-21",
    term3End: "2025-07-31",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Create academic year
      const { data: academicYear, error: yearError } = await supabase
        .from("academic_years")
        .insert({
          school_id: schoolId,
          name: formData.yearName,
          start_date: formData.startDate,
          end_date: formData.endDate,
          is_current: true,
        })
        .select()
        .single()

      if (yearError) throw yearError

      // Create terms
      const terms = [
        {
          school_id: schoolId,
          academic_year_id: academicYear.id,
          name: formData.term1Name,
          start_date: formData.term1Start,
          end_date: formData.term1End,
          is_current: true,
        },
        {
          school_id: schoolId,
          academic_year_id: academicYear.id,
          name: formData.term2Name,
          start_date: formData.term2Start,
          end_date: formData.term2End,
          is_current: false,
        },
        {
          school_id: schoolId,
          academic_year_id: academicYear.id,
          name: formData.term3Name,
          start_date: formData.term3Start,
          end_date: formData.term3End,
          is_current: false,
        },
      ]

      const { error: termsError } = await supabase.from("terms").insert(terms)

      if (termsError) throw termsError

      onAcademicYearCreated(academicYear.id)
      onNext()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold">Academic Year</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="yearName">Year Name *</Label>
            <Input
              id="yearName"
              name="yearName"
              placeholder="2024/2025"
              required
              value={formData.yearName}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              required
              value={formData.startDate}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date *</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              required
              value={formData.endDate}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">First Term</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="term1Name">Term Name *</Label>
            <Input
              id="term1Name"
              name="term1Name"
              required
              value={formData.term1Name}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term1Start">Start Date *</Label>
            <Input
              id="term1Start"
              name="term1Start"
              type="date"
              required
              value={formData.term1Start}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term1End">End Date *</Label>
            <Input
              id="term1End"
              name="term1End"
              type="date"
              required
              value={formData.term1End}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Second Term</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="term2Name">Term Name *</Label>
            <Input
              id="term2Name"
              name="term2Name"
              required
              value={formData.term2Name}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term2Start">Start Date *</Label>
            <Input
              id="term2Start"
              name="term2Start"
              type="date"
              required
              value={formData.term2Start}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term2End">End Date *</Label>
            <Input
              id="term2End"
              name="term2End"
              type="date"
              required
              value={formData.term2End}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Third Term</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="term3Name">Term Name *</Label>
            <Input
              id="term3Name"
              name="term3Name"
              required
              value={formData.term3Name}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term3Start">Start Date *</Label>
            <Input
              id="term3Start"
              name="term3Start"
              type="date"
              required
              value={formData.term3Start}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="term3End">End Date *</Label>
            <Input
              id="term3End"
              name="term3End"
              type="date"
              required
              value={formData.term3End}
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

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Continue"}
        </Button>
      </div>
    </form>
  )
}
