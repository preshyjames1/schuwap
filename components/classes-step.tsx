"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2 } from "lucide-react"

interface ClassesStepProps {
  schoolId: string
  academicYearId: string
  onNext: () => void
  onBack: () => void
}

interface ClassItem {
  name: string
  level: number
  section: string
  capacity: number
}

export function ClassesStep({ schoolId, academicYearId, onNext, onBack }: ClassesStepProps) {
  const [classes, setClasses] = useState<ClassItem[]>([
    { name: "JSS 1A", level: 1, section: "A", capacity: 40 },
    { name: "JSS 1B", level: 1, section: "B", capacity: 40 },
    { name: "JSS 2A", level: 2, section: "A", capacity: 40 },
    { name: "JSS 3A", level: 3, section: "A", capacity: 40 },
  ])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddClass = () => {
    setClasses([...classes, { name: "", level: 1, section: "", capacity: 40 }])
  }

  const handleRemoveClass = (index: number) => {
    setClasses(classes.filter((_, i) => i !== index))
  }

  const handleClassChange = (index: number, field: keyof ClassItem, value: string | number) => {
    const updatedClasses = [...classes]
    updatedClasses[index] = { ...updatedClasses[index], [field]: value }
    setClasses(updatedClasses)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const classData = classes.map((cls) => ({
        school_id: schoolId,
        academic_year_id: academicYearId,
        name: cls.name,
        level: cls.level,
        section: cls.section,
        capacity: cls.capacity,
      }))

      const { error: classError } = await supabase.from("classes").insert(classData)

      if (classError) throw classError

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
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Classes/Grades</h3>
          <Button type="button" variant="outline" size="sm" onClick={handleAddClass}>
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </div>

        {classes.map((cls, index) => (
          <div key={index} className="grid gap-4 md:grid-cols-5 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor={`name-${index}`}>Class Name *</Label>
              <Input
                id={`name-${index}`}
                placeholder="JSS 1A"
                required
                value={cls.name}
                onChange={(e) => handleClassChange(index, "name", e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`level-${index}`}>Level *</Label>
              <Input
                id={`level-${index}`}
                type="number"
                min="1"
                required
                value={cls.level}
                onChange={(e) => handleClassChange(index, "level", Number.parseInt(e.target.value))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`section-${index}`}>Section</Label>
              <Input
                id={`section-${index}`}
                placeholder="A"
                value={cls.section}
                onChange={(e) => handleClassChange(index, "section", e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`capacity-${index}`}>Capacity *</Label>
              <Input
                id={`capacity-${index}`}
                type="number"
                min="1"
                required
                value={cls.capacity}
                onChange={(e) => handleClassChange(index, "capacity", Number.parseInt(e.target.value))}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveClass(index)}
                disabled={isLoading || classes.length === 1}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        ))}
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
