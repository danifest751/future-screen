/**
 * Хуки приложения Future Screen
 */

// Хук для ловушки фокуса в модальных окнах
export { useFocusTrap } from './useFocusTrap';
export type { UseFocusTrapOptions, UseFocusTrapReturn } from './useFocusTrap';

// Существующие хуки
export { useCalculatorConfig } from './useCalculatorConfig';
export { useCases } from './useCases';
export { useCategories } from './useCategories';
export { useContacts } from './useContacts';
export { useFormDraftPersistence } from './useFormDraftPersistence';
export { useLeads } from './useLeads';
export { usePackages } from './usePackages';
export { useUnsavedChangesGuard } from './useUnsavedChangesGuard';

// Хук для глобальных настроек сайта (фон и т.д.)
export { useSiteSettings } from './useSiteSettings';
export type { SiteSettings } from './useSiteSettings';

// Хук для глобального применения Star Border
export { useStarBorderGlobal } from './useStarBorderGlobal';
