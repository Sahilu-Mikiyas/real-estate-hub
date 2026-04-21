-- Phase 3 + Phase 4 foundational implementation
-- Adds financial + approvals + activity entities with RLS and audited admin override function.

-- =========================
-- ENUMS
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('scheduled', 'partial', 'paid', 'overdue', 'cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_scope_type') THEN
    CREATE TYPE public.commission_scope_type AS ENUM ('global', 'team', 'property_type', 'project');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_formula_type') THEN
    CREATE TYPE public.commission_formula_type AS ENUM ('percent', 'fixed', 'hybrid');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commission_status') THEN
    CREATE TYPE public.commission_status AS ENUM ('draft', 'pending_supervisor', 'pending_admin', 'approved', 'paid', 'reversed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'salary_cycle_status') THEN
    CREATE TYPE public.salary_cycle_status AS ENUM ('draft', 'approved', 'locked', 'paid');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'salary_entry_status') THEN
    CREATE TYPE public.salary_entry_status AS ENUM ('draft', 'approved', 'paid');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_level') THEN
    CREATE TYPE public.approval_level AS ENUM ('supervisor', 'admin', 'dual');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_request_status') THEN
    CREATE TYPE public.approval_request_status AS ENUM ('pending', 'approved', 'rejected', 'revoked');
  END IF;
END;
$$;

-- =========================
-- PHASE 3 TABLES
-- =========================
CREATE TABLE IF NOT EXISTS public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid NOT NULL,
  actor_role public.app_role NOT NULL,
  team_id text,
  domain text NOT NULL,
  action text NOT NULL,
  entity_table text NOT NULL,
  entity_id uuid NOT NULL,
  entity_label text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_sensitive boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.record_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid NOT NULL,
  team_id text,
  entity_table text NOT NULL,
  entity_id uuid NOT NULL,
  change_type text NOT NULL,
  before_data jsonb,
  after_data jsonb,
  reason_code text,
  reason_text text,
  approval_request_id uuid
);

CREATE TABLE IF NOT EXISTS public.payment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_id uuid NOT NULL REFERENCES public.closings(id) ON DELETE CASCADE,
  team_id text,
  sequence_no int NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'ETB',
  status public.payment_status NOT NULL DEFAULT 'scheduled',
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_payment_schedules_closing_sequence UNIQUE (closing_id, sequence_no)
);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL REFERENCES public.payment_schedules(id) ON DELETE CASCADE,
  closing_id uuid NOT NULL REFERENCES public.closings(id) ON DELETE CASCADE,
  team_id text,
  paid_at timestamptz NOT NULL,
  amount_paid numeric NOT NULL CHECK (amount_paid > 0),
  method text NOT NULL,
  reference_no text,
  proof_url text,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  verified_by uuid,
  verified_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  priority int NOT NULL DEFAULT 100,
  scope_type public.commission_scope_type NOT NULL,
  scope_value text,
  formula_type public.commission_formula_type NOT NULL,
  percent_value numeric,
  fixed_value numeric,
  split_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  clawback_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  effective_from date NOT NULL,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.commission_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_id uuid NOT NULL REFERENCES public.closings(id),
  agent_id uuid NOT NULL,
  team_id text,
  rule_id uuid NOT NULL REFERENCES public.commission_rules(id),
  rule_snapshot jsonb NOT NULL,
  base_amount numeric NOT NULL,
  commission_amount numeric NOT NULL,
  status public.commission_status NOT NULL DEFAULT 'draft',
  approved_by_supervisor uuid,
  approved_at_supervisor timestamptz,
  approved_by_admin uuid,
  approved_at_admin timestamptz,
  paid_at timestamptz,
  payroll_cycle_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.salary_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_name text NOT NULL UNIQUE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status public.salary_cycle_status NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL,
  approved_by uuid,
  approved_at timestamptz,
  locked_by uuid,
  locked_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.salary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.salary_cycles(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL,
  team_id text,
  base_salary numeric NOT NULL DEFAULT 0,
  commission_total numeric NOT NULL DEFAULT 0,
  bonus_total numeric NOT NULL DEFAULT 0,
  deduction_total numeric NOT NULL DEFAULT 0,
  adjustment_total numeric NOT NULL DEFAULT 0,
  net_payable numeric NOT NULL DEFAULT 0,
  status public.salary_entry_status NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_salary_entries_cycle_agent UNIQUE (cycle_id, agent_id)
);

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  requested_by uuid NOT NULL,
  team_id text,
  domain text NOT NULL,
  entity_table text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  reason_code text,
  reason_text text,
  required_level public.approval_level NOT NULL,
  status public.approval_request_status NOT NULL DEFAULT 'pending',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.approval_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  acted_at timestamptz NOT NULL DEFAULT now(),
  acted_by uuid NOT NULL,
  actor_role public.app_role NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approve', 'reject', 'revoke')),
  comment text
);

