# Phase 3 — Data Model Expansion Blueprint

## Purpose
This document defines the canonical data-model expansion required to support:

1. Supervisor visibility and action traceability.
2. Financial operations (payments, commissions, salary cycles).
3. Approval workflows for sensitive actions.
4. Workflow automation runtime and observability.

It is the implementation contract for schema design, migrations, and downstream service logic.

---

## 1) Design Principles

1. **Compatibility-first**
   - Extend current entities without breaking existing product flows.
2. **Auditability-by-default**
   - Sensitive fields and transitions must be reconstructable from persisted data.
3. **RLS-ready shape**
   - New tables must include fields required for own/team/global access enforcement.
4. **Financial determinism**
   - Derived payouts must be reproducible from immutable event + rule snapshots.
5. **Automation observability**
   - Every automation execution must be traceable and debuggable.

---

## 2) Existing Foundation (Reference)

Current schema already includes the main operational entities and role enums. This phase extends rather than replaces that model.

Key existing entities (already present):

- `profiles`, `user_roles`
- `leads`, `lead_followups`, `visits`, `social_posts`
- `closings`, `closing_documents`
- `properties`, `scoring_rules`, `badges`, `agent_badges`, `rewards`
- `notifications`, `audit_logs`, `profile_preferences`

---

## 3) New Entity Set (Phase 3)

## 3.1 Activity & Change Tracking

### 3.1.1 `activity_events`

Purpose: unified actor/event timeline for operations and supervision.

**Columns**

- `id uuid pk default gen_random_uuid()`
- `occurred_at timestamptz not null default now()`
- `actor_user_id uuid not null`
- `actor_role app_role not null`
- `team_id text null`
- `domain text not null` -- e.g. leads, visits, closings, finance
- `action text not null` -- e.g. create, update, status_change, approve
- `entity_table text not null`
- `entity_id uuid not null`
- `entity_label text null`
- `metadata jsonb not null default '{}'::jsonb`
- `is_sensitive boolean not null default false`

**Indexes**

- `idx_activity_events_occurred_at`
- `idx_activity_events_actor_user`
- `idx_activity_events_team`
- `idx_activity_events_entity`
- `idx_activity_events_domain_action`

### 3.1.2 `record_change_log`

Purpose: field-level before/after tracking for auditable updates.

**Columns**

- `id uuid pk`
- `changed_at timestamptz not null default now()`
- `changed_by uuid not null`
- `team_id text null`
- `entity_table text not null`
- `entity_id uuid not null`
- `change_type text not null` -- update/delete/restore/override
- `before_data jsonb null`
- `after_data jsonb null`
- `reason_code text null`
- `reason_text text null`
- `approval_request_id uuid null`

**Indexes**

- `idx_record_change_entity`
- `idx_record_change_changed_at`
- `idx_record_change_changed_by`

---

## 3.2 Financial Operations

### 3.2.1 `payment_schedules`

Purpose: payment plan per closing.

**Columns**

- `id uuid pk`
- `closing_id uuid not null references closings(id) on delete cascade`
- `team_id text null`
- `sequence_no int not null`
- `due_date date not null`
- `amount numeric not null check (amount >= 0)`
- `currency text not null default 'ETB'`
- `status payment_status not null default 'scheduled'`
- `notes text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

**Uniqueness**

- `(closing_id, sequence_no)` unique

### 3.2.2 `payment_transactions`

Purpose: posted payment events against scheduled items.

**Columns**

- `id uuid pk`
- `schedule_id uuid not null references payment_schedules(id) on delete cascade`
- `closing_id uuid not null references closings(id) on delete cascade`
- `team_id text null`
- `paid_at timestamptz not null`
- `amount_paid numeric not null check (amount_paid > 0)`
- `method text not null` -- bank/cash/card/transfer/etc.
- `reference_no text null`
- `proof_url text null`
- `verification_status verification_status not null default 'pending'`
- `verified_by uuid null`
- `verified_at timestamptz null`
- `created_by uuid not null`
- `created_at timestamptz not null default now()`

**Indexes**

- `idx_payment_tx_closing`
- `idx_payment_tx_schedule`
- `idx_payment_tx_paid_at`
- `idx_payment_tx_verify_status`

### 3.2.3 `commission_rules`

Purpose: configurable formula and split policy.

**Columns**

- `id uuid pk`
- `name text not null unique`
- `is_active boolean not null default true`
- `priority int not null default 100`
- `scope_type commission_scope_type not null` -- global/team/property_type/project
- `scope_value text null`
- `formula_type commission_formula_type not null` -- percent/fixed/hybrid
- `percent_value numeric null`
- `fixed_value numeric null`
- `split_config jsonb not null default '{}'::jsonb`
- `clawback_config jsonb not null default '{}'::jsonb`
- `effective_from date not null`
- `effective_to date null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### 3.2.4 `commission_entries`

