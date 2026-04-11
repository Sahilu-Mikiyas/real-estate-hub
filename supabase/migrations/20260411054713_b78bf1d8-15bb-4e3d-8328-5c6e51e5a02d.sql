
-- Create visit_type enum
CREATE TYPE public.visit_type AS ENUM ('site', 'office');

-- Create visits table
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  team_id TEXT,
  client_name TEXT NOT NULL,
  visit_type public.visit_type NOT NULL DEFAULT 'site',
  property TEXT,
  outcome TEXT,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Visits RLS
CREATE POLICY "Agents can view own visits" ON public.visits FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents can insert own visits" ON public.visits FOR INSERT WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agents can update own visits" ON public.visits FOR UPDATE USING (auth.uid() = agent_id);
CREATE POLICY "Supervisors can view team visits" ON public.visits FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') AND team_id = public.get_user_team(auth.uid()));
CREATE POLICY "Supervisors can update team visits" ON public.visits FOR UPDATE USING (public.has_role(auth.uid(), 'supervisor') AND team_id = public.get_user_team(auth.uid()));
CREATE POLICY "Admins can do anything with visits" ON public.visits FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Visits updated_at trigger
CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON public.visits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create platform enum
CREATE TYPE public.social_platform AS ENUM ('facebook', 'instagram', 'telegram', 'tiktok', 'linkedin', 'twitter');

-- Create social_posts table
CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  team_id TEXT,
  platform public.social_platform NOT NULL,
  property TEXT,
  post_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- Social posts RLS
CREATE POLICY "Agents can view own posts" ON public.social_posts FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents can insert own posts" ON public.social_posts FOR INSERT WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agents can update own posts" ON public.social_posts FOR UPDATE USING (auth.uid() = agent_id);
CREATE POLICY "Agents can delete own posts" ON public.social_posts FOR DELETE USING (auth.uid() = agent_id);
CREATE POLICY "Supervisors can view team posts" ON public.social_posts FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') AND team_id = public.get_user_team(auth.uid()));
CREATE POLICY "Admins can do anything with posts" ON public.social_posts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Social posts updated_at trigger
CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
