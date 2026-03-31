CREATE TABLE public.water_intake (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  intake_date date NOT NULL DEFAULT CURRENT_DATE,
  bottles_drunk integer NOT NULL DEFAULT 0,
  target_bottles integer NOT NULL DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, intake_date)
);

ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own water intake" ON public.water_intake FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own water intake" ON public.water_intake FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own water intake" ON public.water_intake FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own water intake" ON public.water_intake FOR DELETE TO authenticated USING (auth.uid() = user_id);