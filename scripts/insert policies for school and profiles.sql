-- Allow authenticated users to create a new school
CREATE POLICY "Allow authenticated users to insert schools"
ON public.schools
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow school admins to insert new profiles for their school
CREATE POLICY "Allow school admins to insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (
  school_id = (select get_user_school_id()) AND
  (select has_role('school_admin'))
);