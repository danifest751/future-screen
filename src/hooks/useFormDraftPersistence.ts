import { useCallback, useEffect, useRef, useState } from 'react';
import type { FieldValues, UseFormReset, UseFormWatch } from 'react-hook-form';
import { asyncGetJson, asyncSetJson, asyncRemoveItem, isStorageAvailable } from '../lib/asyncStorage';

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
  // Time-window suppression instead of "next single write": reset() can fire
  // multiple change events in one tick, and a one-shot ref would only swallow
  // the first, letting the rest re-persist a partial draft. 250ms covers the
  // entire cascade (rAF + microtask flush) without holding back legitimate
  // edits the user makes after.
  const suppressUntilRef = useRef<number>(0);
  const isWritingRef = useRef(false);
  const previousStorageKeyRef = useRef<string | null>(null);

  const now = () =>
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();

  const clearDraft = useCallback(async () => {
    if (typeof window === 'undefined' || !isStorageAvailable()) return;

    await asyncRemoveItem(storageKey);
    suppressUntilRef.current = now() + 250;
    setHasDraft(false);
  }, [storageKey]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !isStorageAvailable()) {
      hydratedRef.current = true;
      setIsHydrated(true);
      return;
    }

    const previousStorageKey = previousStorageKeyRef.current;
    if (previousStorageKey && previousStorageKey !== storageKey) {
      void asyncRemoveItem(previousStorageKey);
      setHasDraft(false);
    }
    previousStorageKeyRef.current = storageKey;

    let cancelled = false;

    const loadDraft = async () => {
      try {
        const draft = await asyncGetJson<Partial<TValues>>(storageKey);
        if (cancelled) return;

        if (draft) {
          reset(draft as TValues);
          setHasDraft(true);
        } else {
          setHasDraft(false);
        }
      } catch {
        if (!cancelled) {
          await asyncRemoveItem(storageKey);
          setHasDraft(false);
        }
      } finally {
        if (!cancelled) {
          hydratedRef.current = true;
          setIsHydrated(true);
        }
      }
    };

    loadDraft();

    return () => {
      cancelled = true;
    };
  }, [enabled, reset, storageKey]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !hydratedRef.current || !isStorageAvailable()) return undefined;

    const subscription = watch((values) => {
      if (now() < suppressUntilRef.current) {
        return;
      }

      if (isWritingRef.current) return;

      isWritingRef.current = true;

      // Используем requestAnimationFrame для избежания частых записей
      requestAnimationFrame(async () => {
        try {
          await asyncSetJson(storageKey, values);
          setHasDraft(true);
        } catch {
          // silently ignore draft persistence errors
        } finally {
          isWritingRef.current = false;
        }
      });
    });

    return () => subscription.unsubscribe();
  }, [enabled, storageKey, watch]);

  return { clearDraft, hasDraft, isHydrated };
};
