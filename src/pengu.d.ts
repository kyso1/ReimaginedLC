export {};

declare global {
  interface Window {
    DataStore?: {
      has(key: string): boolean;
      get(key: string): unknown;
      set(key: string, value: unknown): void;
      remove(key: string): void;
    };
    CommandBar?: {
      addAction(action: { name: string; legend?: string; group?: string; perform: () => void }): void;
    };
    Toast?: {
      success(message: string): void;
      error(message: string): void;
    };
  }
}
