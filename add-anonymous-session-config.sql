-- Add the missing app.anonymous_session_id configuration parameter
-- This is required for RLS policies to work with anonymous users

-- Create the configuration parameter
ALTER DATABASE postgres SET "app.anonymous_session_id" = '';

-- Note: The above command sets a default value, but the actual value will be set
-- dynamically by the set_anonymous_session_id RPC function when anonymous users
-- interact with the database.

-- If you're using a different database name than 'postgres', replace it above.
-- You can check your database name with: SELECT current_database();
