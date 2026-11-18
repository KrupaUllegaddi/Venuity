-- Allow public (unauthenticated) users to view active departments
-- This is necessary for the signup page dropdown to populate.
CREATE POLICY "Active departments viewable by public" 
ON departments 
FOR SELECT 
USING (active = true);
