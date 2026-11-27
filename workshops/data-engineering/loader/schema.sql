create schema if not exists bronze;

create table if not exists bronze.billing__invoices (
  payload json,
  _batch_id varchar,
  _source_file varchar,
  _file_sha256 varchar,
  _loaded_at timestamp,
  _line_no bigint
);

create table if not exists bronze._load_manifest (
  file_sha256 varchar primary key,
  source_file varchar,
  batch_id varchar,
  loaded_at timestamp
);

create table if not exists bronze._rejects (
  source_file varchar,
  line_no bigint,
  raw_line varchar,
  reason varchar
);
