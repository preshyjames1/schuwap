import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GenerateInvoiceForm } from "@/components/finance/generate-invoice-form"

export default async function NewInvoicePage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("school_id").eq("id", user.id).single()

  if (!profile?.school_id) return null

  // Get students
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, admission_number")
    .eq("school_id", profile.school_id)
    .eq("status", "active")
    .order("first_name")

  // Get fee structures
  const { data: feeStructures } = await supabase.from("fee_structures").select("*").eq("school_id", profile.school_id)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Generate Invoice</h1>
        <p className="text-muted-foreground">Create a new invoice for a student</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>Fill in the details to generate an invoice</CardDescription>
        </CardHeader>
        <CardContent>
          <GenerateInvoiceForm
            students={students || []}
            feeStructures={feeStructures || []}
            schoolId={profile.school_id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
