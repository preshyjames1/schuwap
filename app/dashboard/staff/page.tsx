import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function StaffPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase.from("profiles").select("school_id, role").eq("id", user.id).single();

  if (!profile?.school_id || !["super_admin", "school_admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const { data: staff, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("school_id", profile.school_id)
    .in("role", ["accountant", "librarian", "nurse"])
    .order("created_at", { ascending: false });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Staff</h2>
          <p className="text-muted-foreground">Manage all staff in your school</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/users/new?role=staff">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff List</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-red-600">Error loading staff: {error.message}</p>
          ) : staff && staff.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((staffMember) => (
                    <TableRow key={staffMember.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={staffMember.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {staffMember.first_name[0]}
                              {staffMember.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {staffMember.first_name} {staffMember.last_name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{staffMember.role.replace("_", " ")}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(staffMember.is_active)}>{staffMember.is_active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/users/${staffMember.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No staff found</p>
              <Button asChild>
                <Link href="/dashboard/users/new">Add your first staff member</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}