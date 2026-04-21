# Phase 2 — Permission Matrix Finalization & Access Policy

## Purpose
This document finalizes the role-permission contract for the Real Estate Operating System.
It is the canonical implementation guide for frontend guards, backend authorization, and database RLS.

It defines:

1. Roles and scopes.
2. Domain/action matrix.
3. Sensitive action approval paths.
4. Enforcement requirements by layer (UI/API/DB).
5. Acceptance criteria for completion.

---

## 1) Roles, Scopes, and Terms

## 1.1 Roles

- **Agent**: Individual contributor with own-record execution access.
- **Supervisor**: Team manager with team operational oversight.
- **Admin**: Global governor with full platform authority and override rights.

## 1.2 Scope Levels

- **own**: Record is created by, assigned to, or belongs to current user.
- **team**: Record belongs to current user’s team.
- **global**: Any record in tenant.

## 1.3 Action Verbs

- `view`
- `create`
- `update`
- `delete`
- `reassign`
- `approve`
- `export`
- `override`
- `manage_rules`
- `manage_roles`
- `manage_system`

## 1.4 Decision Rules

1. Access is denied by default.
2. Role grants action; scope filters row visibility.
3. UI checks are convenience; DB/RLS is source of truth.
4. Sensitive operations require explicit approval path and reason capture.

---

## 2) Domain-by-Domain Permission Matrix

Legend:
- ✅ = Allowed
- 🟨 = Allowed with conditions
- ❌ = Not allowed

## 2.1 Leads

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view | ✅ own | ✅ team | ✅ global | Supervisor limited to team scope unless delegated |
| create | ✅ own | ✅ team | ✅ global | Creator must set valid ownership/team fields |
| update | ✅ own | ✅ team | ✅ global | Status changes must be logged |
| delete | ❌ | 🟨 team | ✅ global | Supervisor delete may be disabled by policy |
| reassign | ❌ | ✅ team | ✅ global | Reassignment requires reason |
| export | ✅ own | ✅ team | ✅ global | Export logging required |
| override | ❌ | ❌ | ✅ global | Admin override audit mandatory |

## 2.2 Lead Followups

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view | ✅ own | ✅ team | ✅ global | Timeline visibility follows lead scope |
| create | ✅ own | ✅ team | ✅ global | Must include action type |
| update | ✅ own | ✅ team | ✅ global | Edits must preserve history |
| delete | ❌ | 🟨 team | ✅ global | Soft-delete preferred; keep audit |
| export | ✅ own | ✅ team | ✅ global | PII masking policy applies |

## 2.3 Visits

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view | ✅ own | ✅ team | ✅ global | |
| create | ✅ own | ✅ team | ✅ global | |
| update | ✅ own | ✅ team | ✅ global | Outcome and date changes logged |
| delete | ❌ | 🟨 team | ✅ global | Policy-controlled supervisor delete |
| reassign | ❌ | ✅ team | ✅ global | Reason required |
| export | ✅ own | ✅ team | ✅ global | |

## 2.4 Social Posts (Internal Logging)

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view | ✅ own | ✅ team | ✅ global | |
| create | ✅ own | ✅ team | ✅ global | |
| update | ✅ own | ✅ team | ✅ global | |
| delete | ✅ own | 🟨 team | ✅ global | Supervisor delete optional by policy |
| export | ✅ own | ✅ team | ✅ global | |

## 2.5 Closings

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view | ✅ own | ✅ team | ✅ global | |
| create | ✅ own | ✅ team | ✅ global | Required deal fields enforced |
| update | ✅ own | ✅ team | ✅ global | Field-level audit on financial fields |
| delete | ❌ | ❌ | ✅ global | Delete requires explicit reason |
| approve status | ❌ | ✅ team | ✅ global | Configurable approval gates |
| export | ✅ own | ✅ team | ✅ global | |
| override | ❌ | ❌ | ✅ global | Includes reversal trail |

## 2.6 Closing Documents & Signatures

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view | ✅ own | ✅ team | ✅ global | Bucket/path rules enforced |
| upload | ✅ own | ✅ team | ✅ global | Uploader identity captured |
| delete | ✅ own | 🟨 team | ✅ global | Keep metadata audit after delete |
| download | ✅ own | ✅ team | ✅ global | Signed URL usage logged |

## 2.7 Properties / Inventory

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view | ✅ limited | ✅ team/global-view | ✅ global | Agent may be restricted to available |
| create | ❌ | 🟨 team | ✅ global | Policy can allow supervisor create |
| update | ❌ | 🟨 team | ✅ global | Status changes audited |
| delete | ❌ | ❌ | ✅ global | Hard delete discouraged |
| export | ✅ allowed set | ✅ team/global-view | ✅ global | |

## 2.8 Rewards / Scoring Rules / Badges

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view rules | ✅ | ✅ | ✅ | |
| manage rules | ❌ | ❌ | ✅ | Global config only |
| view rewards | ✅ | ✅ | ✅ | |
| assign/revoke badges | ❌ | 🟨 team | ✅ global | Optional supervisor capability |

