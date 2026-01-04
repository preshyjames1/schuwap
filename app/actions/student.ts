'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'

const resend = new Resend(process.env.RESEND_API_KEY)

// ==========================================
// 1. CREATE STUDENT ACTION
// ==========================================
export async function createStudentAction(formData: FormData) {
  const supabaseAdmin = createAdminClient()
  const supabase = await createClient()

  // 1. Verify Admin Session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // 2. Extract Fields
  const schoolId = formData.get('schoolId') as string
  const email = formData.get('email') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const middleName = formData.get('middleName') as string
  const admissionNumber = formData.get('admissionNumber') as string
  const classId = formData.get('classId') as string
  const dob = formData.get('dateOfBirth') as string
  const gender = formData.get('gender') as string
  const bloodGroup = formData.get('bloodGroup') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const status = formData.get('status') as string

  // Validation
  if (!email || !firstName || !lastName || !classId || !admissionNumber) {
    return { error: 'Missing required fields (Email, Name, Class, or Admission Number)' }
  }

  // 3. Generate Temporary Password
  const tempPassword = `Student-${Math.random().toString(36).slice(-8)}`

  // 4. Create User in Supabase Auth
  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      role: 'student',
      first_name: firstName,
      last_name: lastName,
      school_id: schoolId,
    },
  })

  if (createError || !authData.user) {
    return { error: `Auth Creation Failed: ${createError?.message || 'Unknown error'}` }
  }

  const userId = authData.user.id

  // 4.5. Manually Create Profile (Bypassing Triggers)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      role: 'student',
      first_name: firstName,
      last_name: lastName,
      email: email,
      school_id: schoolId,
    })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return { error: `Profile Creation Failed: ${profileError.message}` }
  }

  // 5. Insert into Database
  const { error: dbError } = await supabaseAdmin
    .from('students')
    .insert({
      user_id: userId,
      school_id: schoolId,
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || null,
      email: email,
      admission_number: admissionNumber,
      class_id: classId,
      date_of_birth: dob || null,
      gender: gender,
      blood_group: bloodGroup || null,
      phone: phone || null,
      address: address || null,
      status: status || 'active',
    })

  if (dbError) {
    // Rollback Auth user if DB insert fails
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return { error: `Database Insert Failed: ${dbError.message}` }
  }

  // 6. Send Welcome Email
  const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/student/login`
  try {
    await resend.emails.send({
      from: 'Schuwap <send@schuwap.xyz>',
      to: email,
      subject: 'Welcome to Schuwap - Student Portal Access',
      html: `
        <h1>Welcome, ${firstName}!</h1>
        <p>Your student profile has been created.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
          <p><strong>Login Details:</strong></p>
          <ul>
            <li><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Temporary Password:</strong> ${tempPassword}</li>
          </ul>
        </div>
        <p>Please change your password after your first login.</p>
      `,
    })
  } catch (err) {
    console.error('Email failed:', err)
    return { success: true, warning: 'Student created, but email failed. Password: ' + tempPassword }
  }

  revalidatePath('/dashboard/students')
  return { success: true, message: 'Student created and login credentials sent.' }
}


// ==========================================
// 2. UPDATE STUDENT ACTION
// ==========================================
export async function updateStudentAction(formData: FormData, studentId: string) {
  const supabaseAdmin = createAdminClient()
  const supabase = await createClient()

  // 1. Verify Admin Session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // 2. Extract Fields
  // Note: We don't update schoolId typically as that shouldn't change
  const email = formData.get('email') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const middleName = formData.get('middleName') as string
  const admissionNumber = formData.get('admissionNumber') as string
  const classId = formData.get('classId') as string
  const dob = formData.get('dateOfBirth') as string
  const gender = formData.get('gender') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const status = formData.get('status') as string

  if (!studentId) return { error: "Student ID is missing" }

  // 3. Get the linked Auth User ID first
  const { data: studentData, error: fetchError } = await supabaseAdmin
    .from('students')
    .select('user_id')
    .eq('id', studentId)
    .single()

  if (fetchError || !studentData) {
    return { error: "Could not find student record to update" }
  }

  const authUserId = studentData.user_id

  // 4. Update Auth Email (Only if it exists and changed)
  if (authUserId && email) {
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      { email: email, email_confirm: true }
    )
    if (authUpdateError) {
      console.error("Auth update failed:", authUpdateError)
    }
  }

  // 5. Update Profile (Syncing changes to public.profiles)
  if (authUserId) {
    await supabaseAdmin
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        email: email
      })
      .eq('id', authUserId)
  }

  // 6. Update Student Database Record
  const { error: dbError } = await supabaseAdmin
    .from('students')
    .update({
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || null,
      email: email,
      admission_number: admissionNumber,
      class_id: classId,
      date_of_birth: dob || null,
      gender: gender,
      phone: phone || null,
      address: address || null,
      status: status,
    })
    .eq('id', studentId)

  if (dbError) {
    return { error: `Update Failed: ${dbError.message}` }
  }

  revalidatePath('/dashboard/students')
  revalidatePath(`/dashboard/students/${studentId}`)
  
  return { success: true, message: 'Student updated successfully' }
}

// ==========================================
// 2. DELETE STUDENT ACTION
// ==========================================

export async function deleteStudentAction(studentId: string) {
  const supabaseAdmin = createAdminClient()
  const supabase = await createClient()

  // 1. Verify Admin Session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  if (!studentId) return { error: "Student ID is missing" }

  // 2. Get the linked Auth User ID first
  // We need this to delete their login account later
  const { data: studentData, error: fetchError } = await supabaseAdmin
    .from('students')
    .select('user_id')
    .eq('id', studentId)
    .single()

  if (fetchError) {
    return { error: "Could not find student record to delete" }
  }

  const authUserId = studentData.user_id

  // 3. Delete Student from Database
  // We delete the student record first.
  const { error: dbError } = await supabaseAdmin
    .from('students')
    .delete()
    .eq('id', studentId)

  if (dbError) {
    return { error: `Database Delete Failed: ${dbError.message}` }
  }

  // 4. Delete User from Auth System (and Profile)
  // This removes their login access and cleans up the 'auth.users' table
  if (authUserId) {
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(authUserId)
    
    if (authDeleteError) {
      console.error("Auth delete failed:", authDeleteError)
      // We return success because the student record is already gone, 
      // but we log this so you know there's an orphaned auth user.
      return { success: true, message: 'Student deleted, but Auth account removal failed.' }
    }
  }

  revalidatePath('/dashboard/students')
  return { success: true, message: 'Student deleted successfully' }
}


// ==========================================
// 2. RESET PASSWORD STUDENT ACTION
// ==========================================

export async function resetStudentPasswordAction(studentId: string) {
  const supabaseAdmin = createAdminClient()
  const supabase = await createClient()

  // 1. Verify Admin Session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Unauthorized' }

  // 2. Get Student Data
  const { data: student, error: fetchError } = await supabaseAdmin
    .from('students')
    .select('user_id, email, first_name')
    .eq('id', studentId)
    .single()

  if (fetchError || !student || !student.user_id) {
    return { error: "Student record or linked account not found." }
  }

  // 3. Generate New Password
  const newPassword = `Reset-${Math.random().toString(36).slice(-8)}`

  // 4. Update Auth User
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    student.user_id,
    { password: newPassword }
  )

  if (updateError) {
    return { error: `Password update failed: ${updateError.message}` }
  }

  // 5. Send Email
  try {
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/student/login`
    await resend.emails.send({
      from: 'Schuwap <send@schuwap.xyz>',
      to: student.email,
      subject: 'Password Reset - Schuwap',
      html: `
        <h1>Password Reset</h1>
        <p>Hello ${student.first_name},</p>
        <p>Your password has been reset by the school administrator.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
          <p><strong>New Login Details:</strong></p>
          <ul>
            <li><strong>URL:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
            <li><strong>Email:</strong> ${student.email}</li>
            <li><strong>New Password:</strong> ${newPassword}</li>
          </ul>
        </div>
        <p>Please change this password after logging in.</p>
      `,
    })
  } catch (err) {
    console.error('Email failed:', err)
    return { success: true, warning: `Password reset to: ${newPassword} (Email failed to send)` }
  }

  return { success: true, message: 'Password reset and emailed to student.' }
}


