import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

async function getFeeStructures(schoolId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("fee_structures")
    .select(`
      *,
      classes:class_id (
        name,
        level
      ),
      academic_years:academic_year_id (
        year_name
      )
    `)
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })

  return data || []
}

export default async function FeesPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("school_id").eq("id", user.id).single()

  if (!profile?.school_id) return null

  const feeStructures = await getFeeStructures(profile.school_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fee Structures</h1>
          <p className="text-muted-foreground">Manage school fee templates</p>
        </div>
        <Link href="/dashboard/finance/fees/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Fee Structure
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {feeStructures.map((fee) => (
          <Card key={fee.id}>
            <CardHeader>
              <CardTitle>{fee.fee_name}</CardTitle>
              <CardDescription>
                {fee.classes?.name} - {fee.academic_years?.year_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-semibold">₦{fee.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <span className="capitalize">{fee.fee_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Frequency:</span>
                  <span className="capitalize">{fee.frequency}</span>
                </div>
                {fee.due_date && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Due Date:</span>
                    <span>{new Date(fee.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={`/dashboard/finance/fees/${fee.id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Edit
                  </Button>
                </Link>
                <Button variant="outline" className="flex-1 bg-transparent">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {feeStructures.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No fee structures found</p>
            <Link href="/dashboard/finance/fees/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Fee Structure
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
