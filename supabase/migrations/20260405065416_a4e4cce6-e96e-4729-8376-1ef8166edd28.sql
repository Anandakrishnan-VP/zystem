
-- Friend codes
CREATE TABLE public.friend_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  friend_code integer NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.friend_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can lookup friend codes" ON public.friend_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own friend code" ON public.friend_codes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-generate friend code on profile creation
CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code integer;
BEGIN
  LOOP
    new_code := floor(random() * 900000 + 100000)::integer;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.friend_codes WHERE friend_code = new_code);
  END LOOP;
  INSERT INTO public.friend_codes (user_id, friend_code) VALUES (NEW.user_id, new_code);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_generate_code
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_friend_code();

-- Friend requests
CREATE TABLE public.friend_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their requests" ON public.friend_requests FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send requests" ON public.friend_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update received requests" ON public.friend_requests FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);
CREATE POLICY "Users can delete their requests" ON public.friend_requests FOR DELETE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Friendships
CREATE TABLE public.friendships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_1 uuid NOT NULL,
  user_id_2 uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id_1, user_id_2)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
CREATE POLICY "Users can create friendships" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
CREATE POLICY "Users can delete friendships" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
