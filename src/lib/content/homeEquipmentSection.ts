import { z } from 'zod';

export const HOME_EQUIPMENT_SECTION_KEY = 'home_equipment_section';
export const HOME_EQUIPMENT_SECTION_LEGACY_HEADER_KEY = 'home_equipment_section_header';

const itemSchema = z.object({
  iconKey: z.string().trim().min(1),
  title: z.string().trim().min(1),
  desc: z.string().trim().min(1),
  bullets: z.array(z.string().trim().min(1)).min(1),
  gradient: z.string().trim().min(1),
  link: z.string().trim().min(1),
  photo: z.string().trim().min(1),
});

const extraItemSchema = z.object({
  iconKey: z.string().trim().min(1),
  title: z.string().trim().min(1),
  desc: z.string().trim().min(1),
  link: z.string().trim().min(1),
  photo: z.string().trim().min(1),
});

const sectionSchema = z.object({
  badge: z.string().trim().min(1),
  title: z.string().trim().min(1),
  accentTitle: z.string().trim().min(1),
  subtitle: z.string().trim().min(1),
  items: z.array(itemSchema).min(1),
  extraItems: z.array(extraItemSchema).min(1),
});

export type HomeEquipmentSectionContent = z.infer<typeof sectionSchema>;

export const parseHomeEquipmentSection = (
  value: string | null | undefined,
): HomeEquipmentSectionContent | null => {
  if (!value || !value.trim()) return null;

  try {
    const raw = JSON.parse(value) as unknown;
    const parsed = sectionSchema.safeParse(raw);
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

export const serializeHomeEquipmentSection = (value: HomeEquipmentSectionContent): string =>
  JSON.stringify(sectionSchema.parse(value));
