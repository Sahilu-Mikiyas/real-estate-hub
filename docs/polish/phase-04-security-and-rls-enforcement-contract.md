# Phase 4 — Security & RLS Enforcement Contract

## Purpose
This document defines the canonical security contract for application, API, and database layers.
It translates Phase 2 permissions and Phase 3 schema design into enforceable access control and audit behavior.

This phase is complete only when security behavior is deterministic and testable across all roles and scopes.

---

## 1) Security Model Overview

## 1.1 Access Strategy

1. **Authentication** proves user identity.
2. **Authorization** determines allowed action by role + scope.
3. **RLS** enforces final row-level permissions in database.
4. **Audit** records sensitive and privileged actions.

## 1.2 Scope Resolution

All authorization checks must resolve record scope to one of:

- `own`
- `team`
- `global`

Resolution sources:

1. `auth.uid()`
2. user role from `user_roles`
3. user team from `profiles.team_id`
4. record ownership and record team fields

## 1.3 Zero-Trust Rules

1. UI visibility is not security.
2. API/service checks are required for business guardrails.
3. DB must independently deny unauthorized row access.
4. Default deny for unknown role/action/scope combinations.

---

## 2) Layered Enforcement Responsibilities

## 2.1 Frontend Responsibilities

Frontend must:

1. Render only allowed actions for active role.
2. Prevent accidental submission of disallowed actions.
3. Show explicit “insufficient permissions” messaging.
4. Require reason text in elevated-action forms where needed.
5. Include correlation IDs in privileged mutation requests.

Frontend must not:

1. Assume hidden button means secure endpoint.
2. Expose sensitive fields when role lacks view permission.

## 2.2 API/Service Responsibilities

API/service layer must:

1. Recompute permissions per request.
2. Enforce business constraints that RLS alone cannot represent (state transitions, approval prerequisites).
3. Validate role-specific payload fields.
4. Write audit records for privileged actions.
5. Reject unknown transitions with typed errors.

## 2.3 Database/RLS Responsibilities

Database must:

1. Enable RLS for every table containing tenant/role-scoped data.
2. Use strict select/insert/update/delete policies by role+scope.
3. Enforce owner/team/global behavior without API dependence.
4. Deny privileged operations if policy predicates fail.
5. Apply immutable logging strategy for audit tables.

---

## 3) Mandatory Security Controls by Domain

## 3.1 Core Operational Tables

Tables:
- `leads`
- `lead_followups`
- `visits`
- `social_posts`
- `closings`
- `closing_documents`

Controls:

1. Agent: own rows only for mutable operations.
2. Supervisor: team rows for permitted actions.
3. Admin: global access with full audit on high-risk actions.
4. Status changes on critical entities must trigger change-log/audit event.

## 3.2 Financial Tables

Tables:
- `payment_schedules`
- `payment_transactions`
- `commission_entries`
- `salary_cycles`
- `salary_entries`

Controls:

1. Agent can only read own earnings-related rows.
2. Supervisors can review/approve team-relevant financial records per policy.
3. Admin controls payout finalization and payroll lock operations.
4. Override and reversal operations require reason + audit + approval evidence.

## 3.3 Governance Tables

Tables:
- `approval_requests`
- `approval_actions`
- `automation_rules`
- `automation_runs`
- `automation_failures`
- `activity_events`
- `record_change_log`
- `audit_logs`

Controls:

1. Non-admin users can only view governance rows within allowed scope.
2. Full audit visibility is admin-only by default.
3. Approval action rows are immutable after write.
4. Automation failure diagnostics may be restricted to supervisor/admin scope.

---

## 4) Policy Implementation Contract (RLS)

## 4.1 Policy Naming Convention

Use explicit policy names:

- `p_<table>_select_agent_own`
- `p_<table>_select_supervisor_team`
- `p_<table>_all_admin_global`
- `p_<table>_insert_agent_own`
- `p_<table>_update_supervisor_team`

## 4.2 Predicate Helpers

Standard helper functions (security definer where appropriate):

1. `get_user_role(_user_id uuid) returns app_role`
2. `get_user_team(_user_id uuid) returns text`
3. `has_role(_user_id uuid, _role app_role) returns boolean`
4. `is_same_team(_user_id uuid, _team_id text) returns boolean`

## 4.3 Row Predicates

1. **Own predicate**: `auth.uid() = <owner_column>`
2. **Team predicate**: `has_role(auth.uid(),'supervisor') and <team_column> = get_user_team(auth.uid())`
3. **Admin predicate**: `has_role(auth.uid(),'admin')`

## 4.4 Write Predicates

For inserts/updates:

1. Agent inserts must set owner to `auth.uid()`.
2. Team-scoped writes must include valid `team_id` mapping.
3. Financial writes requiring approval must be denied unless approval state is satisfied.

---

## 5) Sensitive Action Security Requirements

