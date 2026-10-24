// Dados estáticos do jogo servidos pelo próprio client (`/lol-game-data/assets`). Lidos uma vez por sessão.

export interface Champion {
  id: number;
  name: string;
  icon: string;
  roles: string[];
}

export interface Spell {
  id: number;
  name: string;
  icon: string;
  gameModes: string[];
}

type Fetcher = (url: string) => Promise<Response>;

const getJson = (fetcher: Fetcher, url: string): Promise<unknown> => fetcher(url).then((r) => (r.ok ? r.json() : null));

/** Promessa guardada na primeira chamada; falha de rede vira mapa vazio e também fica guardada. */
function once<T>(load: () => Promise<T>): () => Promise<T> {
  let entry: Promise<T> | null = null;
  return () => (entry ??= load());
}

export function createGameData(fetcher: Fetcher = (u) => fetch(u)) {
  const champions = once(async () => {
    const list = (await getJson(fetcher, '/lol-game-data/assets/v1/champion-summary.json').catch(() => null)) as Array<Record<string, unknown>> | null;
    const map = new Map<number, Champion>();
    for (const c of Array.isArray(list) ? list : []) {
      const id = Number(c.id);
      if (id > 0) map.set(id, { id, name: String(c.name ?? id), icon: String(c.squarePortraitPath ?? ''), roles: Array.isArray(c.roles) ? (c.roles as string[]) : [] });
    }
    return map;
  });

  const spells = once(async () => {
    const list = (await getJson(fetcher, '/lol-game-data/assets/v1/summoner-spells.json').catch(() => null)) as Array<Record<string, unknown>> | null;
    const map = new Map<number, Spell>();
    for (const s of Array.isArray(list) ? list : []) {
      const id = Number(s.id);
      if (id > 0) map.set(id, { id, name: String(s.name ?? id), icon: String(s.iconPath ?? ''), gameModes: Array.isArray(s.gameModes) ? (s.gameModes as string[]) : [] });
    }
    return map;
  });

  const items = once(async () => {
    const list = (await getJson(fetcher, '/lol-game-data/assets/v1/items.json').catch(() => null)) as Array<Record<string, unknown>> | null;
    return new Map((Array.isArray(list) ? list : []).filter((i) => i.iconPath).map((i) => [Number(i.id), String(i.iconPath)]));
  });

  /** Pequenas Lendas por contentId (o lobby de TFT manda o contentId em `memberData['TFT.Tactician']`). */
  const companions = once(async () => {
    const list = (await getJson(fetcher, '/lol-game-data/assets/v1/companions.json').catch(() => null)) as Array<Record<string, unknown>> | null;
    const map = new Map<string, { itemId: number; name: string; icon: string }>();
    for (const c of Array.isArray(list) ? list : []) {
      if (typeof c.contentId === 'string' && c.contentId) map.set(c.contentId, { itemId: Number(c.itemId), name: String(c.name ?? ''), icon: String(c.loadoutsIcon ?? '') });
    }
    return map;
  });

  // A rota `champion-splashes/{campeão}/{skin}.jpg` não carrega no client: o caminho vem do JSON do campeão.
  const skinsByChampion = new Map<number, Promise<Map<number, string>>>();
  const splash = async (skinId: number | undefined): Promise<string | null> => {
    if (!skinId) return null;
    const champion = Math.floor(skinId / 1000);
    let skins = skinsByChampion.get(champion);
    if (!skins) {
      skins = getJson(fetcher, `/lol-game-data/assets/v1/champions/${champion}.json`)
        .then((c) => {
          // Croma e estágio de skin evolutiva não estão na lista de cima: usam a splash da skin-mãe (ou a do estágio).
          type Skin = { id: number; splashPath?: string; chromas?: Array<{ id: number }>; questSkinInfo?: { tiers?: Array<{ id: number; splashPath?: string }> } };
          const out = new Map<number, string>();
          for (const s of (c as { skins?: Skin[] } | null)?.skins ?? []) {
            if (!s.splashPath) continue;
            out.set(s.id, s.splashPath);
            for (const x of s.chromas ?? []) out.set(x.id, s.splashPath);
            for (const x of s.questSkinInfo?.tiers ?? []) out.set(x.id, x.splashPath || s.splashPath);
          }
          return out;
        })
        .catch(() => new Map<number, string>());
      skinsByChampion.set(champion, skins);
    }
    // Skin desconhecida (nova, de outro patch): a base do campeão, para a vaga não ficar vazia.
    const map = await skins;
    return map.get(skinId) ?? map.get(champion * 1000) ?? null;
  };

  return { champions, spells, splash, items, companions };
}

export type GameData = ReturnType<typeof createGameData>;
