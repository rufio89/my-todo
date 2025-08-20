# Google OAuth Setup for Your Todo App

## Prerequisites
- A Supabase project
- A Google Cloud Console project

## Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Web application" as the application type
6. Add these authorized redirect URIs:
   - `https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local development)
7. Copy the Client ID and Client Secret

## Step 2: Supabase Setup

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" → "Providers"
3. Find "Google" and click "Enable"
4. Enter your Google OAuth credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
5. Save the changes

## Step 3: Environment Variables

Create a `.env` file in your project root with:

```env
VITE_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

## Step 4: Database Schema Updates

Make sure your `todo_lists` table has a `user_id` column to associate lists with users:

```sql
ALTER TABLE todo_lists ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE todos ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add RLS policies
ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Policy for todo_lists
CREATE POLICY "Users can view their own todo lists" ON todo_lists
  FOR ALL USING (auth.uid() = user_id);

-- Policy for todos
CREATE POLICY "Users can view their own todos" ON todos
  FOR ALL USING (auth.uid() = user_id);
```

## Step 5: Test the Integration

1. Start your development server
2. Click "Sign in with Google"
3. Complete the Google OAuth flow
4. You should be redirected back to your app and see your user email

## Troubleshooting

- **Redirect URI mismatch**: Make sure the redirect URI in Google Cloud Console exactly matches your Supabase callback URL
- **CORS issues**: Ensure your Supabase project allows your domain
- **Authentication errors**: Check the browser console and Supabase logs for detailed error messages

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive configuration
- Enable Row Level Security (RLS) in Supabase for data isolation
- Regularly rotate your OAuth client secrets
