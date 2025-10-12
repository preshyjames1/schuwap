-- Row Level Security Policies for multi-tenant isolation

-- Helper function to get user's school_id from profile
CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = ANY(required_roles)
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- =================================================================
-- Schools table policies
-- =================================================================
DROP POLICY IF EXISTS "Users can view schools" ON public.schools;
DROP POLICY IF EXISTS "Authenticated users can create a school" ON public.schools;
DROP POLICY IF EXISTS "School admins can update their school" ON public.schools;
DROP POLICY IF EXISTS "Users can view their own school" ON public.schools; -- remove old policy

CREATE POLICY "Users can view schools"
  ON public.schools FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create a school"
  ON public.schools FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "School admins can update their school"
  ON public.schools FOR UPDATE
  USING (id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- =================================================================
-- Profiles table policies
-- =================================================================
DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles in their school" ON public.profiles;

CREATE POLICY "Users can view profiles in their school"
  ON public.profiles FOR SELECT
  USING (school_id = public.get_user_school_id() OR id = auth.uid());
  
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can insert profiles in their school"
  ON public.profiles FOR INSERT
  WITH CHECK (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- =================================================================
-- Students table policies
-- =================================================================
DROP POLICY IF EXISTS "Users can view students in their school" ON public.students;
DROP POLICY IF EXISTS "Admins and teachers can manage students" ON public.students;

CREATE POLICY "Users can view students in their school"
  ON public.students FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins and teachers can manage students"
  ON public.students FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'teacher']));

-- =================================================================
-- Parents table policies
-- =================================================================
DROP POLICY IF EXISTS "Users can view parents in their school" ON public.parents;
DROP POLICY IF EXISTS "Admins can manage parents" ON public.parents;

CREATE POLICY "Users can view parents in their school"
  ON public.parents FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins can manage parents"
  ON public.parents FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- =================================================================
-- Student-Parent relationship policies
-- =================================================================
DROP POLICY IF EXISTS "Users can view student-parent relationships in their school" ON public.student_parents;
DROP POLICY IF EXISTS "Admins can manage student-parent relationships" ON public.student_parents;

CREATE POLICY "Users can view student-parent relationships in their school"
  ON public.student_parents FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins can manage student-parent relationships"
  ON public.student_parents FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- =================================================================
-- Teachers table policies
-- =================================================================
DROP POLICY IF EXISTS "Users can view teachers in their school" ON public.teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;

CREATE POLICY "Users can view teachers in their school"
  ON public.teachers FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins can manage teachers"
  ON public.teachers FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- =================================================================
-- Academic years policies
-- =================================================================
DROP POLICY IF EXISTS "Users can view academic years in their school" ON public.academic_years;
DROP POLICY IF EXISTS "Admins can manage academic years" ON public.academic_years;

CREATE POLICY "Users can view academic years in their school"
  ON public.academic_years FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins can manage academic years"
  ON public.academic_years FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- =================================================================
-- Terms policies
-- =================================================================
DROP POLICY IF EXISTS "Users can view terms in their school" ON public.terms;
DROP POLICY IF EXISTS "Admins can manage terms" ON public.terms;

CREATE POLICY "Users can view terms in their school"
  ON public.terms FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins can manage terms"
  ON public.terms FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- =================================================================
-- Classes policies
-- =================================================================
DROP POLICY IF EXISTS "Users can view classes in their school" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;

CREATE POLICY "Users can view classes in their school"
  ON public.classes FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins can manage classes"
  ON public.classes FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- =================================================================
-- Subjects policies
-- =================================================================
DROP POLICY IF EXISTS "Users can view subjects in their school" ON public.subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;

CREATE POLICY "Users can view subjects in their school"
  ON public.subjects FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins can manage subjects"
  ON public.subjects FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- =================================================================
-- And so on for all your other tables...
-- (I will add the rest for completeness)
-- =================================================================

-- Class subjects policies
DROP POLICY IF EXISTS "Users can view class subjects in their school" ON public.class_subjects;
DROP POLICY IF EXISTS "Admins and teachers can manage class subjects" ON public.class_subjects;

CREATE POLICY "Users can view class subjects in their school"
  ON public.class_subjects FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins and teachers can manage class subjects"
  ON public.class_subjects FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'teacher']));

-- Student enrollments policies
DROP POLICY IF EXISTS "Users can view enrollments in their school" ON public.student_enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.student_enrollments;

CREATE POLICY "Users can view enrollments in their school"
  ON public.student_enrollments FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins can manage enrollments"
  ON public.student_enrollments FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Timetables policies
DROP POLICY IF EXISTS "Users can view timetables in their school" ON public.timetables;
DROP POLICY IF EXISTS "Admins and teachers can manage timetables" ON public.timetables;