## 5.1 Sensitive Action Catalog

Sensitive actions include (minimum):

1. Closing transition to `completed`.
2. Commission approval/finalization/reversal.
3. Payroll cycle approval/lock/unlock.
4. Financial record delete.
5. Cross-team reassignment.
6. Role/team assignment changes.
7. Automation rule publish/pause for global scope.

## 5.2 Required Metadata

Each sensitive mutation must capture:

- `reason_code`
- `reason_text`
- `actor_user_id`
- `actor_role`
- `before_snapshot`
- `after_snapshot`
- `approval_request_id` (if gated)
- request correlation id

## 5.3 Guardrail Rules

1. Delete operations on financial artifacts should default to disallow; prefer reversal/void status.
2. Override operations require admin role and explicit reason.
3. Any mutation without required metadata must fail.

---

## 6) Approval Security Contract

1. Approval requests and decisions are append-only records.
2. Approval state machine must be validated server-side.
3. Dual approval flows must enforce distinct approvers when required by policy.
4. Finalizing action without successful approval chain must fail hard.

Allowed states:

- `pending -> approved`
- `pending -> rejected`
- `approved -> revoked` (admin-only and audited)

Disallowed transitions must return deterministic error codes.

---

## 7) Audit Logging Contract

## 7.1 Audit Event Classes

- `auth_event`
- `access_denied`
- `privileged_mutation`
- `financial_mutation`
- `approval_decision`
- `override_action`
- `automation_policy_change`

## 7.2 Mandatory Fields

Audit rows must include:

- event class
- actor identity
- role
- source layer (`ui`, `api`, `db-job`)
- domain/action
- entity reference
- timestamp
- request id/correlation id
- metadata payload

## 7.3 Immutability Rule

Audit records cannot be updated or deleted by non-admin users.
Even for admin, destructive audit operations are disallowed unless compliance policy explicitly allows archival workflows.

---

## 8) API Security Contract

## 8.1 Standard Error Surface

Return structured authorization/security errors:

- `AUTH_REQUIRED`
- `ROLE_FORBIDDEN`
- `SCOPE_FORBIDDEN`
- `APPROVAL_REQUIRED`
- `INVALID_STATE_TRANSITION`
- `MISSING_REASON_METADATA`

## 8.2 Endpoint Rules

1. All mutating endpoints require authenticated identity.
2. All privileged endpoints require role assertion and audit write on success/failure.
3. Export endpoints must log actor and filter context.
4. Bulk operations must validate every row scope, not just request-level scope.

---

## 9) Storage Security Contract

Buckets (existing + future) must enforce:

1. Path-level ownership constraints where applicable.
2. Team/global visibility where policy allows.
3. Signed URL generation with short expiry.
4. Access logging for sensitive documents.

Document classes:

- public-safe media (if explicitly allowed)
- private deal documents
- signatures and legal files

Private classes must never be publicly readable.

---

## 10) Observability & Security Monitoring

## 10.1 Required Monitoring

1. Unauthorized access attempt count by domain.
2. High-risk action frequency by actor/role.
3. Approval rejection ratio.
4. Override usage trend.
5. Automation rule publish/pause activity.

## 10.2 Alert Conditions

Trigger alerts for:

1. repeated forbidden access attempts,
2. unusually high override usage,
3. unexpected payroll/commission mutation spikes,
4. failed approval chain validations,
5. policy runtime failures.

---

## 11) Security Test Matrix Requirements

## 11.1 Role/Scope Tests

For each domain/action:

1. agent own allowed path
2. agent cross-user denied path
3. supervisor team allowed path
4. supervisor out-of-team denied path
5. admin global allowed path

## 11.2 Sensitive Action Tests

1. missing reason metadata -> rejected
2. approval required but absent -> rejected
3. invalid state transition -> rejected
4. valid approved flow -> success + audit created

## 11.3 RLS Tests

1. direct SQL/API fetch attempts against unauthorized rows must return empty/error as expected.
2. insert/update/delete attempts outside scope must fail.

## 11.4 Storage Access Tests

1. private document access by unauthorized role fails.
2. signed URL expiry behavior validated.

---

## 12) Completion Criteria for Phase 4

Phase 4 is complete when:

1. RLS policy set exists for all phase-relevant tables.
2. API/service authorization checks map to Phase 2 permission contract.
3. Sensitive actions enforce approval and reason metadata.
4. Audit logging is active and validated for privileged flows.
5. Security test matrix passes for role/scope/sensitive/storage cases.

---

## 13) Developer Handoff Outputs

Engineering must provide:

1. SQL migration files for new/updated RLS policies.
2. Policy verification tests (automated where possible).
3. API middleware authorization update summary.
4. Sensitive-action validation implementation notes.
5. Security QA evidence and failure case logs.
6. Monitoring dashboard definitions for security KPIs.

