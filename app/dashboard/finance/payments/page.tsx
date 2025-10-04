import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search } from "lucide-react"
import Link from "next/link"

async function getPayments(schoolId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      invoices:invoice_id (
        invoice_number,
        students:student_id (
          first_name,
          last_name,
          admission_number
        )
      )
    `)
    .eq("school_id", schoolId)
    .order("payment_date", { ascending: false })
    .limit(50)

  return data || []
}

export default async function PaymentsPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("school_id").eq("id", user.id).single()

  if (!profile?.school_id) return null

  const payments = await getPayments(profile.school_id)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Track and record payments</p>
        </div>
        <Link href="/dashboard/finance/payments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by student name or reference..." className="pl-10" />
            </div>
          </div>

          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold">
                        {payment.invoices?.students?.first_name} {payment.invoices?.students?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Invoice #{payment.invoices?.invoice_number} • {payment.payment_reference}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-semibold">₦{payment.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground capitalize">{payment.payment_method}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm">{new Date(payment.payment_date).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(payment.payment_date).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">{getStatusBadge(payment.status)}</div>

                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {payments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No payments recorded</p>
              <Link href="/dashboard/finance/payments/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record First Payment
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
