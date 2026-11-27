-- AI-written model. Review it before merge.
select account_id, sum(daily_mrr) as mrr_cents
from daily_subscription_mrr
group by account_id
