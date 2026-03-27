CREATE TABLE public.countdown_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_date date NOT NULL,
  label text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.countdown_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own countdown" ON public.countdown_targets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own countdown" ON public.countdown_targets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own countdown" ON public.countdown_targets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own countdown" ON public.countdown_targets FOR DELETE TO authenticated USING (auth.uid() = user_id);