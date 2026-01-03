BEGIN;

-- ==========================================
-- 1. TABLE: schools
-- ==========================================
DROP POLICY "Allow authenticated users to insert schools" ON schools;
DROP POLICY "Authenticated users can create a school" ON schools;
DROP POLICY "Users can view schools" ON schools;

CREATE POLICY "Allow authenticated users to insert schools" 
ON schools FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can create a school" 
ON schools FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "Users can view schools" 
ON schools FOR SELECT USING ((SELECT auth.role()) = 'authenticated');


-- ==========================================
-- 2. TABLE: profiles
-- ==========================================
DROP POLICY "Users can view profiles in their school" ON profiles;
DROP POLICY "Users can insert their own profile" ON profiles;
DROP POLICY "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view profiles in their school" 
ON profiles FOR SELECT USING (
  school_id = get_user_school_id() OR id = (SELECT auth.uid())
);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (id = (SELECT auth.uid()));


-- ==========================================
-- 3. TABLE: messages
-- ==========================================
DROP POLICY "Users can view their own messages" ON messages;
DROP POLICY "Users can send messages in their school" ON messages;
DROP POLICY "Users can update their sent messages" ON messages;

CREATE POLICY "Users can view their own messages" 
ON messages FOR SELECT USING (
  school_id = get_user_school_id() AND (sender_id = (SELECT auth.uid()) OR recipient_id = (SELECT auth.uid()))
);

CREATE POLICY "Users can send messages in their school" 
ON messages FOR INSERT WITH CHECK (
  school_id = get_user_school_id() AND sender_id = (SELECT auth.uid())
);

CREATE POLICY "Users can update their sent messages" 
ON messages FOR UPDATE USING (sender_id = (SELECT auth.uid()));


-- ==========================================
-- 4. CONSOLIDATING MULTIPLE SELECT POLICIES
-- Fixes "Multiple Permissive Policies" linter warning
-- ==========================================

-- ACADEMIC YEARS
DROP POLICY "Admins can manage academic years" ON academic_years;
DROP POLICY "Users can view academic years in their school" ON academic_years;

CREATE POLICY "Manage or view academic years" 
ON academic_years FOR ALL USING (
  school_id = get_user_school_id()
);

-- ASSESSMENTS
DROP POLICY "Teachers can manage assessments" ON assessments;
DROP POLICY "Users can view assessments in their school" ON assessments;

CREATE POLICY "Manage or view assessments" 
ON assessments FOR ALL USING (
  school_id = get_user_school_id() AND (
    has_any_role(ARRAY['super_admin'::text, 'school_admin'::text, 'teacher'::text])
    OR (SELECT auth.role()) = 'authenticated'
  )
);

-- ANNOUNCEMENTS
DROP POLICY "Admins can manage announcements" ON announcements;
DROP POLICY "Users can view published announcements in their school" ON announcements;

CREATE POLICY "Manage or view announcements" 
ON announcements FOR ALL USING (
  school_id = get_user_school_id() AND (
    has_any_role(ARRAY['super_admin'::text, 'school_admin'::text])
    OR is_published = true
  )
);

COMMIT;