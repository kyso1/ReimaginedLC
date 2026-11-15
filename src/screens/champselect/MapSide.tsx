import { useEffect, useState } from 'preact/hooks';
import { clientLocale } from '../../i18n';
import type { Champion } from '../../data/gamedata';
import { RoleIcon } from '../../ui/RoleIcon';
import { getJson } from '../profile/data';
import type { Lcu } from '../../lcu';
import { displayedChampion, type Cell, type Subteam } from './logic';
import type { RealName } from './names';
import { AbyssScene } from './AbyssScene';
import { ArenaScene } from './ArenaScene';
import { RiftScene } from './RiftScene';
import { ABYSS_MAP_ID } from './scene/abyss';
import { ARENA_MAP_ID } from './scene/arena';
import { RIFT_MAP_ID, sideName } from './scene/rift';
import { prefs } from '../../shell/prefs';

interface MapEntry {
  id: number;
  gameMode: string;
  assets?: Record<string, string>;
  properties?: { suppressRunesMasteriesPerks?: boolean };
}

const loadMaps = () => getJson<MapEntry[]>('/lol-maps/v2/maps').then((l) => l ?? []);

/** Mapas sem sentinela (Abismo Uivante, Arena): a sentinela não aparece em jogo, então não há o que escolher. */
const NO_WARD_MAPS = [12, 30];

/**
 * Regras do mapa como o client usa: runas só onde o mapa não as suprime (`suppressRunesMasteriesPerks`, ligado no
 * ARAM Caos e na Arena) e sentinela só onde há sentinela. Até chegar a lista, vale o que o modo já diz.
 */
export function useMapRules(mapId: number | undefined, gameMode: string | null): { runes: boolean; ward: boolean } {
  const [suppress, setSuppress] = useState<boolean | null>(null);
  useEffect(() => {
    setSuppress(null);
    if (!mapId) return;
    let live = true;
    void loadMaps().then((list) => {
      const m = list.find((x) => x.id === mapId && x.gameMode === gameMode) ?? list.find((x) => x.id === mapId);
      if (live) setSuppress(m?.properties?.suppressRunesMasteriesPerks === true);
    });
    return () => void (live = false);
  }, [mapId, gameMode]);
  return { runes: !(suppress ?? gameMode === 'CHERRY'), ward: !NO_WARD_MAPS.includes(mapId ?? 0) };
}

/** Arte do mapa vista de cada lado (`map-south` = lado azul, embaixo; `map-north` = vermelho), do próprio client. */
export function useMapArt(mapId: number | undefined, gameMode: string | undefined): { south: string; north: string } | null {
  const [art, setArt] = useState<{ south: string; north: string } | null>(null);
  useEffect(() => {
    setArt(null);
    if (!mapId) return;
    let live = true;
    void loadMaps().then((list) => {
      const entries = list.filter((m) => m.id === mapId && m.assets?.['map-south']);
      const m = entries.find((x) => x.gameMode === gameMode) ?? entries[0];
      if (live && m?.assets) setArt({ south: `/${m.assets['map-south']}`, north: `/${m.assets['map-north'] ?? m.assets['map-south']}` });
    });
    return () => void (live = false);
  }, [mapId, gameMode]);
  return art;
}

interface MapSideProps {
  /** Arte do client para o desenho plano; a Arena em 3D não precisa dela. */
  art: { south: string; north: string } | null;
  mapId?: number;
  /** O meu time (na Arena, o meu subtime). */
  cells: Cell[];
  /** Arena: todos os times da partida, para a cena. */
  subteams?: Subteam[];
  localCellId: number;
  champions: Map<number, Champion>;
  name: Lcu['name'];
  /** Nomes reais por vaga (sala de chat da seleção). */
  real?: Map<number, RealName>;
  diving?: boolean;
  /** ARAM com as cartas na mesa: o mapa fica apagado ao fundo. */
  dim?: boolean;
}

// Sem WebGL uma vez, sem WebGL até o client reiniciar: não tenta de novo a cada vez que o mapa aparece.
let noWebgl = false;
/** Só para testes: volta a tentar o WebGL. */
export const retryWebgl = (): void => void (noWebgl = false);
/** A cena deste mapa é toda desenhada aqui e aparece mesmo sem arte do client (Arena, com o mapa animado e WebGL). */
export const sceneOnly = (mapId: number | undefined): boolean => mapId === ARENA_MAP_ID && prefs.value.riftMap && !noWebgl;

/**
 * Antes de escolher: o lado do meu time. No Summoner's Rift, o mapa em 3D com cada aliado no ponto da própria rota
 * (`RiftScene`); no Howling Abyss, a ponte em 3D com o time em cima (`AbyssScene`); na Arena, a arena em 3D com
 * todos os times, o meu no centro (`ArenaScene`); nos outros mapas, com o mapa
 * animado desligado ou sem WebGL, a arte do client (azul embaixo, vermelho em cima) com o que cada aliado está escolhendo. `diving`: ao travar, o mapa mergulha e some na splash do campeão.
 */
export function MapSide({ art, mapId, cells, subteams, localCellId, champions, name, real, diving = false, dim = false }: MapSideProps) {
  const [failed, setFailed] = useState(noWebgl);
  // `team` 1 é o lado azul. A Arena não tem lados: a arte é uma só e o rótulo do lado não aparece.
  const arena = mapId === ARENA_MAP_ID;
  const blue = arena || (cells[0]?.team ?? 1) === 1;
  // Mapa animado desligado nas configurações: fica a arte do client, como antes.
  const fail = () => {
    noWebgl = true;
    setFailed(true);
  };
  if (arena && subteams?.length && prefs.value.riftMap && !failed) return <ArenaScene subteams={subteams} localCellId={localCellId} champions={champions} name={name} real={real} diving={diving} onFail={fail} />;
  if (!art) return null;
  if ((mapId === RIFT_MAP_ID || mapId === ABYSS_MAP_ID) && prefs.value.riftMap && !failed) {
    const props = { side: blue ? 'blue' : 'red', cells, localCellId, champions, name, real, diving, onFail: fail } as const;
    return mapId === RIFT_MAP_ID ? <RiftScene {...props} /> : <AbyssScene {...props} dim={dim} />;
  }
  return (
    <div class="rlc-cs-map" data-side={blue ? 'blue' : 'red'} data-diving={diving ? 'true' : undefined} data-dim={dim && !diving ? 'true' : undefined}>
      <img class="rlc-cs-map-art" src={blue ? art.south : art.north} alt="" />
      {arena ? null : <p class="rlc-cs-map-side">{sideName(blue ? 'blue' : 'red', clientLocale())}</p>}
      <div class="rlc-cs-map-picks">
        {cells.map((c) => {
          const shown = displayedChampion(c);
          const champ = shown ? champions.get(shown.championId) : undefined;
          return (
            <span key={c.cellId} class="rlc-cs-map-pick" data-locked={shown?.locked ? 'true' : undefined} title={champ?.name}>
              {champ?.icon ? <img src={champ.icon} alt={champ.name} /> : <i aria-hidden="true" />}
              {c.assignedPosition ? <RoleIcon role={c.assignedPosition} /> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}
