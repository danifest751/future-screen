/// <reference types="vite/client" />

interface Window {
  ym?: (id: number, method: string, ...args: any[]) => void;
}
