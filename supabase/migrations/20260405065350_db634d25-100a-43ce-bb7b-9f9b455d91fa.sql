
-- Challenges
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  goal text NOT NULL DEFAULT '',
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Challenge participants
CREATE TABLE public.challenge_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Challenge daily check-ins
CREATE TABLE public.challenge_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  completed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id, checkin_date)
);

ALTER TABLE public.challenge_checkins ENABLE ROW LEVEL SECURITY;

-- Now create RLS policies (challenge_participants exists now)
CREATE POLICY "Participants can view challenges" ON public.challenges FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.challenge_participants cp WHERE cp.challenge_id = id AND cp.user_id = auth.uid())
  OR creator_id = auth.uid()
);
CREATE POLICY "Users can create challenges" ON public.challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update challenges" ON public.challenges FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete challenges" ON public.challenges FOR DELETE TO authenticated USING (auth.uid() = creator_id);

CREATE POLICY "Participants can view co-participants" ON public.challenge_participants FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.challenge_participants cp2 WHERE cp2.challenge_id = challenge_id AND cp2.user_id = auth.uid())
);
CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave challenges" ON public.challenge_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Participants can view checkins" ON public.challenge_checkins FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.challenge_participants cp WHERE cp.challenge_id = challenge_id AND cp.user_id = auth.uid())
);
CREATE POLICY "Users can checkin" ON public.challenge_checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own checkins" ON public.challenge_checkins FOR DELETE TO authenticated USING (auth.uid() = user_id);
