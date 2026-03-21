
CREATE TABLE public.muscle_training (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  muscle_group TEXT NOT NULL,
  trained_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.muscle_training ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own muscle training" ON public.muscle_training FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own muscle training" ON public.muscle_training FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own muscle training" ON public.muscle_training FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX muscle_training_unique ON public.muscle_training (user_id, muscle_group, trained_date);
