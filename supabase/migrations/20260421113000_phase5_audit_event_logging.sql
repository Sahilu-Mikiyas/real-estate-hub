-- Phase 5 — Audit & Event Logging Foundation
-- Unified activity events, field-level change history and audit explorer query surface.

-- =====================================================
-- 1) Generic activity-event writer trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_activity_event_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
  v_actor_role public.app_role;
  v_team text;
  v_entity_id uuid;
  v_domain text;
  v_action text;
  v_label text;
BEGIN
  v_actor := COALESCE(auth.uid(), NEW.agent_id, OLD.agent_id, NEW.created_by, OLD.created_by, NEW.uploaded_by, OLD.uploaded_by);

  IF v_actor IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_actor_role := COALESCE(public.get_user_role(v_actor), 'agent');

  v_team := COALESCE(
    NEW.team_id,
    OLD.team_id,
    (SELECT p.team_id FROM public.profiles p WHERE p.id = v_actor)
  );

  v_entity_id := COALESCE(NEW.id, OLD.id);
  v_domain := split_part(TG_TABLE_NAME, '_', 1);
  v_action := lower(TG_OP);
  v_label := COALESCE(NEW.name, OLD.name, NEW.property_name, OLD.property_name, NEW.title, OLD.title, TG_TABLE_NAME || ':' || v_entity_id::text);

  INSERT INTO public.activity_events (
    actor_user_id,
    actor_role,
    team_id,
    domain,
    action,
    entity_table,
    entity_id,
    entity_label,
    metadata,
    is_sensitive
  )
  VALUES (
    v_actor,
    v_actor_role,
    v_team,
    v_domain,
    v_action,
    TG_TABLE_NAME,
    v_entity_id,
    v_label,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'at', now()
    ),
    TG_TABLE_NAME IN ('closings', 'commission_entries', 'salary_cycles', 'salary_entries', 'approval_requests', 'approval_actions')
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- 2) Generic field-level change-log trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_record_change_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
  v_team text;
  v_change_type text;
  v_entity_id uuid;
BEGIN
  v_actor := COALESCE(auth.uid(), NEW.agent_id, OLD.agent_id, NEW.created_by, OLD.created_by, NEW.uploaded_by, OLD.uploaded_by);
  IF v_actor IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_team := COALESCE(NEW.team_id, OLD.team_id, (SELECT p.team_id FROM public.profiles p WHERE p.id = v_actor));
  v_entity_id := COALESCE(NEW.id, OLD.id);
  v_change_type := CASE WHEN TG_OP = 'UPDATE' THEN 'update' WHEN TG_OP = 'DELETE' THEN 'delete' ELSE 'create' END;

  IF TG_OP = 'UPDATE' THEN
    IF to_jsonb(NEW) = to_jsonb(OLD) THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.record_change_log (
      changed_by,
      team_id,
      entity_table,
      entity_id,
      change_type,
      before_data,
      after_data
    )
    VALUES (
      v_actor,
      v_team,
      TG_TABLE_NAME,
      v_entity_id,
      v_change_type,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.record_change_log (
      changed_by,
      team_id,
      entity_table,
      entity_id,
      change_type,
      before_data,
      after_data
    )
    VALUES (
      v_actor,
      v_team,
      TG_TABLE_NAME,
      v_entity_id,
      v_change_type,
      to_jsonb(OLD),
      NULL
    );

    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- =====================================================
-- 3) Attach triggers to core operational + financial tables
-- =====================================================
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'leads',
    'lead_followups',
    'visits',
    'social_posts',
    'closings',
    'closing_documents',
    'payment_schedules',
    'payment_transactions',
    'commission_entries',
    'salary_cycles',
    'salary_entries',
    'approval_requests',
    'approval_actions'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_activity_event ON public.%I;', t, t);
      EXECUTE format('CREATE TRIGGER trg_%I_activity_event AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_activity_event_trigger();', t, t);

      EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_record_change ON public.%I;', t, t);
      EXECUTE format('CREATE TRIGGER trg_%I_record_change AFTER UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_record_change_trigger();', t, t);
    END IF;
  END LOOP;
END;
$$;

-- =====================================================
-- 4) Audit explorer query surface (view + function)
-- =====================================================
CREATE OR REPLACE VIEW public.v_audit_explorer_recent AS
SELECT
  ae.id,
  ae.occurred_at,
  ae.actor_user_id,
  COALESCE(p.full_name, 'Unknown') AS actor_name,
  ae.actor_role,
  ae.team_id,
  ae.domain,
  ae.action,
  ae.entity_table,
  ae.entity_id,
  ae.entity_label,
  ae.is_sensitive,
  ae.metadata
FROM public.activity_events ae
LEFT JOIN public.profiles p ON p.id = ae.actor_user_id
ORDER BY ae.occurred_at DESC;

CREATE OR REPLACE FUNCTION public.audit_explorer_query(
  _team_id text DEFAULT NULL,
  _actor_user_id uuid DEFAULT NULL,
  _domain text DEFAULT NULL,
  _action text DEFAULT NULL,
  _date_from timestamptz DEFAULT NULL,
  _date_to timestamptz DEFAULT NULL,
  _limit int DEFAULT 100,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  occurred_at timestamptz,
  actor_user_id uuid,
  actor_name text,
  actor_role public.app_role,
  team_id text,
  domain text,
  action text,
  entity_table text,
  entity_id uuid,
  entity_label text,
  is_sensitive boolean,
  metadata jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id,
    v.occurred_at,
    v.actor_user_id,
    v.actor_name,
    v.actor_role,
    v.team_id,
    v.domain,
    v.action,
    v.entity_table,
    v.entity_id,
    v.entity_label,
    v.is_sensitive,
    v.metadata
  FROM public.v_audit_explorer_recent v
  WHERE (_team_id IS NULL OR v.team_id = _team_id)
    AND (_actor_user_id IS NULL OR v.actor_user_id = _actor_user_id)
    AND (_domain IS NULL OR v.domain = _domain)
    AND (_action IS NULL OR v.action = _action)
    AND (_date_from IS NULL OR v.occurred_at >= _date_from)
    AND (_date_to IS NULL OR v.occurred_at <= _date_to)
  ORDER BY v.occurred_at DESC
  LIMIT GREATEST(_limit, 1)
  OFFSET GREATEST(_offset, 0);
$$;

-- =====================================================
-- 5) RLS for audit explorer access surfaces
-- =====================================================
ALTER VIEW public.v_audit_explorer_recent SET (security_invoker = true);

GRANT SELECT ON public.v_audit_explorer_recent TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_explorer_query(text, uuid, text, text, timestamptz, timestamptz, int, int) TO authenticated;

-- =====================================================
-- 6) Indexes for explorer filtering
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_activity_events_filter_combo
  ON public.activity_events(team_id, domain, action, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_events_actor_time
  ON public.activity_events(actor_user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_record_change_entity_time
  ON public.record_change_log(entity_table, entity_id, changed_at DESC);
