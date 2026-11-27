{% macro table_fingerprint(relation, exclude=['_loaded_at', '_batch_id']) %}
select count(*) as n,
       md5(string_agg(r, chr(10) order by r)) as fp
from (
  select to_json(t)::varchar as r
  from (select * exclude ({{ exclude | join(', ') }}) from {{ relation }}) t
)
{% endmacro %}
