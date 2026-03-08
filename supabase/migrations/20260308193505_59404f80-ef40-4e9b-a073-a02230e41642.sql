CREATE TABLE public.body_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  height_cm numeric NOT NULL,
  weight_kg numeric NOT NULL,
  age integer NOT NULL,
  sex text NOT NULL CHECK (sex IN ('male', 'female')),
  waist_cm numeric,
  neck_cm numeric,
  hip_cm numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own body metrics"
  ON public.body_metrics FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body metrics"
  ON public.body_metrics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body metrics"
  ON public.body_metrics FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body metrics"
  ON public.body_metrics FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_body_metrics_updated_at
  BEFORE UPDATE ON public.body_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();