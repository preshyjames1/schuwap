import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserForm, type UserRole, type UserType } from "@/components/users/user-form";

// Helper to determine the dashboard section based on role
function getUserType(role: string): UserType {
  if (role === 'student') return 'students';
  if (role === 'teacher') return 'teachers';
  if (role === 'parent') return 'parents';
  return 'staff'; // Covers receptionist, accountant, librarian
}

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
  const userType = getUserType(role);

  return (
    <div className="space-y-6">
      <UserForm 
        schoolId={profile.school_id} 
        userType={userType} 
        defaultRole={role} 
      />
    </div>
  );
}