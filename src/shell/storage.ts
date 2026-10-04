// Configuração do plugin no DataStore do Pengu. No modo navegador o DataStore pode não existir.
export function readSetting<T>(key: string, fallback: T): T {
  try {
    const store = window.DataStore;
    if (!store || !store.has(key)) return fallback;
    return store.get(key) as T;
  } catch {
    return fallback;
  }
}

export function writeSetting(key: string, value: unknown): void {
  try {
    window.DataStore?.set(key, value);
  } catch {
    // Sem DataStore utilizável o estado vale só para esta sessão.
  }
}
