"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

const paymentSchema = z.object({
  invoice_id: z.string().min(1, "Invoice is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  payment_method: z.enum(["cash", "bank_transfer", "card", "mobile_money", "cheque"]),
  payment_reference: z.string().min(1, "Payment reference is required"),
  payment_date: z.string().min(1, "Payment date is required"),
  notes: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface RecordPaymentFormProps {
  invoices: Array<{
    id: string
    invoice_number: string
    total_amount: number
    amount_paid: number
    students: {
      first_name: string
      last_name: string
      admission_number: string
    }
  }>
  schoolId: string
}

export function RecordPaymentForm({ invoices, schoolId }: RecordPaymentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<(typeof invoices)[0] | null>(null)

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice_id: "",
      amount: 0,
      payment_method: "cash",
      payment_reference: `PAY-${Date.now()}`,
      payment_date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  })

  const onInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId)
    if (invoice) {
      setSelectedInvoice(invoice)
      const balance = invoice.total_amount - invoice.amount_paid
      form.setValue("amount", balance)
    }
  }

  async function onSubmit(data: PaymentFormData) {
    setIsLoading(true)
    const supabase = createBrowserClient()

    try {
      // Record payment
      const { error: paymentError } = await supabase.from("payments").insert({
        school_id: schoolId,
        invoice_id: data.invoice_id,
        amount: data.amount,
        payment_method: data.payment_method,
        payment_reference: data.payment_reference,
        payment_date: data.payment_date,
        status: "completed",
        notes: data.notes,
      })

      if (paymentError) throw paymentError

      // Update invoice
      if (selectedInvoice) {
        const newAmountPaid = selectedInvoice.amount_paid + data.amount
        const newStatus = newAmountPaid >= selectedInvoice.total_amount ? "paid" : "partial"

        const { error: invoiceError } = await supabase
          .from("invoices")
          .update({
            amount_paid: newAmountPaid,
            status: newStatus,
          })
          .eq("id", data.invoice_id)

        if (invoiceError) throw invoiceError
      }

      router.push("/dashboard/finance/payments")
      router.refresh()
    } catch (error) {
      console.error("Error recording payment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="invoice_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value)
                  onInvoiceChange(value)
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {invoices.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - {invoice.students.first_name} {invoice.students.last_name}
                      (Balance: ₦{(invoice.total_amount - invoice.amount_paid).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedInvoice && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Amount:</span>
              <span className="font-semibold">₦{selectedInvoice.total_amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Amount Paid:</span>
              <span className="font-semibold">₦{selectedInvoice.amount_paid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-semibold">Balance:</span>
              <span className="font-bold text-lg">
                ₦{(selectedInvoice.total_amount - selectedInvoice.amount_paid).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₦)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="payment_reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Reference</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="payment_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
