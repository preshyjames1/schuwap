import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { ArrowLeft, Edit, Mail, Phone } from "lucide-react";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }
    
  const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single();

  if (!profile?.school_id) {
    redirect("/onboarding");
  }

  const { data: userProfile, error } = await supabase
    .from("profiles")
    .select("*, teachers(*)")
    .eq("id", id)
    .eq("school_id", profile.school_id)
    .single();

  if (error || !userProfile) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/dashboard/${userProfile.role}s`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">User Profile</h2>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/users/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userProfile.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-2xl">
                {userProfile.first_name[0]}
                {userProfile.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold">
                  {userProfile.first_name} {userProfile.last_name}
                </h3>
                <p className="text-muted-foreground capitalize">{userProfile.role.replace("_", " ")}</p>
              </div>
               <div className="space-y-3">
                {userProfile.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{userProfile.email}</span>
                  </div>
                )}
                {userProfile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{userProfile.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {userProfile.role === 'teacher' && userProfile.teachers && userProfile.teachers.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Teacher Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                 <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-muted-foreground">Employee ID:</span>
                  <span className="text-sm font-medium">{userProfile.teachers[0].employee_id}</span>
                </div>
                 <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-muted-foreground">Qualification:</span>
                  <span className="text-sm font-medium">{userProfile.teachers[0].qualification}</span>
                </div>
                 <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-muted-foreground">Specialization:</span>
                  <span className="text-sm font-medium">{userProfile.teachers[0].specialization}</span>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}