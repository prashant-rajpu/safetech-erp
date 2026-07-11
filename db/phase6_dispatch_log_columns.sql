-- Fix: DispatchForm.tsx's auto-seed logic has always tried to insert
-- plate_no/supplier_name/trailer_type/driver_name/driver_mobile into
-- dispatch_log, but the live table never had these columns (schema drift
-- between db/init.sql and db/erp_schema.sql, pre-existing, discovered while
-- fixing the related trailers field-name bug). dispatch_log is empty (0
-- rows) so this is a pure additive migration, no backfill needed.

alter table dispatch_log
  add column if not exists plate_no text,
  add column if not exists supplier_name text,
  add column if not exists trailer_type text,
  add column if not exists driver_name text,
  add column if not exists driver_mobile text;
