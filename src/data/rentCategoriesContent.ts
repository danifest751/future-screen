import { rentCategoryItemsContent } from '../content/data/rentCategoriesContent';

export type RentCategoryContent = {
  id: number;
  slug: string;
  description: string;
  facts: string[];
  items: string[];
  tips: string[];
};

export const rentCategoriesContent: RentCategoryContent[] =
  rentCategoryItemsContent as unknown as RentCategoryContent[];
