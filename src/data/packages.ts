import { packageItemsContent } from '../content/data/packages';

export type Package = {
  id: number;
  name: string;
  forFormats: string[];
  includes: string[];
  options?: string[];
  priceHint?: string;
};

export const packages: Package[] =
  packageItemsContent as unknown as Package[];
