import type { ComponentType } from 'preact';
import type { Lcu } from './lcu';
import type { TeamBuilderDirect_ChampSelectPlayerSelection } from './lcu/types';

/**
 * Ponto de extensão: um build que inclui o ReimaginedLC pode registrar abas e peças de tela.
 * O build público não registra nada. As peças rodam no mesmo Preact (o build da extensão compila junto).
 */
export interface Tab {
  id: string;
  label: () => string;
  render: ComponentType<{ lcu: Lcu }>;
}

export interface Extension {
  settingsTabs?: Tab[];
  collectionTabs?: Tab[];
  /** Botões ao lado de Sair da seleção. */
  champSelectActions?: Array<ComponentType<{ lcu: Lcu }>>;
  /** Cartões depois das skins possuídas, na aba Skins da seleção. */
  skinCards?: Array<ComponentType<{ lcu: Lcu; me: TeamBuilderDirect_ChampSelectPlayerSelection }>>;
  /** Hook chamado em toda renderização da seleção: nome por puuid para quem a LCU esconde. */
  useCellNames?: (lcu: Lcu) => Map<string, string>;
  /** Tarefas de fundo (aceitar partida etc.), iniciadas uma vez com a LCU, com a camada ligada ou não. */
  services?: Array<(lcu: Lcu) => void>;
}

const registry: Required<Omit<Extension, 'useCellNames'>> & { useCellNames: Array<NonNullable<Extension['useCellNames']>> } = {
  settingsTabs: [],
  collectionTabs: [],
  champSelectActions: [],
  skinCards: [],
  services: [],
  useCellNames: [],
};

/** Registrar antes de o App montar: os hooks de nome precisam ter o mesmo número a cada renderização. */
export function registerExtension(ext: Extension): void {
  registry.settingsTabs.push(...(ext.settingsTabs ?? []));
  registry.collectionTabs.push(...(ext.collectionTabs ?? []));
  registry.champSelectActions.push(...(ext.champSelectActions ?? []));
  registry.skinCards.push(...(ext.skinCards ?? []));
  registry.services.push(...(ext.services ?? []));
  if (ext.useCellNames) registry.useCellNames.push(ext.useCellNames);
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

/** Nomes vindos das extensões, combinados (o primeiro que souber o puuid vence). */
export function useExtensionNames(lcu: Lcu): Map<string, string> {
  const merged = new Map<string, string>();
  for (const hook of registry.useCellNames) for (const [k, v] of hook(lcu)) if (!merged.has(k)) merged.set(k, v);
  return merged;
}
