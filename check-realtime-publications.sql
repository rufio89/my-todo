-- Check all available publications for real-time
-- The publication name might be different than 'supabase_realtime'

-- 1. List all publications
SELECT 
  pubname,
  puballtables,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication;

-- 2. Check which tables are in each publication
SELECT 
  p.pubname,
  pt.tablename,
  pt.pubinsert,
  pt.pubupdate,
  pt.pubdelete
FROM pg_publication p
LEFT JOIN pg_publication_tables pt ON p.pubname = pt.pubname
ORDER BY p.pubname, pt.tablename;

-- 3. Check if todos table is in any publication
SELECT 
  p.pubname,
  pt.tablename,
  pt.pubinsert,
  pt.pubupdate,
  pt.pubdelete
FROM pg_publication p
JOIN pg_publication_tables pt ON p.pubname = pt.pubname
WHERE pt.tablename = 'todos';

-- 4. If no publication exists, create one
-- (Uncomment the line below if you need to create a publication)
-- CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- 5. If publication exists but todos is not in it, add it
-- (Uncomment the line below if you need to add todos to existing publication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE todos;

-- 6. Check the current replication identity setting
SELECT 
  n.nspname as schema_name,
  c.relname as table_name,
  c.relreplident
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'todos';
