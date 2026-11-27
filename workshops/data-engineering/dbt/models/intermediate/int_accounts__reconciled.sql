-- TODO(d4): billing wins plan and seats when billing.updated_at >= crm.updated_at.
-- CRM wins owner and segment. Fill conflict_fields. Do not invent a reconciled value.
select
  null::varchar as account_id,
  null::varchar as plan,
  null::integer as seats,
  null::varchar as plan_source,
  null::varchar[] as conflict_fields
where false
