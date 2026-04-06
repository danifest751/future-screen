import { categoryItemsContent } from '../content/data/categories';

export type Category = {
  id: number;
  title: string;
  shortDescription: string;
  bullets: string[];
  pagePath: string;
};

export const categories: Category[] =
  categoryItemsContent as unknown as Category[];
