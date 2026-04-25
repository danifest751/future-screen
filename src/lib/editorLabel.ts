import type { EditorProfile } from '../services/siteContentVersions';

/**
 * Render a compact editor label for the history table:
 *   · display_name if present;
 *   · else the local part of the email (`alice@…` -> `alice`);
 *   · else the first 8 chars of the uuid.
 *
 * Profile lookup may fail (RLS, missing user). When `profile` is undefined
 * we fall back to the truncated uuid so admins always see *something*.
 */
export const formatEditorLabel = (
  id: string | null,
  profile: { email: string | null; displayName: string | null } | undefined
): string => {
  if (!id) return '—';
  if (profile?.displayName) return profile.displayName;
  if (profile?.email) {
    const at = profile.email.indexOf('@');
    return at > 0 ? profile.email.slice(0, at) : profile.email;
  }
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
};

export const formatEditorTooltip = (
  id: string | null,
  profile: { email: string | null; displayName: string | null } | undefined
): string => {
  if (!id) return '';
  const parts: string[] = [];
  if (profile?.displayName) parts.push(profile.displayName);
  if (profile?.email) parts.push(profile.email);
  parts.push(id);
  return parts.join('\n');
};

export const indexProfiles = (profiles: EditorProfile[]): Map<string, EditorProfile> => {
  const map = new Map<string, EditorProfile>();
  for (const profile of profiles) {
    map.set(profile.id, profile);
  }
  return map;
};
