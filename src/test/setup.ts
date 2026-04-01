import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Очищаем DOM после каждого теста
afterEach(() => {
  cleanup();
});
