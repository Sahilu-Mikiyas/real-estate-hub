-- Phase 5 smoke tests (manual/integration DB)

-- 1) Trigger side effects for core operational writes
-- Insert/update a lead as an authenticated test user, then verify:
-- select * from public.activity_events where entity_table = 'leads' order by occurred_at desc limit 1;
-- select * from public.record_change_log where entity_table = 'leads' order by changed_at desc limit 1;

-- 2) Sensitive table activity should mark is_sensitive=true for expected entities
-- select entity_table, is_sensitive from public.activity_events
-- where entity_table in ('closings','commission_entries','salary_cycles','salary_entries','approval_requests','approval_actions')
-- order by occurred_at desc;

-- 3) Audit explorer query function filters
-- select * from public.audit_explorer_query(
--   _team_id := 'team-alpha',
--   _domain := 'lead',
--   _date_from := now() - interval '7 days',
--   _limit := 50
-- );

-- 4) Explorer view returns actor profile enrichment
-- select actor_user_id, actor_name, actor_role, domain, action
-- from public.v_audit_explorer_recent
-- order by occurred_at desc
-- limit 20;
