
-- Create a SECURITY DEFINER function to check if a user participates in a challenge
CREATE OR REPLACE FUNCTION public.is_challenge_participant(_user_id uuid, _challenge_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.challenge_participants
    WHERE user_id = _user_id AND challenge_id = _challenge_id
  );
$$;

-- Drop the recursive policy on challenge_participants
DROP POLICY IF EXISTS "Participants can view co-participants" ON public.challenge_participants;

-- New policy: users see rows where they are a participant OR it's their own row
CREATE POLICY "Participants can view co-participants"
ON public.challenge_participants
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_challenge_participant(auth.uid(), challenge_id)
);

-- Fix challenge_checkins SELECT policy
DROP POLICY IF EXISTS "Participants can view checkins" ON public.challenge_checkins;
CREATE POLICY "Participants can view checkins"
ON public.challenge_checkins
FOR SELECT TO authenticated
USING (public.is_challenge_participant(auth.uid(), challenge_id));

-- Fix challenge_tasks SELECT policy
DROP POLICY IF EXISTS "Participants can view challenge tasks" ON public.challenge_tasks;
CREATE POLICY "Participants can view challenge tasks"
ON public.challenge_tasks
FOR SELECT TO authenticated
USING (public.is_challenge_participant(auth.uid(), challenge_id));

-- Fix challenge_tasks INSERT policy
DROP POLICY IF EXISTS "Participants can add tasks" ON public.challenge_tasks;
CREATE POLICY "Participants can add tasks"
ON public.challenge_tasks
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND public.is_challenge_participant(auth.uid(), challenge_id)
);

-- Fix challenge_task_completions SELECT policy
DROP POLICY IF EXISTS "Participants can view task completions" ON public.challenge_task_completions;
CREATE POLICY "Participants can view task completions"
ON public.challenge_task_completions
FOR SELECT TO authenticated
USING (public.is_challenge_participant(auth.uid(), challenge_id));
