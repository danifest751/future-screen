/**
 * Test wrapper with all required providers for admin page tests
 */
import React, { type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import type { AdminDataContextValue } from '../context/AdminDataContext';

export const createMockAdminDataContext = (
  overrides: Partial<AdminDataContextValue> = {}
): AdminDataContextValue => ({
  packages: { items: [], loading: false, error: null, loaded: false },
  categories: { items: [], loading: false, error: null, loaded: false },
  contacts: { items: null, loading: false, error: null, loaded: false },
  leads: { items: [], loading: false, error: null, loaded: false },
  cases: { items: [], loading: false, error: null, loaded: false },
  ensurePackages: vi.fn(async () => {}),
  ensureCategories: vi.fn(async () => {}),
  ensureContacts: vi.fn(async () => {}),
  ensureLeads: vi.fn(async () => {}),
  ensureCases: vi.fn(async () => {}),
  upsertPackage: vi.fn(async () => true),
  removePackage: vi.fn(async () => true),
  resetPackages: vi.fn(async () => true),
  upsertCategory: vi.fn(async () => true),
  removeCategory: vi.fn(async () => true),
  resetCategories: vi.fn(async () => true),
  updateContacts: vi.fn(async () => true),
  resetContacts: vi.fn(async () => true),
  addCase: vi.fn(async () => true),
  updateCase: vi.fn(async () => true),
  removeCase: vi.fn(async () => true),
  resetCases: vi.fn(async () => true),
  clearLeads: vi.fn(async () => true),
  ...overrides,
});

export const renderWithProviders = (
  ui: ReactNode,
  mockContext: AdminDataContextValue = createMockAdminDataContext()
) => {
  return {
    mockContext,
    // Helper to update mocks if needed
  };
};
