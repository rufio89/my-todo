-- Check if real-time is properly configured for the todos table
-- This script helps diagnose why DELETE events might not be working
-- Adapted for Supabase/PostgreSQL

-- 1. Check if the todos table exists and its basic structure
SELECT 
  n.nspname as schema_name,
  c.relname as table_name
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'todos';

-- 2. Check if there are any triggers on the todos table
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'todos';

-- 3. Check if the todos table has the necessary columns for real-time
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'todos'
ORDER BY ordinal_position;

-- 4. Check if there are any RLS policies that might interfere with real-time
SELECT 
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'todos';

-- 5. Check if the table has proper indexes for real-time
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'todos';

-- 6. Check if there are any active connections or locks
SELECT 
  pid,
  usename,
  application_name,
  state,
  query
FROM pg_stat_activity 
WHERE query LIKE '%todos%' 
  AND state = 'active';

-- 7. Check if real-time is enabled at the database level
SHOW log_statement;
SHOW log_min_duration_statement;

-- 8. Check if the table has replication identity set (important for real-time)
SELECT 
  n.nspname as schema_name,
  c.relname as table_name,
  c.relreplident
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'todos';

-- 9. Check if there are any publication/subscription settings
SELECT 
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication
WHERE puballtables = true OR pubname IN (
  SELECT unnest(pubname) FROM pg_publication_tables WHERE tablename = 'todos'
);

-- 10. Check if the table is part of any logical replication
SELECT 
  srname,
  srrelid::regclass as table_name,
  srdeferrable,
  srslotname
FROM pg_subscription_rel sr
JOIN pg_class c ON sr.srrelid = c.oid
WHERE c.relname = 'todos';

-- 11. Check if the table has the necessary permissions for real-time
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'todos';

-- 12. Check if there are any constraints that might affect real-time
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'todos';
