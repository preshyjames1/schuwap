"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { GraduationCap, CheckCircle } from "lucide-react"
import { SchoolInfoStep } from "@/components/onboarding/school-info-step"
import { AcademicYearStep } from "@/components/onboarding/academic-year-step"
import { ClassesStep } from "@/components/onboarding/classes-step"
import { FeeStructureStep } from "@/components/onboarding/fee-structure-step"
import { CompletionStep } from "@/components/onboarding/completion-step"

const STEPS = [
  { id: 1, name: "School Information", description: "Basic details about your school" },
  { id: 2, name: "Academic Year", description: "Set up your academic calendar" },
  { id: 3, name: "Classes", description: "Create your class structure" },
  { id: 4, name: "Fee Structure", description: "Configure fee categories" },
  { id: 5, name: "Complete", description: "Finish setup" },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [academicYearId, setAcademicYearId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/sign-up")
        return
      }

      // Check if user already has a school
      const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single()

      if (profile?.school_id) {
        router.push("/dashboard")
        return
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const progress = (currentStep / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <GraduationCap className="h-16 w-16 text-blue-600" />
          <div className="text-center">
            <h1 className="text-3xl font-bold">Welcome to Schuwap!</h1>
            <p className="text-muted-foreground">Let&apos;s set up your school in a few simple steps</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step.id < currentStep
                      ? "bg-green-600 text-white"
                      : step.id === currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step.id < currentStep ? <CheckCircle className="h-6 w-6" /> : step.id}
                </div>
                <span className="text-xs mt-2 text-center hidden md:block">{step.name}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].name}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && <SchoolInfoStep onNext={handleNext} onSchoolCreated={setSchoolId} />}
            {currentStep === 2 && (
              <AcademicYearStep
                schoolId={schoolId!}
                onNext={handleNext}
                onBack={handleBack}
                onAcademicYearCreated={setAcademicYearId}
              />
            )}
            {currentStep === 3 && (
              <ClassesStep
                schoolId={schoolId!}
                academicYearId={academicYearId!}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 4 && (
              <FeeStructureStep
                schoolId={schoolId!}
                academicYearId={academicYearId!}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 5 && <CompletionStep schoolId={schoolId!} />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
