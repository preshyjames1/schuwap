"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

interface FeeStructureStepProps {
  schoolId: string
  academicYearId: string
  onNext: () => void
  onBack: () => void
}

interface FeeItem {
  name: string
  amount: number
  frequency: "one-time" | "term" | "annual"
  isMandatory: boolean
}

export function FeeStructureStep({ schoolId, academicYearId, onNext, onBack }: FeeStructureStepProps) {
  const [fees, setFees] = useState<FeeItem[]>([
    { name: "Tuition Fee", amount: 50000, frequency: "term", isMandatory: true },
    { name: "Development Levy", amount: 10000, frequency: "annual", isMandatory: true },
    { name: "Sports Fee", amount: 5000, frequency: "term", isMandatory: false },
  ])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAddFee = () => {
    setFees([...fees, { name: "", amount: 0, frequency: "term", isMandatory: true }])
  }

  const handleRemoveFee = (index: number) => {
    setFees(fees.filter((_, i) => i !== index))
  }

  const handleFeeChange = (index: number, field: keyof FeeItem, value: string | number | boolean) => {
    const updatedFees = [...fees]
    updatedFees[index] = { ...updatedFees[index], [field]: value }
    setFees(updatedFees)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const feeData = fees.map((fee) => ({
        school_id: schoolId,
        academic_year_id: academicYearId,
        name: fee.name,
        amount: fee.amount,
        frequency: fee.frequency,
        is_mandatory: fee.isMandatory,
      }))

      const { error: feeError } = await supabase.from("fee_structures").insert(feeData)

      if (feeError) throw feeError

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
          <h3 className="font-semibold">Fee Categories</h3>
          <Button type="button" variant="outline" size="sm" onClick={handleAddFee}>
            <Plus className="h-4 w-4 mr-2" />
            Add Fee
          </Button>
        </div>

        {fees.map((fee, index) => (
          <div key={index} className="grid gap-4 md:grid-cols-5 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor={`name-${index}`}>Fee Name *</Label>
              <Input
                id={`name-${index}`}
                placeholder="Tuition Fee"
                required
                value={fee.name}
                onChange={(e) => handleFeeChange(index, "name", e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`amount-${index}`}>Amount (₦) *</Label>
              <Input
                id={`amount-${index}`}
                type="number"
                min="0"
                required
                value={fee.amount}
                onChange={(e) => handleFeeChange(index, "amount", Number.parseFloat(e.target.value))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`frequency-${index}`}>Frequency *</Label>
              <Select
                value={fee.frequency}
                onValueChange={(value) => handleFeeChange(index, "frequency", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="term">Per Term</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`mandatory-${index}`}>Type *</Label>
              <Select
                value={fee.isMandatory ? "mandatory" : "optional"}
                onValueChange={(value) => handleFeeChange(index, "isMandatory", value === "mandatory")}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mandatory">Mandatory</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFee(index)}
                disabled={isLoading || fees.length === 1}
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
