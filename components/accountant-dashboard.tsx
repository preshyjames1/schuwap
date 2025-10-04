import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, CreditCard, Receipt } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AccountantDashboardProps {
  stats: {
    totalRevenue: number
    pendingInvoices: number
    overdueInvoices: number
    paymentsToday: number
    totalExpenses: number
    netIncome: number
    collectionRate: number
  }
  profile: {
    first_name: string
    last_name: string
  }
  recentPayments: Array<{
    id: string
    studentName: string
    amount: number
    method: string
    date: string
    reference: string
  }>
  overdueInvoices: Array<{
    id: string
    studentName: string
    amount: number
    dueDate: string
    daysOverdue: number
  }>
}

export function AccountantDashboard({ stats, profile, recentPayments, overdueInvoices }: AccountantDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome, {profile.first_name}!</h2>
        <p className="text-muted-foreground">Financial overview and payment management dashboard.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This term</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.overdueInvoices}</div>
            <p className="text-xs text-muted-foreground">Requires follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.paymentsToday}</div>
            <p className="text-xs text-muted-foreground">Received today</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Net Income</CardTitle>
            <CardDescription>Revenue minus expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">₦{stats.netIncome.toLocaleString()}</div>
              {stats.netIncome > 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
            <CardDescription>School expenditure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₦{stats.totalExpenses.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-2">This term</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Collection Rate</CardTitle>
            <CardDescription>Payment collection efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.collectionRate}%</div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.collectionRate >= 80 ? "Excellent!" : "Needs improvement"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments and Overdue Invoices */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest transactions received</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{payment.studentName}</span>
                      <span className="text-xs text-muted-foreground">
                        {payment.method} • {payment.reference}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">₦{payment.amount.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{payment.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent payments.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue Invoices</CardTitle>
            <CardDescription>Invoices requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            {overdueInvoices.length > 0 ? (
              <div className="space-y-3">
                {overdueInvoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-2 rounded-lg border border-orange-200 bg-orange-50"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{invoice.studentName}</span>
                      <span className="text-xs text-muted-foreground">Due: {invoice.dueDate}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-orange-600">₦{invoice.amount.toLocaleString()}</div>
                      <Badge variant="destructive" className="text-xs">
                        {invoice.daysOverdue} days overdue
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No overdue invoices. Great job!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common financial tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            <a
              href="/dashboard/finance/invoices"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <Receipt className="h-5 w-5" />
              <span className="text-sm font-medium">View Invoices</span>
            </a>
            <a
              href="/dashboard/finance/payments"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <CreditCard className="h-5 w-5" />
              <span className="text-sm font-medium">Record Payment</span>
            </a>
            <a
              href="/dashboard/finance/expenses"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <TrendingDown className="h-5 w-5" />
              <span className="text-sm font-medium">Add Expense</span>
            </a>
            <a
              href="/dashboard/finance/reports"
              className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-sm font-medium">View Reports</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
