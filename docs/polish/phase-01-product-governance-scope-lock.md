# Phase 1 — Product Governance & Scope Lock

## Purpose
This document is the Phase 1 execution artifact for the Real Estate Operating System initiative.
It establishes:

1. Scope lock (what is in and out).
2. A feature glossary (canonical definitions).
3. KPI map (success metrics and measurement contracts).
4. Global decision and change-control rules.

---

## 1) Scope Lock

### 1.1 In Scope (Approved Product Surface)

The platform includes all of the following module domains:

1. **Authentication & Identity**
   - Login/signup/password reset.
   - Session handling and sign-out.

2. **Role-Aware Internal Workspace**
   - Agent, Supervisor, Admin internal roles.
   - Role-specific navigation, views, and actions.

3. **Core Sales Pipeline**
   - Leads.
   - Lead follow-up timeline and status movement.
   - Visits calendar and outcomes.
   - Social activity logging.
   - Deal closings and associated documents.

4. **Inventory & Showroom Experience**
   - Inventory management for internal users.
   - Enhanced block/building-centric showroom with split Gallery + Details expanded views.

5. **Supervisor Oversight**
   - Team-level activity visibility.
   - Record-level "who did what" history.
   - SLA/aging compliance views.

6. **Admin Governance**
   - User/role/team management.
   - Rules and configuration controls.
   - Full audit and override capabilities with guardrails.

7. **Financial Operations (Internal Automation Focus)**
   - Payment schedule tracking.
   - Commission calculation and approval flow.
   - Salary tracking and payroll status visibility on agent dashboard.

8. **Workflow Automation**
   - Trigger-action operational rules.
   - Escalation and reminder orchestration.

9. **Analytics and Reporting**
   - Pipeline, performance, compliance, and finance visibility.

10. **Quality & Reliability Layer**
    - Security-first implementation.
    - RLS and auditability enforcement.
    - Observability and testability standards.

### 1.2 Out of Scope (Phase 1 Governance Lock)

The following are not approved in current scope unless separately signed off:

1. Public marketplace listing portal as a standalone consumer product.
2. External broker ecosystem and multi-agency federation.
3. Multi-country tax/payroll legal engine (only configurable internal modeling is included).
4. Native mobile apps (web responsive first; native can be added later).
5. AI co-pilot generation features not tied to deterministic business logic.

### 1.3 Hard Constraints

1. **Security is non-negotiable**: no frontend-only access control.
2. **Auditability is non-negotiable**: privileged and financial actions must be traceable.
3. **Financial correctness is non-negotiable**: calculations must be deterministic and reproducible.
4. **Product consistency is non-negotiable**: one canonical definition per metric and workflow state.

---

## 2) Canonical Feature Glossary

Use these definitions in product, engineering, QA, analytics, and documentation.

### 2.1 People & Access

- **Agent**: frontline operator who executes sales pipeline tasks and manages own records.
- **Supervisor**: team manager with team-scope visibility and coaching/approval responsibilities.
- **Admin**: platform governor with global access and configuration authority.
- **Role Scope**:
  - **Own**: records created by or assigned to the current user.
  - **Team**: records linked to current user’s team.
  - **Global**: all records in tenant/system.

### 2.2 Pipeline Entities

- **Lead**: prospective buyer/customer record with contact and interest context.
- **Lead Status**: stage marker in lifecycle (`new`, `contacted`, `potential`, `negotiating`, `closed`, `lost`).
- **Lead Follow-up**: logged action taken on a lead (note, call, email, meeting, reminder, status change).
- **Visit**: scheduled or completed property/office interaction with a client.
- **Social Post**: logged marketing/social touchpoint activity by an agent.
- **Closing**: finalized deal workflow with buyer/seller/price/commission/document fields.

### 2.3 Property Domain

- **Property**: sale unit with type, location, block, price, status, specs, and media.
- **Block**: locality/section grouping used to organize multiple properties.
- **Showroom**: visual discovery experience for properties with strong browsing UX.
- **Expanded Property View**: full-screen or modal view split into Gallery and Details sections.

### 2.4 Financial Domain

- **Payment Schedule**: timeline of expected payments for a deal.
- **Payment Transaction**: actual payment event posted against a schedule item.
- **Commission Rule**: formula/config determining commission calculation and split.
- **Commission Entry**: computed payable amount tied to a qualifying event.
- **Salary Cycle**: payroll period container for fixed + variable compensation.
- **Salary Entry**: user-level compensation record for a salary cycle.

