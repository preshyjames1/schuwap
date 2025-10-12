import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ParentsPage() {
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

  const { data: parents, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("school_id", profile.school_id)
    .eq("role", "parent")
    .order("created_at", { ascending: false });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Parents</h2>
          <p className="text-muted-foreground">Manage all parents in your school</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/users/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Parent
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parent List</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-red-600">Error loading parents: {error.message}</p>
          ) : parents && parents.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parents.map((parent) => (
                    <TableRow key={parent.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={parent.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {parent.first_name[0]}
                              {parent.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {parent.first_name} {parent.last_name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{parent.email}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(parent.is_active)}>{parent.is_active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/users/${parent.id}`}>View</Link>
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
              <p className="text-muted-foreground mb-4">No parents found</p>
              <Button asChild>
                <Link href="/dashboard/users/new">Add your first parent</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}