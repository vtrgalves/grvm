
CREATE TYPE public.profile_type AS ENUM ('fan', 'musician');

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  profile_type profile_type NOT NULL DEFAULT 'fan',
  city TEXT,
  photo_url TEXT,
  grv_points INTEGER NOT NULL DEFAULT 0,
  selected_genres TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON public.point_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.point_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_key TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_key)
);

ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own missions" ON public.user_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own missions" ON public.user_missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own missions" ON public.user_missions FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, profile_type, grv_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'profile_type')::profile_type, 'fan'),
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'profile_type', 'fan') = 'musician' THEN 200
      ELSE 100
    END
  );
  
  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (
    NEW.id,
    'signup_bonus',
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'profile_type', 'fan') = 'musician' THEN 200
      ELSE 100
    END,
    'Bônus de cadastro'
  );
  
  IF COALESCE(NEW.raw_user_meta_data->>'profile_type', 'fan') = 'fan' THEN
    INSERT INTO public.user_missions (user_id, mission_key) VALUES
      (NEW.id, 'follow_3_artists'),
      (NEW.id, 'like_5_songs'),
      (NEW.id, 'share_1_story'),
      (NEW.id, 'comment_1_song'),
      (NEW.id, 'create_playlist'),
      (NEW.id, 'invite_1_friend');
  ELSE
    INSERT INTO public.user_missions (user_id, mission_key) VALUES
      (NEW.id, 'publish_first_song'),
      (NEW.id, 'add_cover_photo'),
      (NEW.id, 'reply_3_comments'),
      (NEW.id, 'connect_social'),
      (NEW.id, 'schedule_show'),
      (NEW.id, 'invite_2_musicians');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