Purpose: generated payout obligations.

**Columns**

- `id uuid pk`
- `closing_id uuid not null references closings(id)`
- `agent_id uuid not null`
- `team_id text null`
- `rule_id uuid not null references commission_rules(id)`
- `rule_snapshot jsonb not null` -- immutable rule copy at generation time
- `base_amount numeric not null`
- `commission_amount numeric not null`
- `status commission_status not null default 'draft'`
- `approved_by_supervisor uuid null`
- `approved_at_supervisor timestamptz null`
- `approved_by_admin uuid null`
- `approved_at_admin timestamptz null`
- `paid_at timestamptz null`
- `payroll_cycle_id uuid null`
- `notes text null`
- `created_at timestamptz not null default now()`

**Indexes**

- `idx_commission_entries_agent`
- `idx_commission_entries_closing`
- `idx_commission_entries_status`
- `idx_commission_entries_team`

### 3.2.5 `salary_cycles`

Purpose: payroll period container.

**Columns**

- `id uuid pk`
- `cycle_name text not null unique` -- e.g. 2026-04
- `period_start date not null`
- `period_end date not null`
- `status salary_cycle_status not null default 'draft'`
- `created_by uuid not null`
- `approved_by uuid null`
- `approved_at timestamptz null`
- `locked_by uuid null`
- `locked_at timestamptz null`
- `paid_at timestamptz null`
- `created_at timestamptz not null default now()`

### 3.2.6 `salary_entries`

Purpose: agent-level payable statement for cycle.

**Columns**

- `id uuid pk`
- `cycle_id uuid not null references salary_cycles(id) on delete cascade`
- `agent_id uuid not null`
- `team_id text null`
- `base_salary numeric not null default 0`
- `commission_total numeric not null default 0`
- `bonus_total numeric not null default 0`
- `deduction_total numeric not null default 0`
- `adjustment_total numeric not null default 0`
- `net_payable numeric not null default 0`
- `status salary_entry_status not null default 'draft'`
- `notes text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

**Uniqueness**

- `(cycle_id, agent_id)` unique

---

## 3.3 Approval Workflow

### 3.3.1 `approval_requests`

Purpose: approval envelope for sensitive actions.

**Columns**

- `id uuid pk`
- `created_at timestamptz not null default now()`
- `requested_by uuid not null`
- `team_id text null`
- `domain text not null`
- `entity_table text not null`
- `entity_id uuid not null`
- `action text not null`
- `reason_code text null`
- `reason_text text null`
- `required_level approval_level not null` -- supervisor/admin/dual
- `status approval_request_status not null default 'pending'`
- `payload jsonb not null default '{}'::jsonb` -- context for approvers

### 3.3.2 `approval_actions`

Purpose: actor-by-actor decision history for request.

**Columns**

- `id uuid pk`
- `request_id uuid not null references approval_requests(id) on delete cascade`
- `acted_at timestamptz not null default now()`
- `acted_by uuid not null`
- `actor_role app_role not null`
- `decision approval_decision not null` -- approved/rejected/revoked
- `comment text null`
- `metadata jsonb not null default '{}'::jsonb`

**Indexes**

- `idx_approval_actions_request`
- `idx_approval_actions_actor`

---

## 3.4 Automation Runtime

### 3.4.1 `automation_rules`

Purpose: declarative trigger-action definitions.

**Columns**

- `id uuid pk`
- `name text not null unique`
- `is_active boolean not null default true`
- `scope automation_scope not null default 'global'` -- global/team
- `team_id text null`
- `trigger_domain text not null`
- `trigger_event text not null`
- `trigger_condition jsonb not null default '{}'::jsonb`
- `actions jsonb not null default '[]'::jsonb`
- `cooldown_seconds int not null default 0`
- `created_by uuid not null`
- `updated_by uuid null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### 3.4.2 `automation_runs`

Purpose: execution log for automation rules.

**Columns**

- `id uuid pk`
- `rule_id uuid not null references automation_rules(id)`
- `triggered_at timestamptz not null default now()`
- `trigger_entity_table text not null`
- `trigger_entity_id uuid not null`
- `status automation_run_status not null default 'queued'`
- `attempt_count int not null default 0`
- `started_at timestamptz null`
- `finished_at timestamptz null`
- `result jsonb not null default '{}'::jsonb`
- `error_message text null`

### 3.4.3 `automation_failures`

Purpose: durable failure mailbox for retries and diagnostics.

**Columns**

