import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, FileText, AlertCircle, TrendingUp } from "lucide-react"
import Link from "next/link"

async function getFinancialStats(schoolId: string) {
  const supabase = await createServerClient()

  const [invoicesResult, paymentsResult, outstandingResult] = await Promise.all([
    supabase.from("invoices").select("total_amount").eq("school_id", schoolId),
    supabase.from("payments").select("amount").eq("school_id", schoolId).eq("status", "completed"),
    supabase.from("invoices").select("total_amount, amount_paid").eq("school_id", schoolId).neq("status", "paid"),
  ])

  const totalInvoiced = invoicesResult.data?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
  const totalPaid = paymentsResult.data?.reduce((sum, pay) => sum + (pay.amount || 0), 0) || 0
  const totalOutstanding =
    outstandingResult.data?.reduce((sum, inv) => sum + ((inv.total_amount || 0) - (inv.amount_paid || 0)), 0) || 0

  return {
    totalInvoiced,
    totalPaid,
    totalOutstanding,
    collectionRate: totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0,
  }
}

export default async function FinancePage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("school_id").eq("id", user.id).single()

  if (!profile?.school_id) return null

  const stats = await getFinancialStats(profile.school_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Management</h1>
          <p className="text-muted-foreground">Manage fees, invoices, and payments</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalInvoiced.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Pending payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.collectionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Payment efficiency</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Fee Structures</CardTitle>
            <CardDescription>Manage school fee templates</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/finance/fees">
              <Button className="w-full">Manage Fees</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Generate and manage invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/finance/invoices">
              <Button className="w-full">View Invoices</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <CardDescription>Record and track payments</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/finance/payments">
              <Button className="w-full">View Payments</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
