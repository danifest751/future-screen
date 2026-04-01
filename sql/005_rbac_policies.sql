-- RBAC: Row Level Security policies for admin tables
-- These policies ensure that only users with 'admin' role can modify site settings.

-- Enable RLS on site_settings table
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins to read site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow admins to update site_settings" ON site_settings;
DROP POLICY IF EXISTS "Allow admins to insert site_settings" ON site_settings;

-- Create policies based on user_metadata.role
-- Note: Supabase auth.uid() is available in RLS policies
-- The role is stored in raw_user_meta_data->>'role'

-- SELECT: anyone authenticated can read
CREATE POLICY "Allow authenticated users to read site_settings"
  ON site_settings
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- UPDATE: only users with admin role
CREATE POLICY "Allow admins to update site_settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
      'viewer'
    ) = 'admin'
  );

-- INSERT: only users with admin role
CREATE POLICY "Allow admins to insert site_settings"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
      'viewer'
    ) = 'admin'
  );

-- Enable RLS on site_content table
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read site_content" ON site_content;
DROP POLICY IF EXISTS "Allow admins to update site_content" ON site_content;
DROP POLICY IF EXISTS "Allow admins to insert site_content" ON site_content;

-- SELECT: anyone authenticated can read
CREATE POLICY "Allow authenticated users to read site_content"
  ON site_content
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- UPDATE: only users with admin role
CREATE POLICY "Allow admins to update site_content"
  ON site_content
  FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
      'viewer'
    ) = 'admin'
  );

-- INSERT: only users with admin role
CREATE POLICY "Allow admins to insert site_content"
  ON site_content
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
      'viewer'
    ) = 'admin'
  );
