CREATE TABLE public.link_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.link_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own link groups" ON public.link_groups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own link groups" ON public.link_groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own link groups" ON public.link_groups FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own link groups" ON public.link_groups FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.saved_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  group_id uuid REFERENCES public.link_groups(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  notes text DEFAULT '',
  tags text[] DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved links" ON public.saved_links FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saved links" ON public.saved_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved links" ON public.saved_links FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved links" ON public.saved_links FOR DELETE TO authenticated USING (auth.uid() = user_id);