### 2.5 Governance & Reliability

- **Audit Log**: immutable event record of privileged or sensitive actions.
- **Override**: exceptional admin action that bypasses default path and requires reason capture.
- **SLA Breach**: violation of expected response/action time objective.
- **Automation Rule**: condition-action definition for workflow automation.
- **Automation Run**: one execution instance of an automation rule.

---

## 3) KPI Map (Measurement Contract)

### 3.1 KPI Design Principles

1. Every KPI must have one owner and one canonical formula.
2. Every KPI must define scope: own/team/global.
3. KPI computation must be reproducible from source-of-truth records.
4. Dashboards and exports must use the same underlying definition.

### 3.2 Core Operational KPIs

1. **Lead Response SLA Compliance %**
   - Definition: Percentage of new leads receiving first action within SLA target.
   - Formula: `(leads responded within SLA / total new leads) * 100`.
   - Owner: Supervisor ops.

2. **Follow-up Compliance %**
   - Definition: Percentage of due follow-up actions completed on time.
   - Formula: `(completed due follow-ups on time / total due follow-ups) * 100`.
   - Owner: Supervisor ops.

3. **Stage Conversion Rates**
   - Definition: Conversion ratio between adjacent lead stages.
   - Formula example: `potential -> negotiating conversions / total potential leads`.
   - Owner: Sales performance.

4. **Stage Aging (Median Days)**
   - Definition: Median number of days records stay in each stage.
   - Owner: Supervisor + management.

5. **Visit-to-Closing Conversion %**
   - Definition: % of visits that eventually result in completed closings.
   - Owner: Revenue operations.

### 3.3 Financial KPIs

1. **Total Revenue (Completed Closings)**
   - Sum of `deal_price` for `status = completed` closings.
   - Owner: Finance operations.

2. **Total Commission Liability**
   - Sum of all approved/unpaid commission entries.
   - Owner: Finance operations.

3. **Commission Payout Timeliness %**
   - `% of approved commission entries paid within target payout window`.
   - Owner: Payroll/finance.

4. **Salary Processing Turnaround**
   - Time from salary cycle draft creation to paid status.
   - Owner: Payroll operations.

5. **Overdue Payment Ratio %**
   - `% of scheduled payments currently overdue`.
   - Owner: Collections/finance.

### 3.4 Quality & Governance KPIs

1. **Audit Coverage %**
   - `% of privileged actions producing valid audit records`.
   - Owner: Admin governance.

2. **Unauthorized Access Incidents**
   - Count of blocked unauthorized access attempts.
   - Owner: Security/admin.

3. **Data Completeness Score**
   - Weighted completeness score for critical records (lead, closing, payment).
   - Owner: Data quality.

4. **Duplicate Lead Ratio %**
   - `% of newly created leads flagged as probable duplicates`.
   - Owner: Data quality + sales ops.

### 3.5 UX & Adoption KPIs

1. **Weekly Active Users by Role**
2. **Median Time to Log Follow-up**
3. **Median Time to Create Closing**
4. **Dashboard Usage Depth (widgets interacted/session)**
5. **Task Completion Rate (in-app operational tasks)**

---

## 4) Acceptance Criteria for Phase 1 Completion

Phase 1 is considered complete when:

1. Scope in/out boundaries are signed off by product + engineering + operations.
2. Glossary terms are accepted as canonical and referenced by all future specs.
3. KPI list and formula definitions are approved with named owners.
4. Changes to scope/definitions are placed under change-control policy.
5. This document is linked in project docs as the governance baseline.

---

## 5) Change-Control Rules (Post Scope Lock)

1. **Change Request Required** for:
   - new module introduction,
   - role-permission changes,
   - KPI formula modifications,
   - financial logic changes.

2. Change request must include:
   - business reason,
   - impact analysis (security, data, UI, analytics),
   - migration/backward compatibility notes,
   - test plan updates.

3. No implementation starts until request is approved by:
   - Product owner,
   - Engineering lead,
   - Security/ops owner (if relevant).

---

## 6) Instruction to Development Teams

All subsequent implementation documents must:

1. Reference this governance file explicitly.
2. Use glossary terms exactly as defined.
3. Map every new feature to at least one approved KPI.
4. Include role-scope behavior using own/team/global matrix.
5. Include audit and RLS implications before merge.

