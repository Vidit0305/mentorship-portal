-- Allow mentors to update their reply on queries sent to them
CREATE POLICY "Mentors can update replies on queries" 
ON public.mentee_queries 
FOR UPDATE 
USING (auth.uid() = mentor_id)
WITH CHECK (auth.uid() = mentor_id);