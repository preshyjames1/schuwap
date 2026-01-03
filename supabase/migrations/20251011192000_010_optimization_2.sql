BEGIN;

-- ==========================================
-- 1. CLEANUP: REMOVE ALL CONFLICTING POLICIES
-- ==========================================

-- We use DO blocks to handle the "Ghost" policies safely
DO $$ 
DECLARE 
  t text;
  -- List of all tables causing issues
  tables text[] := ARRAY[
    'academic_years', 'announcements', 'assessments', 'attendance', 
    'class_subjects', 'classes', 'communication_logs', 'events', 
    'expenses', 'fee_structures', 'grades', 'grading_systems', 
    'invoice_items', 'invoices', 'parents', 'payments', 
    'profiles', 'schools', 'student_enrollments', 'student_fees', 
    'student_parents', 'students', 'subjects', 'teachers', 
    'terms', 'timetables'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- 1. Drop the "Ghost" policies (Explicit naming)
    EXECUTE format('DROP POLICY IF EXISTS "Manage or view %s" ON public.%I', replace(t, '_', ' '), t); -- Try with spaces
    EXECUTE format('DROP POLICY IF EXISTS "Manage or view %s" ON public.%I', t, t); -- Try with underscores
    
    -- 2. Drop the "Manage" (FOR ALL) policies we created recently
    -- These are causing the SELECT overlap
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_Manage', t);
  END LOOP;
END $$;


-- ==========================================
-- 2. RE-CREATE MUTATION POLICIES (Split into Insert/Update/Delete)
-- ==========================================
-- By splitting these, we ensure the 'SELECT' action is handled ONLY by the '_Select' policy.
-- This removes the "Multiple Permissive Policies" warning for SELECT.

-- GROUP A: Managed by ADMINS only
DO $$ 
DECLARE 
  t text;
  tables_admins text[] := ARRAY['parents', 'teachers', 'academic_years', 'terms', 'classes', 'subjects', 'student_enrollments', 'grading_systems', 'announcements', 'communication_logs', 'events'];
BEGIN
  FOREACH t IN ARRAY tables_admins LOOP
    -- INSERT
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin''])))', t || '_Insert', t);
    -- UPDATE
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin''])))', t || '_Update', t);
    -- DELETE
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
    -- INSERT
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin'', ''teacher''])))', t || '_Insert', t);
    -- UPDATE
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin'', ''teacher''])))', t || '_Update', t);
    -- DELETE
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
    -- INSERT
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin'', ''accountant''])))', t || '_Insert', t);
    -- UPDATE
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin'', ''accountant''])))', t || '_Update', t);
    -- DELETE
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (school_id = (SELECT get_user_school_id()) AND (SELECT has_any_role(ARRAY[''super_admin'', ''school_admin'', ''accountant''])))', t || '_Delete', t);
  END LOOP;
END $$;

-- Special Case: Invoice Items (Needs EXISTS clause)
DROP POLICY IF EXISTS "invoice_items_Manage" ON invoice_items;

CREATE POLICY "invoice_items_Insert" ON invoice_items FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM public.invoices 
  WHERE invoices.id = invoice_items.invoice_id 
  AND invoices.school_id = (SELECT get_user_school_id())
) AND (SELECT has_any_role(ARRAY['super_admin', 'school_admin', 'accountant'])));

CREATE POLICY "invoice_items_Update" ON invoice_items FOR UPDATE USING (EXISTS (
  SELECT 1 FROM public.invoices 
  WHERE invoices.id = invoice_items.invoice_id 
  AND invoices.school_id = (SELECT get_user_school_id())
) AND (SELECT has_any_role(ARRAY['super_admin', 'school_admin', 'accountant'])));

CREATE POLICY "invoice_items_Delete" ON invoice_items FOR DELETE USING (EXISTS (
  SELECT 1 FROM public.invoices 
  WHERE invoices.id = invoice_items.invoice_id 
  AND invoices.school_id = (SELECT get_user_school_id())
) AND (SELECT has_any_role(ARRAY['super_admin', 'school_admin', 'accountant'])));

COMMIT;