// --- Bulk Actions ---

export async function bulkPromoteStudents(studentIds: string[], newClassId: string) {
  try {
    const supabase = createClient()
    
    const { error } = await (await supabase)
      .from('student_profiles')
      .update({ class_id: newClassId })
      .in('id', studentIds)

    if (error) throw error

    revalidatePath('/dashboard/students')
    return { success: true, message: 'Students promoted successfully' }
  } catch (error) {
    console.error('Error promoting students:', error)
    return { success: false, error: 'Failed to promote students' }
  }
}

export async function bulkDeleteStudents(studentIds: string[]) {
  try {
    const supabase = createAdminClient() // Use Admin client for deletions to bypass some restrictions if needed
    
    // Delete from auth.users (this usually cascades to profiles if set up, 
    // but if not, delete from profiles first)
    
    // 1. Delete from public.student_profiles
    const { error: profileError } = await supabase
      .from('student_profiles')
      .delete()
      .in('id', studentIds)

    if (profileError) throw profileError

    // Note: If your system links profiles to Auth Users, you might need to delete the Auth Users too.
    // For now, we will focus on the profile deletion.

    revalidatePath('/dashboard/students')
    return { success: true, message: 'Students deleted successfully' }
  } catch (error) {
    console.error('Error deleting students:', error)
    return { success: false, error: 'Failed to delete students' }
  }
}

export async function bulkResetPasswords(studentIds: string[]) {
  try {
    const supabase = createAdminClient()
    
    // For security, usually we trigger a password reset email. 
    // However, for admin dashboards, often we set a temporary default password.
    // Here is an example of setting a default password "Student@123".
    
    // We need the User IDs (Auth IDs), not just Profile IDs. 
    // Assuming student_profiles.id is the same as auth.users.id (common pattern):
    
    const updates = studentIds.map(id => 
      supabase.auth.admin.updateUserById(id, { password: 'Student@123' })
    )
    
    await Promise.all(updates)

    revalidatePath('/dashboard/students')
    return { success: true, message: 'Passwords reset to "Student@123"' }
  } catch (error) {
    console.error('Error resetting passwords:', error)
    return { success: false, error: 'Failed to reset passwords' }
  }
}

//hhs