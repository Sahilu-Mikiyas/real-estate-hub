-- ============ ENUMS ============
CREATE TYPE public.closing_status AS ENUM ('draft', 'pending', 'completed', 'cancelled');
CREATE TYPE public.followup_action AS ENUM ('status_change', 'note', 'call', 'email', 'meeting', 'reminder');

-- ============ CLOSINGS ============
CREATE TABLE public.closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  team_id TEXT,
  property_id UUID,
  property_name TEXT NOT NULL,
  lead_id UUID,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT,
  buyer_phone TEXT,
  buyer_id_number TEXT,
  seller_name TEXT,
  seller_phone TEXT,
  deal_price NUMERIC NOT NULL DEFAULT 0,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  commission_percent NUMERIC NOT NULL DEFAULT 0,
  deal_length_months INTEGER,
  payment_method TEXT,
  payment_schedule JSONB DEFAULT '[]'::jsonb,
  parties JSONB DEFAULT '[]'::jsonb,
  witnesses JSONB DEFAULT '[]'::jsonb,
  terms TEXT,
  notes TEXT,
  status public.closing_status NOT NULL DEFAULT 'draft',
  signed_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own closings" ON public.closings
  FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents can insert own closings" ON public.closings
  FOR INSERT WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agents can update own closings" ON public.closings
  FOR UPDATE USING (auth.uid() = agent_id);
CREATE POLICY "Supervisors can view team closings" ON public.closings
  FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') AND team_id = public.get_user_team(auth.uid()));
CREATE POLICY "Admins full access closings" ON public.closings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_closings_updated_at
  BEFORE UPDATE ON public.closings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CLOSING DOCUMENTS ============
CREATE TABLE public.closing_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_id UUID NOT NULL REFERENCES public.closings(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'contract',
  label TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.closing_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view own closing docs" ON public.closing_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.closings c WHERE c.id = closing_id AND c.agent_id = auth.uid())
  );
CREATE POLICY "Agents insert own closing docs" ON public.closing_documents
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (SELECT 1 FROM public.closings c WHERE c.id = closing_id AND c.agent_id = auth.uid())
  );
CREATE POLICY "Agents delete own closing docs" ON public.closing_documents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.closings c WHERE c.id = closing_id AND c.agent_id = auth.uid())
  );
CREATE POLICY "Supervisors view team closing docs" ON public.closing_documents
  FOR SELECT USING (
    public.has_role(auth.uid(), 'supervisor') AND
    EXISTS (SELECT 1 FROM public.closings c WHERE c.id = closing_id AND c.team_id = public.get_user_team(auth.uid()))
  );
CREATE POLICY "Admins full access closing docs" ON public.closing_documents
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ LEAD FOLLOWUPS ============
CREATE TABLE public.lead_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  team_id TEXT,
  action public.followup_action NOT NULL DEFAULT 'note',
  old_status TEXT,
  new_status TEXT,
  notes TEXT,
  next_action_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents view own followups" ON public.lead_followups
  FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents insert own followups" ON public.lead_followups
  FOR INSERT WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agents update own followups" ON public.lead_followups
  FOR UPDATE USING (auth.uid() = agent_id);
CREATE POLICY "Agents delete own followups" ON public.lead_followups
  FOR DELETE USING (auth.uid() = agent_id);
CREATE POLICY "Supervisors view team followups" ON public.lead_followups
  FOR SELECT USING (public.has_role(auth.uid(), 'supervisor') AND team_id = public.get_user_team(auth.uid()));
CREATE POLICY "Admins full access followups" ON public.lead_followups
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ PROFILE PREFERENCES ============
CREATE TABLE public.profile_preferences (
  user_id UUID PRIMARY KEY,
  phone TEXT,
  bio TEXT,
  theme TEXT NOT NULL DEFAULT 'system',
  notify_email BOOLEAN NOT NULL DEFAULT true,
  notify_in_app BOOLEAN NOT NULL DEFAULT true,
  notify_leads BOOLEAN NOT NULL DEFAULT true,
  notify_closings BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own preferences" ON public.profile_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own preferences" ON public.profile_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own preferences" ON public.profile_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Supervisors view team preferences" ON public.profile_preferences
  FOR SELECT USING (
    public.has_role(auth.uid(), 'supervisor') AND
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.team_id = public.get_user_team(auth.uid()))
  );
CREATE POLICY "Admins full access preferences" ON public.profile_preferences
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_profile_preferences_updated_at
  BEFORE UPDATE ON public.profile_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUTO-SYNC: closing completed -> property sold + audit ============
CREATE OR REPLACE FUNCTION public.handle_closing_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    NEW.completed_at = now();
    IF NEW.property_id IS NOT NULL THEN
      UPDATE public.properties SET status = 'sold', updated_at = now() WHERE id = NEW.property_id;
    END IF;
    INSERT INTO public.audit_logs (user_id, user_name, action, target_table, target_id, details)
    VALUES (
      NEW.agent_id,
      COALESCE((SELECT full_name FROM public.profiles WHERE id = NEW.agent_id), 'Agent'),
      'closing_completed',
      'closings',
      NEW.id::text,
      jsonb_build_object('property', NEW.property_name, 'buyer', NEW.buyer_name, 'price', NEW.deal_price)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER closings_on_completion
  BEFORE UPDATE ON public.closings
  FOR EACH ROW EXECUTE FUNCTION public.handle_closing_completion();

-- ============ STORAGE BUCKETS ============
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('closing-documents', 'closing-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', false) ON CONFLICT (id) DO NOTHING;

-- Avatars (public read, owner write)
CREATE POLICY "Avatars are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Closing documents (private — owner + supervisor + admin)
CREATE POLICY "Agents view own closing files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'closing-documents' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "Agents upload own closing files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'closing-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Agents delete own closing files" ON storage.objects
  FOR DELETE USING (bucket_id = 'closing-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Signatures (private — same rules)
CREATE POLICY "Agents view own signatures" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'signatures' AND
    (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "Agents upload own signatures" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Agents delete own signatures" ON storage.objects
  FOR DELETE USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ INDEXES ============
CREATE INDEX idx_closings_agent ON public.closings(agent_id);
CREATE INDEX idx_closings_team ON public.closings(team_id);
CREATE INDEX idx_closings_status ON public.closings(status);
CREATE INDEX idx_followups_lead ON public.lead_followups(lead_id);
CREATE INDEX idx_followups_agent ON public.lead_followups(agent_id);
CREATE INDEX idx_closing_docs_closing ON public.closing_documents(closing_id);