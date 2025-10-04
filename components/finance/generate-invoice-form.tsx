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
import { Loader2, Plus, X } from "lucide-react"

const invoiceSchema = z.object({
  student_id: z.string().min(1, "Student is required"),
  invoice_number: z.string().min(1, "Invoice number is required"),
  due_date: z.string().min(1, "Due date is required"),
  description: z.string().optional(),
  items: z
    .array(
      z.object({
        fee_structure_id: z.string().optional(),
        description: z.string().min(1, "Description is required"),
        amount: z.number().min(0, "Amount must be positive"),
      }),
    )
    .min(1, "At least one item is required"),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface GenerateInvoiceFormProps {
  students: Array<{ id: string; first_name: string; last_name: string; admission_number: string }>
  feeStructures: Array<{ id: string; fee_name: string; amount: number }>
  schoolId: string
}

export function GenerateInvoiceForm({ students, feeStructures, schoolId }: GenerateInvoiceFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState([{ fee_structure_id: "", description: "", amount: 0 }])

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      student_id: "",
      invoice_number: `INV-${Date.now()}`,
      due_date: "",
      description: "",
      items: [{ fee_structure_id: "", description: "", amount: 0 }],
    },
  })

  const addItem = () => {
    setItems([...items, { fee_structure_id: "", description: "", amount: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const onFeeStructureChange = (index: number, feeId: string) => {
    const fee = feeStructures.find((f) => f.id === feeId)
    if (fee) {
      const newItems = [...items]
      newItems[index] = {
        fee_structure_id: feeId,
        description: fee.fee_name,
        amount: fee.amount,
      }
      setItems(newItems)
      form.setValue(`items.${index}.description`, fee.fee_name)
      form.setValue(`items.${index}.amount`, fee.amount)
    }
  }

  async function onSubmit(data: InvoiceFormData) {
    setIsLoading(true)
    const supabase = createBrowserClient()

    try {
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          school_id: schoolId,
          student_id: data.student_id,
          invoice_number: data.invoice_number,
          total_amount: totalAmount,
          amount_paid: 0,
          due_date: data.due_date,
          status: "pending",
          description: data.description,
        })
        .select()
        .single()

      if (invoiceError) throw invoiceError

      const invoiceItems = items.map((item) => ({
        invoice_id: invoice.id,
        fee_structure_id: item.fee_structure_id || null,
        description: item.description,
        amount: item.amount,
      }))

      const { error: itemsError } = await supabase.from("invoice_items").insert(invoiceItems)

      if (itemsError) throw itemsError

      router.push("/dashboard/finance/invoices")
      router.refresh()
    } catch (error) {
      console.error("Error generating invoice:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="student_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.admission_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="invoice_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Invoice Items</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {items.map((item, index) => (
            <div key={index} className="flex gap-4 items-start p-4 border rounded-lg">
              <div className="flex-1 space-y-4">
                <div>
                  <FormLabel>Fee Structure (Optional)</FormLabel>
                  <Select onValueChange={(value) => onFeeStructureChange(index, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fee structure" />
                    </SelectTrigger>
                    <SelectContent>
                      {feeStructures.map((fee) => (
                        <SelectItem key={fee.id} value={fee.id}>
                          {fee.fee_name} - ₦{fee.amount.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={items[index].description}
                          onChange={(e) => {
                            const newItems = [...items]
                            newItems[index].description = e.target.value
                            setItems(newItems)
                            field.onChange(e)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.amount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={items[index].amount}
                          onChange={(e) => {
                            const newItems = [...items]
                            newItems[index].amount = Number.parseFloat(e.target.value) || 0
                            setItems(newItems)
                            field.onChange(Number.parseFloat(e.target.value) || 0)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {items.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <span className="font-semibold">Total Amount:</span>
            <span className="text-2xl font-bold">
              ₦{items.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Invoice
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
