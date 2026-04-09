
-- Fix challenge_participants SELECT policy
DROP POLICY IF EXISTS "Participants can view co-participants" ON public.challenge_participants;
CREATE POLICY "Participants can view co-participants"
ON public.challenge_participants FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenge_participants cp2
    WHERE cp2.challenge_id = challenge_participants.challenge_id
    AND cp2.user_id = auth.uid()
  )
);

-- Allow challenge creators to add friends as participants
DROP POLICY IF EXISTS "Users can join challenges" ON public.challenge_participants;
CREATE POLICY "Users can join challenges"
ON public.challenge_participants FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.challenges c
    WHERE c.id = challenge_id AND c.creator_id = auth.uid()
  )
);

-- Fix challenge_checkins SELECT policy
DROP POLICY IF EXISTS "Participants can view checkins" ON public.challenge_checkins;
CREATE POLICY "Participants can view checkins"
ON public.challenge_checkins FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenge_participants cp
    WHERE cp.challenge_id = challenge_checkins.challenge_id
    AND cp.user_id = auth.uid()
  )
);

-- Fix challenges SELECT policy
DROP POLICY IF EXISTS "Participants can view challenges" ON public.challenges;
CREATE POLICY "Participants can view challenges"
ON public.challenges FOR SELECT TO authenticated
USING (
  creator_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.challenge_participants cp
    WHERE cp.challenge_id = challenges.id
    AND cp.user_id = auth.uid()
  )
);

-- Also fix profiles SELECT so friends can see each other's names
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);
