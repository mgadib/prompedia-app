declare global {
  interface Window {
    updatePlaygroundCount?: (newCount: number) => void;
  }
}

export {};