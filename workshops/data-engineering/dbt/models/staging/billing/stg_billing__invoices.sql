-- TODO(d1): parse payload, keep money as integer cents, cast timestamps to UTC,
-- and dedupe with qualify row_number() so a reissued invoice keeps one row.
select
  payload,
  _loaded_at,
  _source_file,
  _line_no
from {{ source('billing', 'billing__invoices') }}
