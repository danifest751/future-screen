import { describe, expect, it } from 'vitest';
import { defaultBackgroundSettingsById, defaultStarBorderSettings } from './backgrounds';
import {
  LEGACY_SITE_SETTINGS_ID,
  normalizeSiteSettingsRow,
  selectPreferredSiteSettingsRow,
  SITE_SETTINGS_ID,
  type SiteSettingsRow,
} from './siteSettings';

describe('siteSettings helpers', () => {
  it('returns defaults for empty row', () => {
    const normalized = normalizeSiteSettingsRow(null);

    expect(normalized.background).toBe('theme');
    expect(normalized.backgroundSettings.aurora.color1).toBe(defaultBackgroundSettingsById.aurora.color1);
    expect(normalized.starBorder).toEqual(defaultStarBorderSettings);
  });

  it('merges row values over defaults', () => {
    const normalized = normalizeSiteSettingsRow({
      background: 'mesh',
      background_settings: {
        mesh: {
          glow: 0.5,
        },
      },
      star_border_settings: {
        enabled: true,
        speed: 8,
      },
    } satisfies Partial<SiteSettingsRow>);

    expect(normalized.background).toBe('mesh');
    expect(normalized.backgroundSettings.mesh.glow).toBe(0.5);
    expect(normalized.backgroundSettings.mesh.gridOpacity).toBe(defaultBackgroundSettingsById.mesh.gridOpacity);
    expect(normalized.starBorder.enabled).toBe(true);
    expect(normalized.starBorder.speed).toBe(8);
    expect(normalized.starBorder.cornerOffset).toBe(defaultStarBorderSettings.cornerOffset);
  });

  it('falls back to default background for unknown value', () => {
    const normalized = normalizeSiteSettingsRow({
      background: 'not-existing',
    } satisfies Partial<SiteSettingsRow>);

    expect(normalized.background).toBe('theme');
  });

  it('prefers default row over legacy and others', () => {
    const rows: Array<Partial<SiteSettingsRow>> = [
      { id: 'custom' },
      { id: LEGACY_SITE_SETTINGS_ID },
      { id: SITE_SETTINGS_ID },
    ];

    const selected = selectPreferredSiteSettingsRow(rows);
    expect(selected?.id).toBe(SITE_SETTINGS_ID);
  });

  it('uses legacy row if default is missing', () => {
    const rows: Array<Partial<SiteSettingsRow>> = [
      { id: 'custom' },
      { id: LEGACY_SITE_SETTINGS_ID },
    ];

    const selected = selectPreferredSiteSettingsRow(rows);
    expect(selected?.id).toBe(LEGACY_SITE_SETTINGS_ID);
  });

  it('falls back to first row when no canonical ids', () => {
    const rows: Array<Partial<SiteSettingsRow>> = [
      { id: 'custom-1' },
      { id: 'custom-2' },
    ];

    const selected = selectPreferredSiteSettingsRow(rows);
    expect(selected?.id).toBe('custom-1');
  });
});

