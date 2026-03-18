import { useCallback, useEffect, useRef, useState } from 'react';
import type { FieldValues, UseFormReset, UseFormWatch } from 'react-hook-form';

type UseFormDraftPersistenceOptions<TValues extends FieldValues> = {
  enabled: boolean;
  storageKey: string;
  reset: UseFormReset<TValues>;
  watch: UseFormWatch<TValues>;
};

export const useFormDraftPersistence = <TValues extends FieldValues>({
  enabled,
  storageKey,
  reset,
  watch,
}: UseFormDraftPersistenceOptions<TValues>) => {
  const [hasDraft, setHasDraft] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const hydratedRef = useRef(false);
  const suppressNextWriteRef = useRef(false);

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.removeItem(storageKey);
    suppressNextWriteRef.current = true;
    setHasDraft(false);
  }, [storageKey]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      hydratedRef.current = true;
      setIsHydrated(true);
      return;
    }

    const rawDraft = window.localStorage.getItem(storageKey);
    if (!rawDraft) {
      hydratedRef.current = true;
      setHasDraft(false);
      setIsHydrated(true);
      return;
    }

    try {
      const draft = JSON.parse(rawDraft) as Partial<TValues>;
      reset(draft as TValues);
      setHasDraft(true);
    } catch (error) {
      console.error(`Failed to restore draft for ${storageKey}`, error);
      window.localStorage.removeItem(storageKey);
      setHasDraft(false);
    } finally {
      hydratedRef.current = true;
      setIsHydrated(true);
    }
  }, [enabled, reset, storageKey]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !hydratedRef.current) return undefined;

    const subscription = watch((values) => {
      if (suppressNextWriteRef.current) {
        suppressNextWriteRef.current = false;
        return;
      }

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(values));
        setHasDraft(true);
      } catch (error) {
        console.error(`Failed to persist draft for ${storageKey}`, error);
      }
    });

    return () => subscription.unsubscribe();
  }, [enabled, storageKey, watch]);

  return { clearDraft, hasDraft, isHydrated };
};