## 2.9 Notifications

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view | ✅ own | ✅ own/team-managed | ✅ global | |
| mark read | ✅ own | ✅ own/team-managed | ✅ global | |
| create broadcast | ❌ | 🟨 team | ✅ global | Supervisor broadcast optional |
| manage templates | ❌ | ❌ | ✅ global | |

## 2.10 Team Overview & Agent Profiles

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view own profile | ✅ | ✅ | ✅ | |
| view agent detail | ❌ | ✅ team | ✅ global | |
| compare agents | ❌ | ✅ team | ✅ global | |
| edit profile fields | ✅ own limited | 🟨 team limited | ✅ global | Role/team fields admin-only |

## 2.11 User & Role Administration

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view users | ❌ | 🟨 team | ✅ global | Supervisor view may be limited |
| invite user | ❌ | 🟨 team | ✅ global | Team-scoped invite policy |
| assign role | ❌ | ❌ | ✅ global | Must be audited |
| change team | ❌ | 🟨 team | ✅ global | Team-bound for supervisors |
| deactivate/suspend | ❌ | ❌ | ✅ global | Mandatory reason |

## 2.12 Financial Domain (Payments, Commissions, Salary)

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view own earnings | ✅ own | ✅ own | ✅ global | |
| view team earnings | ❌ | ✅ team | ✅ global | |
| create payment schedule | ❌ | ✅ team | ✅ global | Must tie to valid closing |
| post payment | ❌ | 🟨 team | ✅ global | Verification policy applies |
| approve commission | ❌ | ✅ team (first gate) | ✅ global (final gate) | Dual-approval configurable |
| run payroll cycle | ❌ | ❌ | ✅ global | Lock/unlock audit required |
| financial override | ❌ | ❌ | ✅ global | High-risk action controls |

## 2.13 Audit Logs & Compliance

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view own action log | ✅ own | ✅ own | ✅ own/global | |
| view team audit | ❌ | ✅ team | ✅ global | |
| view full audit | ❌ | ❌ | ✅ global | |
| export audit | ❌ | 🟨 team summary | ✅ global | Exports must be logged |

## 2.14 Automation Rules

| Action | Agent | Supervisor | Admin | Conditions |
|---|---|---|---|---|
| view active rules | ✅ relevant | ✅ team/global relevant | ✅ global | |
| create/edit team rule | ❌ | 🟨 team | ✅ global | Requires policy toggle |
| create/edit global rule | ❌ | ❌ | ✅ global | |
| pause/resume rule | ❌ | 🟨 team | ✅ global | Pauses are audited |
| view run logs | ❌ | ✅ team | ✅ global | |

---

## 3) Sensitive Actions Requiring Approval or Elevated Handling

## 3.1 Approval-required actions

1. Closing status transitions into `completed` (optional first gate by supervisor, final by admin policy).
2. Commission entry approval and payout release.
3. Salary cycle lock and unlock.
4. Deletion of closings or financial records.
5. Cross-team reassignment by non-admin users.

## 3.2 Mandatory metadata on sensitive actions

Each sensitive action must capture:

- `reason_code`
- `reason_text`
- `acted_by`
- `acted_at`
- `before_snapshot`
- `after_snapshot`
- `approval_chain_id` (if applicable)

---

## 4) Enforcement Architecture (UI/API/DB)

## 4.1 Frontend (UI)

Frontend must:

1. Hide unavailable actions based on role and scope.
2. Disable controls when conditions fail.
3. Display explanatory permission messages.
4. Never assume hidden action equals security.

## 4.2 API / Service Layer

Service layer must:

1. Re-validate user role and scope for every mutating action.
2. Validate business preconditions (required fields, valid states).
3. Enforce approval requirements before commit.
4. Write audit entries for sensitive actions.

## 4.3 Database / RLS

Database must:

1. Use RLS to enforce row visibility and write eligibility.
2. Enforce relationship integrity for ownership/team constraints.
3. Block unauthorized reads/writes regardless of API path.
4. Apply least-privilege defaults.

---

## 5) Canonical Permission Mapping Object (Implementation Contract)

Teams should implement a canonical permission schema in code/config similar to:

```ts
permission = {
  domain: "closings",
  action: "approve",
  allowed_roles: ["supervisor", "admin"],
  allowed_scope: ["team", "global"],
  requires_reason: true,
  requires_approval_chain: true,
  audit_level: "high"
}
```

Notes:

1. This object is a contract concept; concrete implementation may vary.
2. All UI guards and backend checks should map to same canonical rule source.

---

## 6) Validation Checklist for Phase 2 Completion

Phase 2 is complete when all are true:

1. Every domain/action used in product has explicit role + scope mapping.
2. Sensitive actions have reason/audit/approval requirements documented.
3. Permission contract is translated into both frontend guard model and backend enforcement model.
4. RLS policy plan exists for all affected entities.
5. QA has a role-action test matrix for all critical flows.

---

## 7) Developer Handoff Requirements

Before implementation starts, engineering must provide:

1. Permission matrix traceability doc (`feature -> domain/action -> policy`).
2. RLS migration plan by table.
3. Backend authorization middleware/update plan.
4. UI component authorization checklist.
5. QA role-scope test matrix.

