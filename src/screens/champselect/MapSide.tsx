import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Champion } from '../../data/gamedata';
import { RoleIcon } from '../../ui/RoleIcon';
import { getJson } from '../profile/data';
import { displayedChampion, type Cell } from './logic';

interface MapEntry {
  id: number;
  gameMode: string;
  assets?: Record<string, string>;
}

/** Arte do mapa vista de cada lado (`map-south` = lado azul, embaixo; `map-north` = vermelho), do próprio client. */
export function useMapArt(mapId: number | undefined, gameMode: string | undefined): { south: string; north: string } | null {
  const [art, setArt] = useState<{ south: string; north: string } | null>(null);
  useEffect(() => {
    setArt(null);
    if (!mapId) return;
    let live = true;
    void getJson<MapEntry[]>('/lol-maps/v2/maps').then((list) => {
      const entries = (list ?? []).filter((m) => m.id === mapId && m.assets?.['map-south']);
      const m = entries.find((x) => x.gameMode === gameMode) ?? entries[0];
      if (live && m?.assets) setArt({ south: `/${m.assets['map-south']}`, north: `/${m.assets['map-north'] ?? m.assets['map-south']}` });
    });
    return () => void (live = false);
  }, [mapId, gameMode]);
  return art;
}

/**
 * Antes de escolher: o mapa do lado do meu time (azul embaixo, vermelho em cima) e, por cima, o que cada aliado está
 * escolhendo por rota, como o client mostra até a vez do jogador.
 */
export function MapSide({ art, cells, champions }: { art: { south: string; north: string }; cells: Cell[]; champions: Map<number, Champion> }) {
  // `team` 1 é o lado azul.
  const blue = (cells[0]?.team ?? 1) === 1;
  return (
    <div class="rlc-cs-map" data-side={blue ? 'blue' : 'red'}>
      <img class="rlc-cs-map-art" src={blue ? art.south : art.north} alt="" />
      <p class="rlc-cs-map-side">{t(blue ? 'csBlueSide' : 'csRedSide')}</p>
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
