import { useCallback, useState } from 'react';
import type { CalculatorConfig } from '../data/calculatorConfig';
import { defaultCalculatorConfig } from '../data/calculatorConfig';

const STORAGE_KEY = 'calculator_config';

const readStorage = (): CalculatorConfig => {
  if (typeof window === 'undefined') return defaultCalculatorConfig;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCalculatorConfig;
    const parsed = JSON.parse(raw) as CalculatorConfig;
    if (!parsed.pitchOptions?.length) return defaultCalculatorConfig;
    return parsed;
  } catch (e) {
    console.error('Failed to read calculator config', e);
    return defaultCalculatorConfig;
  }
};

const writeStorage = (cfg: CalculatorConfig) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.error('Failed to save calculator config', e);
  }
};

export const useCalculatorConfig = () => {
  const [config, setConfig] = useState<CalculatorConfig>(() => readStorage());

  const updateConfig = useCallback((next: CalculatorConfig) => {
    setConfig(next);
    writeStorage(next);
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(defaultCalculatorConfig);
    writeStorage(defaultCalculatorConfig);
  }, []);

  return { config, updateConfig, resetConfig };
};