-- back-reference commission entries to salary cycles when salary_cycles exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'salary_cycles') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'fk_commission_entries_payroll_cycle'
    ) THEN
      ALTER TABLE public.commission_entries
      ADD CONSTRAINT fk_commission_entries_payroll_cycle
      FOREIGN KEY (payroll_cycle_id)
      REFERENCES public.salary_cycles(id)
      ON DELETE SET NULL;
    END IF;
  END IF;
END;
$$;

-- =========================
-- SECURITY / RLS
-- =========================
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;

-- activity_events
CREATE POLICY p_activity_events_select_agent_own ON public.activity_events
FOR SELECT USING (actor_user_id = auth.uid());

CREATE POLICY p_activity_events_select_supervisor_team ON public.activity_events
FOR SELECT USING (
  public.has_role(auth.uid(), 'supervisor')
  AND team_id = public.get_user_team(auth.uid())
);

CREATE POLICY p_activity_events_all_admin_global ON public.activity_events
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- record_change_log
CREATE POLICY p_record_change_log_select_agent_own ON public.record_change_log
FOR SELECT USING (changed_by = auth.uid());

CREATE POLICY p_record_change_log_select_supervisor_team ON public.record_change_log
FOR SELECT USING (
  public.has_role(auth.uid(), 'supervisor')
  AND team_id = public.get_user_team(auth.uid())
);

CREATE POLICY p_record_change_log_all_admin_global ON public.record_change_log
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- payment_schedules
CREATE POLICY p_payment_schedules_select_agent_own ON public.payment_schedules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.closings c
    WHERE c.id = closing_id AND c.agent_id = auth.uid()
  )
);

CREATE POLICY p_payment_schedules_select_supervisor_team ON public.payment_schedules
FOR SELECT USING (
  public.has_role(auth.uid(), 'supervisor')
  AND team_id = public.get_user_team(auth.uid())
);

CREATE POLICY p_payment_schedules_insert_agent_own ON public.payment_schedules
FOR INSERT WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.closings c
    WHERE c.id = closing_id
      AND (c.agent_id = auth.uid() OR public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY p_payment_schedules_all_admin_global ON public.payment_schedules
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- payment_transactions
CREATE POLICY p_payment_transactions_select_agent_own ON public.payment_transactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.closings c
    WHERE c.id = closing_id AND c.agent_id = auth.uid()
  )
);

CREATE POLICY p_payment_transactions_select_supervisor_team ON public.payment_transactions
FOR SELECT USING (
  public.has_role(auth.uid(), 'supervisor')
  AND team_id = public.get_user_team(auth.uid())
);

CREATE POLICY p_payment_transactions_insert_supervisor_team ON public.payment_transactions
FOR INSERT WITH CHECK (
  created_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'admin') OR (
      public.has_role(auth.uid(), 'supervisor')
      AND team_id = public.get_user_team(auth.uid())
    )
  )
);

CREATE POLICY p_payment_transactions_all_admin_global ON public.payment_transactions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- commission_rules
CREATE POLICY p_commission_rules_select_all ON public.commission_rules
FOR SELECT USING (true);

CREATE POLICY p_commission_rules_all_admin_global ON public.commission_rules
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- commission_entries
CREATE POLICY p_commission_entries_select_agent_own ON public.commission_entries
FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY p_commission_entries_select_supervisor_team ON public.commission_entries
FOR SELECT USING (
  public.has_role(auth.uid(), 'supervisor')
  AND team_id = public.get_user_team(auth.uid())
);

CREATE POLICY p_commission_entries_insert_supervisor_team ON public.commission_entries
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'supervisor')
  AND team_id = public.get_user_team(auth.uid())
);

CREATE POLICY p_commission_entries_all_admin_global ON public.commission_entries
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- salary_cycles
CREATE POLICY p_salary_cycles_select_supervisor_team ON public.salary_cycles
FOR SELECT USING (public.has_role(auth.uid(), 'supervisor'));

CREATE POLICY p_salary_cycles_all_admin_global ON public.salary_cycles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- salary_entries
CREATE POLICY p_salary_entries_select_agent_own ON public.salary_entries
FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY p_salary_entries_select_supervisor_team ON public.salary_entries
FOR SELECT USING (
  public.has_role(auth.uid(), 'supervisor')
  AND team_id = public.get_user_team(auth.uid())
);

CREATE POLICY p_salary_entries_all_admin_global ON public.salary_entries
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- approval_requests
CREATE POLICY p_approval_requests_select_agent_own ON public.approval_requests
FOR SELECT USING (requested_by = auth.uid());

