
-- Table for trackable items within a challenge
CREATE TABLE public.challenge_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_tasks ENABLE ROW LEVEL SECURITY;

-- All participants can view tasks
CREATE POLICY "Participants can view challenge tasks"
ON public.challenge_tasks FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenge_participants cp
    WHERE cp.challenge_id = challenge_tasks.challenge_id
    AND cp.user_id = auth.uid()
  )
);

-- Any participant can add tasks
CREATE POLICY "Participants can add tasks"
ON public.challenge_tasks FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.challenge_participants cp
    WHERE cp.challenge_id = challenge_tasks.challenge_id
    AND cp.user_id = auth.uid()
  )
);

-- Task creator can delete
CREATE POLICY "Task creator can delete"
ON public.challenge_tasks FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- Table for daily completions per task per user
CREATE TABLE public.challenge_task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.challenge_tasks(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id, completion_date)
);

ALTER TABLE public.challenge_task_completions ENABLE ROW LEVEL SECURITY;

-- Participants can view all completions
CREATE POLICY "Participants can view task completions"
ON public.challenge_task_completions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.challenge_participants cp
    WHERE cp.challenge_id = challenge_task_completions.challenge_id
    AND cp.user_id = auth.uid()
  )
);

-- Users can add own completions
CREATE POLICY "Users can add own completions"
ON public.challenge_task_completions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete own completions
CREATE POLICY "Users can delete own completions"
ON public.challenge_task_completions FOR DELETE TO authenticated
USING (auth.uid() = user_id);
