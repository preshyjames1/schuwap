BEGIN;

-- ==========================================
-- 1. OPTIMIZE HELPER FUNCTIONS (Fixes "Auth RLS InitPlan")
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.profiles WHERE id = (SELECT auth.uid());
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (SELECT auth.uid()) AND role = required_role
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (SELECT auth.uid()) AND role = ANY(required_roles)
  );
$$ LANGUAGE SQL SECURITY DEFINER;


-- ==========================================
-- 2. SCHOOLS, PROFILES & NOTIFICATIONS (Performance Fixes)
-- ==========================================

-- SCHOOLS
DROP POLICY IF EXISTS "Users can view schools" ON schools;
DROP POLICY IF EXISTS "Users can view their own school" ON schools;
DROP POLICY IF EXISTS "Schools_Select" ON schools;
CREATE POLICY "Schools_Select" ON schools FOR SELECT 
USING (id = (SELECT get_user_school_id()));

-- PROFILES
DROP POLICY IF EXISTS "Users can view profiles in their school" ON profiles;
DROP POLICY IF EXISTS "Profiles_Select" ON profiles;
CREATE POLICY "Profiles_Select" ON profiles FOR SELECT 
USING (school_id = (SELECT get_user_school_id()) OR id = (SELECT auth.uid()));

-- NOTIFICATIONS (Fixes auth.uid re-evaluation)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Notifications_Select" ON notifications;
DROP POLICY IF EXISTS "Notifications_Update" ON notifications;
CREATE POLICY "Notifications_Select" ON notifications FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Notifications_Update" ON notifications FOR UPDATE USING (user_id = (SELECT auth.uid()));


-- ==========================================
-- 3. INVOICE ITEMS (Special handling for missing school_id)
-- ==========================================
DROP POLICY IF EXISTS "Users can view invoice items for their school invoices" ON invoice_items;
DROP POLICY IF EXISTS "Admins and accountants can manage invoice items" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_Select" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_Manage" ON invoice_items;

CREATE POLICY "invoice_items_Select" ON invoice_items FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.invoices 
  WHERE invoices.id = invoice_items.invoice_id 
  AND invoices.school_id = (SELECT get_user_school_id())
));

CREATE POLICY "invoice_items_Manage" ON invoice_items FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.invoices 
  WHERE invoices.id = invoice_items.invoice_id 
  AND invoices.school_id = (SELECT get_user_school_id())
) AND (SELECT has_any_role(ARRAY['super_admin', 'school_admin', 'accountant'])));


-- ==========================================
-- 4. AUTOMATED LOOPS (For all other tables)
-- ==========================================

-- GROUP A: Managed by ADMINS
DO $$ 
DECLARE 
  t text;
  tables_admins text[] := ARRAY['parents', 'teachers', 'academic_years', 'terms', 'classes', 'subjects', 'student_enrollments', 'grading_systems', 'announcements', 'communication_logs', 'events'];
BEGIN
  FOREACH t IN ARRAY tables_admins LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins can manage ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Users can view ' || t || ' in their school', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Users can view published ' || t || ' in their school', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Manage', t);

    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (school_id = (SELECT get_user_school_id()))', t || '_Select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin''])))', t || '_Manage', t);
  END LOOP;
END $$;

-- GROUP B: Managed by ADMINS + TEACHERS
DO $$ 
DECLARE 
  t text;
  tables_teachers text[] := ARRAY['students', 'class_subjects', 'timetables', 'attendance', 'assessments', 'grades'];
BEGIN
  FOREACH t IN ARRAY tables_teachers LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins and teachers can manage ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Teachers can manage ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Users can view ' || t || ' in their school', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Manage', t);

    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (school_id = (SELECT get_user_school_id()))', t || '_Select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin'', ''teacher''])))', t || '_Manage', t);
  END LOOP;
END $$;

-- GROUP C: Managed by ADMINS + ACCOUNTANTS (Note: invoice_items removed from here)
DO $$ 
DECLARE 
  t text;
  tables_finance text[] := ARRAY['fee_structures', 'student_fees', 'invoices', 'payments', 'expenses'];
BEGIN
  FOREACH t IN ARRAY tables_finance LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins and accountants can manage ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Users can view ' || t || ' in their school', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins and accountants can view ' || t || ' in their school', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Manage', t);

    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (school_id = (SELECT get_user_school_id()))', t || '_Select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin'', ''accountant''])))', t || '_Manage', t);
  END LOOP;
END $$;

COMMIT;