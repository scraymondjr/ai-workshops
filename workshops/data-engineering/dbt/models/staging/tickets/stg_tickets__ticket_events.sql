-- TODO(d1): parse ticket events, normalize timestamps to UTC, dedupe event_id.
select payload, _loaded_at
from {{ source('tickets', 'tickets__events') }}
