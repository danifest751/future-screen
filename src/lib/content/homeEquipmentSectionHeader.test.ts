import { describe, expect, it } from 'vitest';
import {
  parseHomeEquipmentSectionHeader,
  serializeHomeEquipmentSectionHeader,
  type HomeEquipmentSectionHeader,
} from './homeEquipmentSectionHeader';

describe('homeEquipmentSectionHeader', () => {
  it('parses valid JSON payload', () => {
    const payload = {
      badge: 'Equipment fleet',
      title: 'Equipment',
      accentTitle: 'for rent',
      subtitle: 'A full range of equipment',
    };

    const parsed = parseHomeEquipmentSectionHeader(JSON.stringify(payload));

    expect(parsed).toEqual(payload);
  });

  it('returns null for invalid shape', () => {
    const parsed = parseHomeEquipmentSectionHeader(JSON.stringify({ title: 'Only title' }));
    expect(parsed).toBeNull();
  });

  it('serializes valid payload', () => {
    const value: HomeEquipmentSectionHeader = {
      badge: 'Парк оборудования',
      title: 'Оборудование',
      accentTitle: 'в аренду',
      subtitle: 'Полный спектр оборудования',
    };

    const serialized = serializeHomeEquipmentSectionHeader(value);

    expect(JSON.parse(serialized)).toEqual(value);
  });
});
