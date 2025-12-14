import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { UserForm, type UserType } from "@/components/users/user-form";

function getUserType(role: string): UserType {
  if (role === 'student') return 'students';
  if (role === 'teacher') return 'teachers';
  if (role === 'parent') return 'parents';
  return 'staff'; 
}

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

  const userType = getUserType(userProfile.role);

  return (
    <div className="space-y-6">
      <UserForm 
        schoolId={profile.school_id} 
        userProfile={userProfile} 
        userType={userType}
      />
    </div>
  );
}