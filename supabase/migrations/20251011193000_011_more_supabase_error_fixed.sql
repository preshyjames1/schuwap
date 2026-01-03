BEGIN;

-- ==========================================
-- 1. SECURITY: FIX FUNCTION SEARCH PATHS
-- ==========================================
-- This fixes the "Function Search Path Mutable" warnings
ALTER FUNCTION public.get_user_school_id() SET search_path = public;
ALTER FUNCTION public.has_role(text) SET search_path = public;
ALTER FUNCTION public.has_any_role(text[]) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_invoice_balance() SET search_path = public;
ALTER FUNCTION public.calculate_student_fee_final_amount() SET search_path = public;


-- ==========================================
-- 2. CLEANUP: EXPLICITLY DROP "GHOST" POLICIES
-- ==========================================
-- We drop the specific policies mentioned in your CSVs to stop the conflicts.

-- Class Subjects
DROP POLICY IF EXISTS "Admins and teachers can manage class subjects" ON public.class_subjects;
DROP POLICY IF EXISTS "Users can view class subjects in their school" ON public.class_subjects;

-- Communication Logs
DROP POLICY IF EXISTS "Admins can manage communication logs" ON public.communication_logs;
DROP POLICY IF EXISTS "Admins can view communication logs in their school" ON public.communication_logs;

-- Fee Structures
DROP POLICY IF EXISTS "Admins and accountants can manage fee structures" ON public.fee_structures;
DROP POLICY IF EXISTS "Users can view fee structures in their school" ON public.fee_structures;

-- Grading Systems
DROP POLICY IF EXISTS "Admins can manage grading systems" ON public.grading_systems;
DROP POLICY IF EXISTS "Users can view grading systems in their school" ON public.grading_systems;

-- Profiles
DROP POLICY IF EXISTS "Admins can insert profiles in their school" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Schools
DROP POLICY IF EXISTS "Allow authenticated users to insert schools" ON public.schools;
DROP POLICY IF EXISTS "Authenticated users can create a school" ON public.schools;

-- Student Enrollments
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.student_enrollments;
DROP POLICY IF EXISTS "Users can view enrollments in their school" ON public.student_enrollments;

-- Student Fees
DROP POLICY IF EXISTS "Admins and accountants can manage student fees" ON public.student_fees;
DROP POLICY IF EXISTS "Users can view student fees in their school" ON public.student_fees;

-- Student Parents
DROP POLICY IF EXISTS "Admins can manage student-parent relationships" ON public.student_parents;
DROP POLICY IF EXISTS "Users can view student-parent relationships in their school" ON public.student_parents;


-- ==========================================
-- 3. RE-ARCHITECT POLICIES (Split Strategy)
-- ==========================================
-- We delete any previous attempts and create clean, split policies.

-- GROUP A: Managed by ADMINS only
DO $$ 
DECLARE 
  t text;
  tables_admins text[] := ARRAY['parents', 'teachers', 'academic_years', 'terms', 'classes', 'subjects', 'student_enrollments', 'grading_systems', 'announcements', 'communication_logs', 'events', 'student_parents'];
BEGIN
  FOREACH t IN ARRAY tables_admins LOOP
    -- Drop potential duplicates
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Manage', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Delete', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Select', t);

    -- 1. SELECT (The ONLY policy allowing view access)
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (school_id = (SELECT get_user_school_id()))', t || '_Select', t);

    -- 2. MODIFY (Split into 3 to avoid "Multiple Permissive" warning on SELECT)
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin''])))', t || '_Insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin''])))', t || '_Update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin''])))', t || '_Delete', t);
  END LOOP;
END $$;

-- GROUP B: Managed by ADMINS + TEACHERS
DO $$ 
DECLARE 
  t text;
  tables_teachers text[] := ARRAY['students', 'class_subjects', 'timetables', 'attendance', 'assessments', 'grades'];
BEGIN
  FOREACH t IN ARRAY tables_teachers LOOP
    -- Drop potential duplicates
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Manage', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Delete', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Select', t);

    -- 1. SELECT
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (school_id = (SELECT get_user_school_id()))', t || '_Select', t);

    -- 2. MODIFY (Split)
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin'', ''teacher''])))', t || '_Insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin'', ''teacher''])))', t || '_Update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin'', ''teacher''])))', t || '_Delete', t);
  END LOOP;
END $$;

-- GROUP C: Managed by ADMINS + ACCOUNTANTS
DO $$ 
DECLARE 
  t text;
  tables_finance text[] := ARRAY['fee_structures', 'student_fees', 'invoices', 'payments', 'expenses'];
BEGIN
  FOREACH t IN ARRAY tables_finance LOOP
    -- Drop potential duplicates
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Manage', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Delete', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Select', t);

    -- 1. SELECT
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (school_id = (SELECT get_user_school_id()))', t || '_Select', t);

    -- 2. MODIFY (Split)
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin'', ''accountant''])))', t || '_Insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin'', ''accountant''])))', t || '_Update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin'', ''accountant''])))', t || '_Delete', t);
  END LOOP;
END $$;

-- GROUP D: Special Cases (Schools & Profiles)
-- Schools
DROP POLICY IF EXISTS "Schools_Manage" ON schools;
DROP POLICY IF EXISTS "Schools_Select" ON schools;
CREATE POLICY "Schools_Select" ON schools FOR SELECT USING (id = (SELECT get_user_school_id()));
CREATE POLICY "Schools_Insert" ON schools FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Profiles
DROP POLICY IF EXISTS "Profiles_Select" ON profiles;
CREATE POLICY "Profiles_Select" ON profiles FOR SELECT USING (school_id = (SELECT get_user_school_id()) OR id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Profiles_Insert" ON profiles;
CREATE POLICY "Profiles_Insert" ON profiles FOR INSERT WITH CHECK (id = (SELECT auth.uid()) OR (SELECT has_any_role(ARRAY['super_admin', 'school_admin'])));

-- Invoice Items (Special Exists Clause)
DROP POLICY IF EXISTS "invoice_items_Manage" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_Select" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_Insert" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_Update" ON invoice_items;
DROP POLICY IF EXISTS "invoice_items_Delete" ON invoice_items;

CREATE POLICY "invoice_items_Select" ON invoice_items FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.school_id = (SELECT get_user_school_id())
));
CREATE POLICY "invoice_items_Insert" ON invoice_items FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.school_id = (SELECT get_user_school_id())
) AND (SELECT has_any_role(ARRAY['super_admin', 'school_admin', 'accountant'])));
CREATE POLICY "invoice_items_Update" ON invoice_items FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.school_id = (SELECT get_user_school_id())
) AND (SELECT has_any_role(ARRAY['super_admin', 'school_admin', 'accountant'])));
CREATE POLICY "invoice_items_Delete" ON invoice_items FOR DELETE USING (EXISTS (
  SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.school_id = (SELECT get_user_school_id())
) AND (SELECT has_any_role(ARRAY['super_admin', 'school_admin', 'accountant'])));

COMMIT;