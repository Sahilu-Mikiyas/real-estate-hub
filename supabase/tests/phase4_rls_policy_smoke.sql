-- Phase 4 RLS smoke tests (manual/CI SQL harness)
-- Expected usage: run in a controlled test environment with dedicated users and seeded data.

-- 1) Agent cannot access /admin-only governance data
-- Expect zero rows or permission error when agent queries audit logs
-- select * from public.audit_logs;

-- 2) Agent can only select own commission entries
-- set request.jwt.claim.sub = '<agent_user_id>';
-- select count(*) from public.commission_entries where agent_id != auth.uid(); -- expect 0

-- 3) Supervisor can view team-scoped approval requests
-- set request.jwt.claim.sub = '<supervisor_user_id>';
-- select * from public.approval_requests where team_id = public.get_user_team(auth.uid()); -- expect rows in-team only

-- 4) Admin override function requires reason text
-- select public.admin_override_closing_status('<closing_id>'::uuid, 'pending', 'manual_fix', ''); -- expect reason_required error

-- 5) Admin override creates immutable traces
-- select public.admin_override_closing_status('<closing_id>'::uuid, 'pending', 'manual_fix', 'Data correction after legal review');
-- select * from public.record_change_log where entity_table = 'closings' and entity_id = '<closing_id>'::uuid order by changed_at desc limit 1;
-- select * from public.activity_events where entity_table = 'closings' and entity_id = '<closing_id>'::uuid order by occurred_at desc limit 1;

-- 6) Approval actions are append-only by design (no update policy for non-admin)
-- set request.jwt.claim.sub = '<supervisor_user_id>';
-- update public.approval_actions set comment = 'edit' where id = '<action_id>'::uuid; -- expect denied
