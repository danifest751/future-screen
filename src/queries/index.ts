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
  useMarkAllLeadsReadMutation,
  useMarkLeadReadMutation,
  useDeleteLeadMutation,
} from './leads';

// Privacy Policy
export {
  usePrivacyPolicyQuery,
  useSavePrivacyPolicyMutation,
} from './privacyPolicy';

// Rental Categories
export {
  useRentalCategoriesQuery,
  useRentalCategoryBySlugQuery,
  useUpsertRentalCategoryMutation,
  useDeleteRentalCategoryMutation,
} from './rentalCategories';

// Media Library
export {
  mediaQueryKeys,
  useMediaLibraryQuery,
  useMediaItemQuery,
  useMediaTagsQuery,
  useCaseMediaQuery,
  useCreateMediaItemMutation,
  useUpdateMediaItemMutation,
  useDeleteMediaItemsMutation,
  useAddTagsMutation,
  useRemoveTagsMutation,
  useLinkMediaToCaseMutation,
  useUnlinkMediaFromCaseMutation,
  useReorderCaseMediaMutation,
} from './mediaLibrary';
