import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { UserForm } from "@/components/users/user-form";

export default async function EditUserPage({ params }: { params: { id: string } }) {
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Edit {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}</h2>
        <p className="text-muted-foreground">Update the user's information</p>
      </div>

      <UserForm schoolId={profile.school_id} userProfile={userProfile} role={userProfile.role} />
    </div>
  );
}