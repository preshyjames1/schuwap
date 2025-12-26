ALTER TABLE public.students
ADD CONSTRAINT students_current_class_id_fkey
FOREIGN KEY (current_class_id)
REFERENCES public.classes(id)
ON DELETE SET NULL;