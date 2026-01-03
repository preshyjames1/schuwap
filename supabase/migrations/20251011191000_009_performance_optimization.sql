BEGIN;

-- ==========================================
-- 1. CLEANUP OLD POLICY NAMES (Fixes Multiple Permissive Policies)
-- ==========================================
DO $$ 
DECLARE 
  t text;
  -- Full list of tables mentioned in your warnings
  all_tables text[] := ARRAY[
    'academic_years', 'announcements', 'assessments', 'attendance', 
    'class_subjects', 'classes', 'communication_logs', 'events', 
    'expenses', 'fee_structures', 'grades', 'grading_systems', 
    'invoice_items', 'invoices', 'parents', 'payments', 
    'profiles', 'schools', 'student_enrollments', 'student_fees', 
    'student_parents', 'students', 'subjects', 'teachers', 
    'terms', 'timetables'
  ];
BEGIN
  FOREACH t IN ARRAY all_tables LOOP
    -- Drop the "Manage or view..." style policies from your first attempt
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Manage or view ' || t, t);
    -- Drop the "Admins can manage..." style policies from the repo
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins can manage ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins and teachers can manage ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins and accountants can manage ' || t, t);
  END LOOP;
END $$;


-- ==========================================
-- 2. ADD MISSING INDEXES (Fixes Unindexed foreign keys)
-- ==========================================

-- Announcements & Assessments
CREATE INDEX IF NOT EXISTS idx_announcements_published_by ON announcements(published_by);
CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_school_id ON assessments(school_id);
CREATE INDEX IF NOT EXISTS idx_assessments_subject_id ON assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assessments_term_id ON assessments(term_id);

-- Attendance & Class Subjects
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON attendance(marked_by);
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_school_id ON class_subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON class_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher_id ON class_subjects(teacher_id);

-- Classes & Events & Expenses
CREATE INDEX IF NOT EXISTS idx_classes_academic_year_id ON classes(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_classes_class_teacher_id ON classes(class_teacher_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_approved_by ON expenses(approved_by);

-- Finance (Fee structures, Invoices, Payments, Grades)
CREATE INDEX IF NOT EXISTS idx_fee_structures_academic_year_id ON fee_structures(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_id ON fee_structures(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_assessment_id ON grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_grades_entered_by ON grades(entered_by);
CREATE INDEX IF NOT EXISTS idx_grades_school_id ON grades(school_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_student_fee_id ON invoice_items(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_received_by ON payments(received_by);

-- Students, Parents, Teachers
CREATE INDEX IF NOT EXISTS idx_parents_user_id ON parents(user_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_parent_id ON student_parents(parent_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_school_id ON student_parents(school_id);
CREATE INDEX IF NOT EXISTS idx_students_current_class_id ON students(current_class_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);

-- Enrollment & Timetables
CREATE INDEX IF NOT EXISTS idx_student_enrollments_academic_year_id ON student_enrollments(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_id ON student_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_school_id ON student_enrollments(school_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_term_id ON student_enrollments(term_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_fee_structure_id ON student_fees(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_school_id ON student_fees(school_id);
CREATE INDEX IF NOT EXISTS idx_timetables_academic_year_id ON timetables(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_timetables_class_id ON timetables(class_id);
CREATE INDEX IF NOT EXISTS idx_timetables_school_id ON timetables(school_id);
CREATE INDEX IF NOT EXISTS idx_timetables_subject_id ON timetables(subject_id);
CREATE INDEX IF NOT EXISTS idx_timetables_teacher_id ON timetables(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetables_term_id ON timetables(term_id);

-- Academic Tables
CREATE INDEX IF NOT EXISTS idx_terms_academic_year_id ON terms(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_school_id ON messages(school_id);
CREATE INDEX IF NOT EXISTS idx_notifications_school_id ON notifications(school_id);

COMMIT;