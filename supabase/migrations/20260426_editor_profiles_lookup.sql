-- Returns email + display_name for a set of auth.users ids.
-- Used by the admin content history page so editors are shown by email,
-- not by short uuid prefix. Only admin callers may invoke; guarded inside
-- the SECURITY DEFINER body so the function cannot leak emails to lower
-- roles even if EXECUTE is granted to authenticated.

CREATE OR REPLACE FUNCTION public.editor_profiles(ids uuid[])
RETURNS TABLE (id uuid, email text, display_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF public.current_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF ids IS NULL OR cardinality(ids) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      u.id,
      u.email,
      COALESCE(
        NULLIF(u.raw_user_meta_data ->> 'display_name', ''),
        NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
        NULLIF(u.raw_user_meta_data ->> 'name', '')
      ) AS display_name
    FROM auth.users u
    WHERE u.id = ANY(ids);
END;
$$;

REVOKE ALL ON FUNCTION public.editor_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.editor_profiles(uuid[]) TO authenticated;

COMMENT ON FUNCTION public.editor_profiles(uuid[]) IS
  'Lookup of auth.users email + display_name for admin UI (site_content_versions.edited_by). Admin-only via inline role check.';
