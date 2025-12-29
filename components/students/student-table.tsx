"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  KeyRound,
  Loader2,
} from "lucide-react"
import {
  deleteStudentAction,
  resetStudentPasswordAction,
} from "@/app/actions/student"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
// Correct import (only one)
import { useToast } from "@/components/ui/use-toast"

interface StudentTableProps {
  students: any[] // Replace with your Student type
}

export function StudentTable({ students }: StudentTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Handle Delete
  const handleDelete = async () => {
    if (!deleteId) return

    setIsLoading(true)
    try {
      const result = await deleteStudentAction(deleteId)

      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
      } else {
        toast({
          title: "Success",
          description: "Student deleted successfully.",
        })
        router.refresh()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete student.",
      })
    } finally {
      setIsLoading(false)
      setDeleteId(null)
    }
  }

  // Handle Password Reset
  const handleResetPassword = async (id: string, name: string) => {
    // Optional: You could add a confirmation dialog for this too
    const confirmReset = window.confirm(
      `Are you sure you want to reset the password for ${name}?`
    )
    if (!confirmReset) return

    try {
      const result = await resetStudentPasswordAction(id)

      if (result?.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
      } else {
        toast({
          title: "Success",
          description: `Password for ${name} has been reset.`,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset password.",
      })
    }
  }

  if (!students.length) {
    return (
      <div className="text-center p-8 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">No students found.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Admission No</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={student.image_url} />
                      <AvatarFallback>
                        {student.first_name[0]}
                        {student.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {student.first_name} {student.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {student.email || "No email"}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{student.admission_number}</TableCell>
                <TableCell>{student.class?.name || "N/A"}</TableCell>
                <TableCell className="capitalize">{student.gender}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      student.status === "active"
                        ? "default"
                        : student.status === "suspended"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/dashboard/students/${student.id}`)
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/dashboard/students/${student.id}/edit`)
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit Student
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleResetPassword(
                            student.id,
                            `${student.first_name} ${student.last_name}`
                          )
                        }
                      >
                        <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeleteId(student.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Student
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student record and remove their login access.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}