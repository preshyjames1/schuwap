import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RecordPaymentForm } from "@/components/finance/record-payment-form"

export default async function NewPaymentPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("school_id").eq("id", user.id).single()

  if (!profile?.school_id) return null

  // Get unpaid/partial invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      students:student_id (
        first_name,
        last_name,
        admission_number
      )
    `)
    .eq("school_id", profile.school_id)
    .in("status", ["pending", "partial", "overdue"])
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Record Payment</h1>
        <p className="text-muted-foreground">Record a new payment for an invoice</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Fill in the payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <RecordPaymentForm invoices={invoices || []} schoolId={profile.school_id} />
        </CardContent>
      </Card>
    </div>
  )
}