- `id uuid pk`
- `run_id uuid not null references automation_runs(id) on delete cascade`
- `failed_at timestamptz not null default now()`
- `error_class text null`
- `error_message text not null`
- `stack_trace text null`
- `retryable boolean not null default true`
- `resolved boolean not null default false`
- `resolved_at timestamptz null`
- `resolved_by uuid null`

---

## 4) New Enums (Canonical)

```sql
create type payment_status as enum ('scheduled','partial','paid','overdue','cancelled');
create type verification_status as enum ('pending','verified','rejected');
create type commission_scope_type as enum ('global','team','property_type','project');
create type commission_formula_type as enum ('percent','fixed','hybrid');
create type commission_status as enum ('draft','pending_supervisor','pending_admin','approved','paid','reversed','cancelled');
create type salary_cycle_status as enum ('draft','reviewed','approved','locked','paid');
create type salary_entry_status as enum ('draft','approved','paid','held');
create type approval_level as enum ('supervisor','admin','dual');
create type approval_request_status as enum ('pending','approved','rejected','cancelled');
create type approval_decision as enum ('approved','rejected','revoked');
create type automation_scope as enum ('global','team');
create type automation_run_status as enum ('queued','running','succeeded','failed','cancelled');
```

---

## 5) Relationship Blueprint (Text ERD)

1. `closings 1--n payment_schedules`
2. `payment_schedules 1--n payment_transactions`
3. `commission_rules 1--n commission_entries`
4. `closings 1--n commission_entries`
5. `salary_cycles 1--n salary_entries`
6. `approval_requests 1--n approval_actions`
7. `automation_rules 1--n automation_runs`
8. `automation_runs 1--n automation_failures`
9. Cross-domain references:
   - `commission_entries.payroll_cycle_id -> salary_cycles.id`
   - `record_change_log.approval_request_id -> approval_requests.id`

---

## 6) RLS Policy Plan (High-Level)

For every new table, implement policies based on:

1. **Agent**: own scope only (or own financial rows).
2. **Supervisor**: team scope rows.
3. **Admin**: global scope.

### 6.1 Policy examples

- `payment_schedules`/`payment_transactions`
  - Agent: view own closings-related rows only.
  - Supervisor: team rows.
  - Admin: all rows.

- `commission_entries`
  - Agent: view own entries.
  - Supervisor: view/approve team entries.
  - Admin: full lifecycle control.

- `salary_entries`
  - Agent: view own entry.
  - Supervisor: team visibility.
  - Admin: manage globally.

- `approval_requests/actions`
  - Requester can view own requests.
  - Supervisor/admin visibility by scope and role.

- `automation_rules/runs/failures`
  - Team rules visible to supervisors within team.
  - Global rules and full logs admin-visible.

---

## 7) Migration Strategy

## 7.1 Migration Order

1. Add enums.
2. Add base tables without strict foreigns that create cycle risk.
3. Add foreign key constraints.
4. Add indexes.
5. Add triggers for `updated_at` maintenance where needed.
6. Enable RLS and create policies.
7. Backfill data where required.

## 7.2 Backfill Strategy

1. Create `activity_events` from existing key operations (optional historical minimum backfill).
2. Backfill `commission_entries` for completed closings (if policy requires retroactive consistency).
3. Create initial `salary_cycles`/`salary_entries` only if payroll starts immediately.

## 7.3 Rollback Strategy

1. Keep additive migrations where possible.
2. Avoid destructive schema changes in Phase 3.
3. Use feature flags to delay runtime dependency on new tables.

---

## 8) Data Integrity Rules

1. Payment totals must never exceed closing amount unless override is approved.
2. `commission_entries.rule_snapshot` must be immutable after approval.
3. `salary_entries.net_payable` must equal:
   `base + commission + bonus + adjustment - deduction`.
4. Approval transitions must follow valid state machine.
5. Automation run status transitions must be linear and terminal-safe.

---

## 9) Performance Requirements

1. Index all high-frequency query axes: `team_id`, `status`, `created_at`, `actor_user_id`, `entity_id`.
2. Keep JSONB payloads bounded and structured for queryability.
3. Add materialized views only after real query profiling indicates need.
4. Use pagination on activity/audit/automation logs by default.

---

## 10) Phase 3 Completion Criteria

Phase 3 is complete when:

1. All new schema objects are defined and peer-reviewed.
2. Enum/state transitions are documented and accepted.
3. RLS policy plan exists for every new table.
4. Migration order and rollback plan are approved.
5. Data integrity rules are testable and included in QA plan.

---

## 11) Developer Handoff Outputs

Before Phase 4 starts, engineering must deliver:

1. SQL migration files implementing this blueprint.
2. RLS policies and policy tests for each new table.
3. Seed fixtures for non-production validation.
4. Updated TypeScript DB types.
5. Service-layer contract updates for new entities.
6. QA matrix for permissions + financial consistency + approval paths.

