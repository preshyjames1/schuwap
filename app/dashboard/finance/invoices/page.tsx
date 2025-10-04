import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search } from "lucide-react"
import Link from "next/link"

async function getInvoices(schoolId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("invoices")
    .select(`
      *,
      students:student_id (
        first_name,
        last_name,
        admission_number
      )
    `)
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(50)

  return data || []
}

export default async function InvoicesPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("school_id").eq("id", user.id).single()

  if (!profile?.school_id) return null

  const invoices = await getInvoices(profile.school_id)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      partial: "secondary",
      pending: "outline",
      overdue: "destructive",
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage student invoices</p>
        </div>
        <Link href="/dashboard/finance/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Generate Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by student name or invoice number..." className="pl-10" />
            </div>
          </div>

          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold">
                        {invoice.students?.first_name} {invoice.students?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Invoice #{invoice.invoice_number} • {invoice.students?.admission_number}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-semibold">₦{invoice.total_amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Paid: ₦{invoice.amount_paid.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2">{getStatusBadge(invoice.status)}</div>

                  <Link href={`/dashboard/finance/invoices/${invoice.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {invoices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No invoices found</p>
              <Link href="/dashboard/finance/invoices/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate First Invoice
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
