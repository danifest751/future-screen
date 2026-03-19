import { useEffect } from 'react';
import { CaseItem } from '../data/cases';
import { useAdminData } from '../context/AdminDataContext';

export const useCases = () => {
  const {
    cases,
    ensureCases,
    addCase,
    updateCase,
    removeCase,
    resetCases,
  } = useAdminData();

  useEffect(() => {
    void ensureCases();
  }, [ensureCases]);

  return {
    cases: cases.items,
    loading: cases.loading,
    error: cases.error,
    addCase,
    updateCase,
    deleteCase: removeCase,
    resetToDefault: resetCases,
  };
};
