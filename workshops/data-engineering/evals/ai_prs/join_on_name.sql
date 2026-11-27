-- AI-written model. Review it before merge.
select t.ticket_id, a.plan
from tickets t
join dim_accounts a on a.display_name = t.company_name
