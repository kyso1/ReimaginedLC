import type { ComponentType } from 'preact';
import type { Lcu } from './lcu';

/**
 * Ponto de extensão: um build que inclui o ReimaginedLC pode registrar abas de configuração e tarefas de fundo.
 * O build público não registra nada. As peças rodam no mesmo Preact (o build da extensão compila junto).
 */
export interface Tab {
  id: string;
  label: () => string;
  render: ComponentType<{ lcu: Lcu }>;
}

export interface Extension {
  settingsTabs?: Tab[];
  /** Tarefas de fundo (aceitar partida etc.), iniciadas uma vez com a LCU, com a camada ligada ou não. */
  services?: Array<(lcu: Lcu) => void>;
}

const registry: Required<Extension> = {
  settingsTabs: [],
  services: [],
};

/** Registrar antes de o App montar. */
export function registerExtension(ext: Extension): void {
  registry.settingsTabs.push(...(ext.settingsTabs ?? []));
  registry.services.push(...(ext.services ?? []));
}

export const extensions = (): Readonly<typeof registry> => registry;

export function startServices(lcu: Lcu): void {
  for (const service of registry.services) {
    try {
      service(lcu);
    } catch (e) {
      console.error('[rlc] serviço de extensão falhou', e);
    }
  }
}

/** Só para testes. */
export function clearExtensions(): void {
  for (const list of Object.values(registry)) list.length = 0;
}
