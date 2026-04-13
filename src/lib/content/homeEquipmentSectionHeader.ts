import { z } from 'zod';

export type HomeEquipmentSectionHeader = {
  badge: string;
  title: string;
  accentTitle: string;
  subtitle: string;
};

const homeEquipmentSectionHeaderSchema = z.object({
  badge: z.string().trim().min(1),
  title: z.string().trim().min(1),
  accentTitle: z.string().trim().min(1),
  subtitle: z.string().trim().min(1),
});

export const parseHomeEquipmentSectionHeader = (
  value: string | null | undefined,
): HomeEquipmentSectionHeader | null => {
  if (!value || !value.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    const result = homeEquipmentSectionHeaderSchema.safeParse(parsed);
    if (!result.success) {
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
};

export const serializeHomeEquipmentSectionHeader = (value: HomeEquipmentSectionHeader): string =>
  JSON.stringify(homeEquipmentSectionHeaderSchema.parse(value));
