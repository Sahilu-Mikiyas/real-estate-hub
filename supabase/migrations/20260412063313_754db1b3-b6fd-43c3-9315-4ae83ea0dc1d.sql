
-- Property type enum
CREATE TYPE public.property_type AS ENUM ('plot', 'villa', 'shop', 'flat');

-- Property status enum
CREATE TYPE public.property_status AS ENUM ('available', 'sold', 'reserved');

-- Notification type enum
CREATE TYPE public.notification_type AS ENUM ('success', 'info', 'warning');

-- Properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type public.property_type NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  block TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  price_label TEXT NOT NULL DEFAULT '',
  status public.property_status NOT NULL DEFAULT 'available',
  description TEXT,
  area_sqft NUMERIC,
  bedrooms INTEGER,
  bathrooms INTEGER,
  features TEXT[],
  map_url TEXT,
  plan_images TEXT[] DEFAULT '{}',
  gallery_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view available properties" ON public.properties FOR SELECT USING (status = 'available' AND NOT public.has_role(auth.uid(), 'supervisor') AND NOT public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Supervisors can view all properties" ON public.properties FOR SELECT USING (public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Admins full access to properties" ON public.properties FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Scoring rules table
CREATE TABLE public.scoring_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL UNIQUE,
  points_per_action INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view scoring rules" ON public.scoring_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage scoring rules" ON public.scoring_rules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_scoring_rules_updated_at BEFORE UPDATE ON public.scoring_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'star',
  threshold_type TEXT NOT NULL DEFAULT 'leads',
  threshold_value INTEGER NOT NULL DEFAULT 1,
  points_awarded INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.badges FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Agent badges (unlocked badges)
CREATE TABLE public.agent_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, badge_id)
);

ALTER TABLE public.agent_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can view own badges" ON public.agent_badges FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Supervisors can view team badges" ON public.agent_badges FOR SELECT USING (public.has_role(auth.uid(), 'supervisor'));
CREATE POLICY "Admins full access to agent badges" ON public.agent_badges FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Rewards table
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'gift',
  description TEXT,
  threshold_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rewards" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "Admins can manage rewards" ON public.rewards FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  target_table TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type public.notification_type NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Seed default scoring rules
INSERT INTO public.scoring_rules (rule_name, points_per_action, description) VALUES
  ('lead_added', 10, 'Points for adding a new lead'),
  ('lead_closed', 100, 'Points for closing a deal'),
  ('visit_logged', 15, 'Points for logging a visit'),
  ('social_post', 5, 'Points for logging a social media post');

-- Seed default badges
INSERT INTO public.badges (name, description, icon, threshold_type, threshold_value, points_awarded) VALUES
  ('First Lead', 'Add your first lead', 'star', 'leads', 1, 10),
  ('10 Leads', 'Add 10 leads', 'star', 'leads', 10, 50),
  ('First Closer', 'Close your first deal', 'award', 'closings', 1, 100),
  ('10 Visits', 'Log 10 visits', 'target', 'visits', 10, 75),
  ('Social Star', 'Post 10 social media updates', 'zap', 'posts', 10, 60),
  ('Top Performer', 'Reach top 3 in monthly rankings', 'trophy', 'rank', 3, 200),
  ('50 Leads', 'Add 50 leads', 'star', 'leads', 50, 150),
  ('Deal Master', 'Close 10 deals', 'medal', 'closings', 10, 300);

-- Seed default rewards
INSERT INTO public.rewards (name, type, description, threshold_points) VALUES
  ('Gift Card PKR 5,000', 'gift_card', 'Redeemable gift card worth PKR 5,000', 2000),
  ('Weekend Trip', 'experience', 'An all-expenses-paid weekend trip', 5000),
  ('iPhone 16', 'device', 'Latest iPhone 16', 10000);

-- Seed sample properties
INSERT INTO public.properties (name, type, location, block, price, price_label, status, description, area_sqft, bedrooms, bathrooms, features) VALUES
  ('Plot 24 - Phase 2', 'plot', 'Phase 2', 'Block A', 4500000, 'PKR 45L', 'available', 'Prime corner plot with wide road access', 2000, NULL, NULL, ARRAY['Corner', 'Wide Road', 'Park Facing']),
  ('Villa Royale - Block A', 'villa', 'Block A', 'Block A', 25000000, 'PKR 2.5Cr', 'available', 'Luxury 5-bedroom villa with garden', 5000, 5, 6, ARRAY['Garden', 'Pool', 'Smart Home']),
  ('Shop 12 - Commercial', 'shop', 'Commercial Area', 'Block C', 8500000, 'PKR 85L', 'sold', 'Ground floor commercial shop at main road', 800, NULL, NULL, ARRAY['Main Road', 'Ground Floor']),
  ('Flat 3B - Luxury Tower', 'flat', 'Tower 1', 'Block B', 12000000, 'PKR 1.2Cr', 'reserved', '3-bedroom luxury apartment with city view', 2200, 3, 3, ARRAY['City View', 'Gym', 'Parking']),
  ('Plot 8 - Phase 1', 'plot', 'Phase 1', 'Block D', 3800000, 'PKR 38L', 'sold', 'Developed plot in established area', 1800, NULL, NULL, ARRAY['Developed', 'Near School']),
  ('Villa 7 - Garden City', 'villa', 'Garden City', 'Block E', 31000000, 'PKR 3.1Cr', 'available', 'Modern villa with landscaped gardens', 6000, 6, 7, ARRAY['Landscaped', 'Double Garage', 'Servant Quarter']),
  ('Shop 5 - Mall Road', 'shop', 'Mall Road', 'Block F', 11000000, 'PKR 1.1Cr', 'available', 'Premium shop on the busiest commercial strip', 1200, NULL, NULL, ARRAY['Mall Road', 'Mezzanine Floor']),
  ('Plot 15 - Phase 3', 'plot', 'Phase 3', 'Block G', 5200000, 'PKR 52L', 'reserved', 'Future development zone plot', 2500, NULL, NULL, ARRAY['Future Development', 'Wide Plot']);
