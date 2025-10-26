import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserForm } from "@/components/users/user-form";
import type { UserRole } from "@/lib/types/database";

export default async function NewUserPage({ searchParams }: { searchParams: { role: UserRole }}) {
  const supabase = await createClient();

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

  const role = searchParams.role || "teacher";

  const { data: classes } = await supabase.from("classes").select("id, name").eq("school_id", profile.school_id);

  const { data: subjects } = await supabase.from("subjects").select("id, name").eq("school_id", profile.school_id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Add New {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
        <p className="text-muted-foreground">Enter the user's information to create a new record</p>
      </div>

      <UserForm schoolId={profile.school_id} role={role} classes={classes || []} subjects={subjects || []} />
    </div>
  );
}