CREATE POLICY p_approval_requests_select_supervisor_team ON public.approval_requests
FOR SELECT USING (
  public.has_role(auth.uid(), 'supervisor')
  AND team_id = public.get_user_team(auth.uid())
);

CREATE POLICY p_approval_requests_insert_agent_own ON public.approval_requests
FOR INSERT WITH CHECK (requested_by = auth.uid());

CREATE POLICY p_approval_requests_all_admin_global ON public.approval_requests
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- approval_actions
CREATE POLICY p_approval_actions_select_scope ON public.approval_actions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.approval_requests ar
    WHERE ar.id = request_id
      AND (
        ar.requested_by = auth.uid()
        OR (public.has_role(auth.uid(), 'supervisor') AND ar.team_id = public.get_user_team(auth.uid()))
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

CREATE POLICY p_approval_actions_insert_approver ON public.approval_actions
FOR INSERT WITH CHECK (
  acted_by = auth.uid()
  AND (
    public.has_role(auth.uid(), 'supervisor') OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY p_approval_actions_all_admin_global ON public.approval_actions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- AUDITED ADMIN OVERRIDE
-- =========================
CREATE OR REPLACE FUNCTION public.admin_override_closing_status(
  _closing_id uuid,
  _new_status public.closing_status,
  _reason_code text,
  _reason_text text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before jsonb;
  v_after jsonb;
  v_team text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin_only';
  END IF;

  IF _reason_text IS NULL OR length(trim(_reason_text)) = 0 THEN
    RAISE EXCEPTION 'reason_required';
  END IF;

  SELECT to_jsonb(c.*), c.team_id
  INTO v_before, v_team
  FROM public.closings c
  WHERE c.id = _closing_id;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'closing_not_found';
  END IF;

  UPDATE public.closings
  SET status = _new_status
  WHERE id = _closing_id;

  SELECT to_jsonb(c.*) INTO v_after
  FROM public.closings c
  WHERE c.id = _closing_id;

  INSERT INTO public.record_change_log (
    changed_by,
    team_id,
    entity_table,
    entity_id,
    change_type,
    before_data,
    after_data,
    reason_code,
    reason_text
  )
  VALUES (
    auth.uid(),
    v_team,
    'closings',
    _closing_id,
    'override',
    v_before,
    v_after,
    _reason_code,
    _reason_text
  );

  INSERT INTO public.audit_logs (
    user_id,
    user_name,
    action,
    target_table,
    target_id,
    details
  )
  VALUES (
    auth.uid(),
    COALESCE((SELECT full_name FROM public.profiles WHERE id = auth.uid()), 'Admin'),
    'admin_override_closing_status',
    'closings',
    _closing_id::text,
    jsonb_build_object(
      'reason_code', _reason_code,
      'reason_text', _reason_text,
      'new_status', _new_status
    )
  );

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
    auth.uid(),
    'admin',
    v_team,
    'closings',
    'override',
    'closings',
    _closing_id,
    _closing_id::text,
    jsonb_build_object('new_status', _new_status, 'reason_code', _reason_code),
    true
  );
END;
$$;

-- =========================
-- INDEXES
-- =========================
CREATE INDEX IF NOT EXISTS idx_activity_events_occurred_at ON public.activity_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_actor_user ON public.activity_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_team ON public.activity_events(team_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_entity ON public.activity_events(entity_table, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_domain_action ON public.activity_events(domain, action);

CREATE INDEX IF NOT EXISTS idx_record_change_entity ON public.record_change_log(entity_table, entity_id);
CREATE INDEX IF NOT EXISTS idx_record_change_changed_at ON public.record_change_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_record_change_changed_by ON public.record_change_log(changed_by);

CREATE INDEX IF NOT EXISTS idx_payment_schedules_closing ON public.payment_schedules(closing_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON public.payment_schedules(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_closing ON public.payment_transactions(closing_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_schedule ON public.payment_transactions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_verify_status ON public.payment_transactions(verification_status);

CREATE INDEX IF NOT EXISTS idx_commission_entries_agent ON public.commission_entries(agent_id);
CREATE INDEX IF NOT EXISTS idx_commission_entries_closing ON public.commission_entries(closing_id);
CREATE INDEX IF NOT EXISTS idx_commission_entries_status ON public.commission_entries(status);
CREATE INDEX IF NOT EXISTS idx_commission_entries_team ON public.commission_entries(team_id);

CREATE INDEX IF NOT EXISTS idx_salary_entries_cycle ON public.salary_entries(cycle_id);
CREATE INDEX IF NOT EXISTS idx_salary_entries_agent ON public.salary_entries(agent_id);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON public.approval_requests(entity_table, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_request ON public.approval_actions(request_id);
