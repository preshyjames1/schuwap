'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
import { MoreHorizontal, Eye, Pencil, Trash2, KeyRound, Loader2 } from "lucide-react"
import { deleteStudentAction, resetStudentPasswordAction } from "@/app/actions/student"
import { useToast } from "@/hooks/use-toast"
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

interface StudentTableProps {
  students: any[]
}

export function StudentTable({ students }: StudentTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // State for Delete Dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Handlers
  const handleRowClick = (id: string) => {
    router.push(`/dashboard/students/${id}`)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setLoadingId(deleteId)
    const result = await deleteStudentAction(deleteId)
    setLoadingId(null)
    setDeleteId(null)

    if (result.success) {
      toast({ title: "Deleted", description: result.message })
      router.refresh()
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error })
    }
  }

  const handleResetPassword = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    setLoadingId(id)
    const result = await resetStudentPasswordAction(id)
    setLoadingId(null)

    if (result.success) {
      toast({ title: "Success", description: result.message || result.warning })
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error })
    }
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                   No students found.
                 </TableCell>
               </TableRow>
            ) : (
              students.map((student) => (
                <TableRow 
                  key={student.id}
                  // 1. MAKE ROW CLICKABLE
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRowClick(student.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={student.image_url} />
                        <AvatarFallback>{student.first_name[0]}{student.last_name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{student.first_name} {student.last_name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{student.admission_number}</TableCell>
                  <TableCell>{student.class?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Stop Propagation on Dropdown to prevent triggering row click */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={loadingId === student.id}>
                            {loadingId === student.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          
                          {/* VIEW */}
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/students/${student.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Profile
                          </DropdownMenuItem>
                          
                          {/* EDIT */}
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/students/${student.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>

                          {/* RESET PASSWORD */}
                          <DropdownMenuItem onClick={(e) => handleResetPassword(student.id, e)}>
                            <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {/* DELETE */}
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setDeleteId(student.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student record and remove their login access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}