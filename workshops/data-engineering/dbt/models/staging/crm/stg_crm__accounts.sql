-- TODO(d1): parse payload, normalize email with lower(trim(...)), dedupe.
select payload, _loaded_at
from {{ source('crm', 'crm__accounts') }}