CREATE POLICY "Users can view timetables in their school"
  ON public.timetables FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins and teachers can manage timetables"
  ON public.timetables FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'teacher']));

-- Attendance policies
DROP POLICY IF EXISTS "Users can view attendance in their school" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance;

CREATE POLICY "Users can view attendance in their school"
  ON public.attendance FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Teachers can manage attendance"
  ON public.attendance FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'teacher']));

-- Grading systems policies
DROP POLICY IF EXISTS "Users can view grading systems in their school" ON public.grading_systems;
DROP POLICY IF EXISTS "Admins can manage grading systems" ON public.grading_systems;

CREATE POLICY "Users can view grading systems in their school"
  ON public.grading_systems FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins can manage grading systems"
  ON public.grading_systems FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Assessments policies
DROP POLICY IF EXISTS "Users can view assessments in their school" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can manage assessments" ON public.assessments;

CREATE POLICY "Users can view assessments in their school"
  ON public.assessments FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Teachers can manage assessments"
  ON public.assessments FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'teacher']));

-- Grades policies
DROP POLICY IF EXISTS "Users can view grades in their school" ON public.grades;
DROP POLICY IF EXISTS "Teachers can manage grades" ON public.grades;

CREATE POLICY "Users can view grades in their school"
  ON public.grades FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Teachers can manage grades"
  ON public.grades FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'teacher']));

-- Fee structures policies
DROP POLICY IF EXISTS "Users can view fee structures in their school" ON public.fee_structures;
DROP POLICY IF EXISTS "Admins and accountants can manage fee structures" ON public.fee_structures;

CREATE POLICY "Users can view fee structures in their school"
  ON public.fee_structures FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins and accountants can manage fee structures"
  ON public.fee_structures FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'accountant']));

-- Student fees policies
DROP POLICY IF EXISTS "Users can view student fees in their school" ON public.student_fees;
DROP POLICY IF EXISTS "Admins and accountants can manage student fees" ON public.student_fees;

CREATE POLICY "Users can view student fees in their school"
  ON public.student_fees FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins and accountants can manage student fees"
  ON public.student_fees FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'accountant']));

-- Invoices policies
DROP POLICY IF EXISTS "Users can view invoices in their school" ON public.invoices;
DROP POLICY IF EXISTS "Admins and accountants can manage invoices" ON public.invoices;

CREATE POLICY "Users can view invoices in their school"
  ON public.invoices FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins and accountants can manage invoices"
  ON public.invoices FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'accountant']));

-- Invoice items policies
DROP POLICY IF EXISTS "Users can view invoice items for their school invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Admins and accountants can manage invoice items" ON public.invoice_items;

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
DROP POLICY IF EXISTS "Users can view payments in their school" ON public.payments;
DROP POLICY IF EXISTS "Admins and accountants can manage payments" ON public.payments;

CREATE POLICY "Users can view payments in their school"
  ON public.payments FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins and accountants can manage payments"
  ON public.payments FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'accountant']));

-- Expenses policies
DROP POLICY IF EXISTS "Admins and accountants can view expenses in their school" ON public.expenses;
DROP POLICY IF EXISTS "Admins and accountants can manage expenses" ON public.expenses;

CREATE POLICY "Admins and accountants can view expenses in their school"
  ON public.expenses FOR SELECT
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'accountant']));
CREATE POLICY "Admins and accountants can manage expenses"
  ON public.expenses FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin', 'accountant']));

-- Announcements policies
DROP POLICY IF EXISTS "Users can view published announcements in their school" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

CREATE POLICY "Users can view published announcements in their school"
  ON public.announcements FOR SELECT
  USING (school_id = public.get_user_school_id() AND is_published = true);
CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Messages policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their school" ON public.messages;
DROP POLICY IF EXISTS "Users can update their sent messages" ON public.messages;

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
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Communication logs policies
DROP POLICY IF EXISTS "Admins can view communication logs in their school" ON public.communication_logs;
DROP POLICY IF EXISTS "Admins can manage communication logs" ON public.communication_logs;

CREATE POLICY "Admins can view communication logs in their school"
  ON public.communication_logs FOR SELECT
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));
CREATE POLICY "Admins can manage communication logs"
  ON public.communication_logs FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));

-- Events policies
DROP POLICY IF EXISTS "Users can view events in their school" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;

CREATE POLICY "Users can view events in their school"
  ON public.events FOR SELECT
  USING (school_id = public.get_user_school_id());
CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  USING (school_id = public.get_user_school_id() AND public.has_any_role(ARRAY['super_admin', 'school_admin']));