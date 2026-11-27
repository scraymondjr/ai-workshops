{% snapshot snap_billing__subscriptions %}
{{ config(
    target_schema='snapshots',
    unique_key='subscription_id',
    strategy='check',
    check_cols=['plan', 'seats', 'status'],
    hard_deletes='new_record',
    dbt_valid_to_current="cast('9999-12-31' as timestamp)"
) }}
-- TODO(d3): select the staged subscription columns. A half-empty extract must
-- not reach this snapshot. Snapshots run only after the audit publish passes.
select
  'TODO' as subscription_id,
  'TODO' as plan,
  0 as seats,
  'TODO' as status
where false
{% endsnapshot %}
