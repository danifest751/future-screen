/**
 * Реэкспорт всех React Query хуков и ключей.
 */

export { queryKeys } from './keys';

// Cases
export {
  useCasesQuery,
  useCaseBySlugQuery,
  useCreateCaseMutation,
  useUpdateCaseMutation,
  useDeleteCaseMutation,
  useResetCasesMutation,
} from './cases';

// Categories
export {
  useCategoriesQuery,
  useUpsertCategoryMutation,
  useDeleteCategoryMutation,
  useResetCategoriesMutation,
} from './categories';

// Contacts
export {
  useContactsQuery,
  useUpdateContactsMutation,
  useResetContactsMutation,
} from './contacts';

// Packages
export {
  usePackagesQuery,
  useUpsertPackageMutation,
  useDeletePackageMutation,
  useResetPackagesMutation,
} from './packages';

// Leads
export {
  useLeadsQuery,
  useInvalidateLeads,
  useClearLeadsMutation,
} from './leads';

// Privacy Policy
export {
  usePrivacyPolicyQuery,
  useSavePrivacyPolicyMutation,
} from './privacyPolicy';

// Site Settings
export {
  useSiteSettingsQuery,
  useSaveSiteSettingsMutation,
} from './siteSettings';

// Rental Categories
export {
  useRentalCategoriesQuery,
  useRentalCategoryBySlugQuery,
  useUpsertRentalCategoryMutation,
  useDeleteRentalCategoryMutation,
} from './rentalCategories';
