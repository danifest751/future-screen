import { describe, expect, it } from 'vitest';
import {
  parseHomeEquipmentSection,
  serializeHomeEquipmentSection,
  type HomeEquipmentSectionContent,
} from './homeEquipmentSection';

const sample: HomeEquipmentSectionContent = {
  badge: 'Equipment fleet',
  title: 'Equipment',
  accentTitle: 'for rent',
  subtitle: 'Full range of event equipment',
  items: [
    {
      iconKey: 'led',
      title: 'LED screens',
      desc: 'Indoor and outdoor LED walls',
      bullets: ['3x2 to 10x6', 'Modular build'],
      gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
      link: '/rent/video',
      photo: '/images/led-closeup.png',
    },
  ],
  extraItems: [
    {
      iconKey: 'computer',
      title: 'Computers',
      desc: 'Office and gaming configurations',
      link: '/rent/computers',
      photo: '/images/equip-computers.png',
    },
  ],
};

describe('homeEquipmentSection', () => {
  it('parses valid payload', () => {
    const parsed = parseHomeEquipmentSection(JSON.stringify(sample));
    expect(parsed).toEqual(sample);
  });

  it('returns null for invalid payload', () => {
    const parsed = parseHomeEquipmentSection(JSON.stringify({ badge: 'Only badge' }));
    expect(parsed).toBeNull();
  });

  it('serializes valid payload', () => {
    const serialized = serializeHomeEquipmentSection(sample);
    expect(JSON.parse(serialized)).toEqual(sample);
  });
});
