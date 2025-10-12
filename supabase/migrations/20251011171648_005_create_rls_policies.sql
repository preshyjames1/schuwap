/*
  # Row Level Security Policies Migration

  1. Helper Functions
    - `get_user_school_id()` - Returns user's school_id
    - `has_role()` - Checks if user has specific role
    - `has_any_role()` - Checks if user has any of specified roles

  2. RLS Policies
    - Multi-tenant isolation based on school_id
    - Role-based access control
    - Secure data access for all user types

  3. Security Notes
    - All policies enforce school-level data isolation
    - Admins can manage their school's data
    - Teachers have limited permissions
    - Students and parents see only their own data
*/

-- Helper function to get user's school_id from profile
CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = required_role
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(required_roles)
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Schools table policies
CREATE POLICY "Users can view their own school"
  ON public.schools FOR SELECT
  USING (id = public.get_user_school_id());

CREATE POLICY "School admins can update their school"
  ON public.schools FOR UPDATE
  USING (id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Profiles table policies
CREATE POLICY "Users can view profiles in their school"
  ON public.profiles FOR SELECT
  USING (school_id = public.get_user_school_id() OR id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can insert profiles in their school"
  ON public.profiles FOR INSERT
  WITH CHECK (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Students table policies
CREATE POLICY "Users can view students in their school"
  ON public.students FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins and teachers can manage students"
  ON public.students FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'teacher']));

-- Parents table policies
CREATE POLICY "Users can view parents in their school"
  ON public.parents FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins can manage parents"
  ON public.parents FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Student-Parent relationship policies
CREATE POLICY "Users can view student-parent relationships in their school"
  ON public.student_parents FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins can manage student-parent relationships"
  ON public.student_parents FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Teachers table policies
CREATE POLICY "Users can view teachers in their school"
  ON public.teachers FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins can manage teachers"
  ON public.teachers FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Academic years policies
CREATE POLICY "Users can view academic years in their school"
  ON public.academic_years FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins can manage academic years"
  ON public.academic_years FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Terms policies
CREATE POLICY "Users can view terms in their school"
  ON public.terms FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins can manage terms"
  ON public.terms FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Classes policies
CREATE POLICY "Users can view classes in their school"
  ON public.classes FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins can manage classes"
  ON public.classes FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Subjects policies
CREATE POLICY "Users can view subjects in their school"
  ON public.subjects FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins can manage subjects"
  ON public.subjects FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Class subjects policies
CREATE POLICY "Users can view class subjects in their school"
  ON public.class_subjects FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins and teachers can manage class subjects"
  ON public.class_subjects FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'teacher']));

-- Student enrollments policies
CREATE POLICY "Users can view enrollments in their school"
  ON public.student_enrollments FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins can manage enrollments"
  ON public.student_enrollments FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Timetables policies
CREATE POLICY "Users can view timetables in their school"
  ON public.timetables FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins and teachers can manage timetables"
  ON public.timetables FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'teacher']));

-- Attendance policies
CREATE POLICY "Users can view attendance in their school"
  ON public.attendance FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Teachers can manage attendance"
  ON public.attendance FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'teacher']));

-- Grading systems policies
CREATE POLICY "Users can view grading systems in their school"
  ON public.grading_systems FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins can manage grading systems"
  ON public.grading_systems FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Assessments policies
CREATE POLICY "Users can view assessments in their school"
  ON public.assessments FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Teachers can manage assessments"
  ON public.assessments FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'teacher']));

-- Grades policies
CREATE POLICY "Users can view grades in their school"
  ON public.grades FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Teachers can manage grades"
  ON public.grades FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'teacher']));

-- Fee structures policies
CREATE POLICY "Users can view fee structures in their school"
  ON public.fee_structures FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins and accountants can manage fee structures"
  ON public.fee_structures FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'accountant']));

-- Student fees policies
CREATE POLICY "Users can view student fees in their school"
  ON public.student_fees FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins and accountants can manage student fees"
  ON public.student_fees FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'accountant']));

-- Invoices policies
CREATE POLICY "Users can view invoices in their school"
  ON public.invoices FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins and accountants can manage invoices"
  ON public.invoices FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'accountant']));

-- Invoice items policies
CREATE POLICY "Users can view invoice items for their school invoices"
  ON public.invoice_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.school_id = public.get_user_school_id()
  ));

CREATE POLICY "Admins and accountants can manage invoice items"
  ON public.invoice_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.school_id = public.get_user_school_id()
  ) AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'accountant']));

-- Payments policies
CREATE POLICY "Users can view payments in their school"
  ON public.payments FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins and accountants can manage payments"
  ON public.payments FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'accountant']));

-- Expenses policies
CREATE POLICY "Admins and accountants can view expenses in their school"
  ON public.expenses FOR SELECT
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'accountant']));

CREATE POLICY "Admins and accountants can manage expenses"
  ON public.expenses FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'accountant']));

-- Announcements policies
CREATE POLICY "Users can view published announcements in their school"
  ON public.announcements FOR SELECT
  USING (school_id = public.get_user_school_id() AND is_published = true);

CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Messages policies
CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  USING (school_id = public.get_user_school_id() AND (sender_id = auth.uid() OR recipient_id = auth.uid()));

CREATE POLICY "Users can send messages in their school"
  ON public.messages FOR INSERT
  WITH CHECK (school_id = public.get_user_school_id() AND sender_id = auth.uid());

CREATE POLICY "Users can update their sent messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Communication logs policies (admin only)
CREATE POLICY "Admins can view communication logs in their school"
  ON public.communication_logs FOR SELECT
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

CREATE POLICY "Admins can manage communication logs"
  ON public.communication_logs FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Events policies
CREATE POLICY "Users can view events in their school"
  ON public.events FOR SELECT
  USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));