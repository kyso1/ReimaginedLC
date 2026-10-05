import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import type { Champion, Spell } from '../../data/gamedata';
import { positionKey } from '../lobby/format';
import { displayedChampion, type Cell } from './logic';

interface TeamProps {
  cells: Cell[];
  side: 'mine' | 'theirs';
  bans: number[];
  active: Set<number>;
  localCellId: number;
  champions: Map<number, Champion>;
  spells: Map<number, Spell>;
  name: Lcu['name'];
  /** Menu de trocas por vaga de aliado (Task 6). */
  menuFor?: (cell: Cell) => ComponentChildren;
}

/** Faixa de um time no topo: campeão, nome, feitiços e posição por vaga; banimentos embaixo. */
export function Team({ cells, side, bans, active, localCellId, champions, spells, name, menuFor }: TeamProps) {
  return (
    <div class="rlc-cs-side" data-side={side}>
      <div class="rlc-cs-team">
        {cells.map((c) => (
          <Slot key={c.cellId} cell={c} active={active.has(c.cellId)} local={c.cellId === localCellId} champions={champions} spells={spells} name={name} menu={menuFor?.(c)} />
        ))}
      </div>
      <div class="rlc-cs-bans">
        {bans.map((id) => {
          const champ = champions.get(id);
          return champ?.icon ? <img key={id} src={champ.icon} alt={champ.name} title={champ.name} /> : <span key={id} class="rlc-cs-ban-empty" title={String(id)} />;
        })}
      </div>
    </div>
  );
}

function Slot({ cell, active, local, champions, spells, name, menu }: { cell: Cell; active: boolean; local: boolean; champions: Map<number, Champion>; spells: Map<number, Spell>; name: Lcu['name']; menu?: ComponentChildren }) {
  const shown = displayedChampion(cell);
  const champ = shown ? champions.get(shown.championId) : undefined;
  const label = useCellName(cell, name);
  const pos = positionKey((cell.assignedPosition ?? '').toUpperCase());
  return (
    <div class="rlc-cs-cell" data-active={active ? 'true' : undefined} data-local={local ? 'true' : undefined}>
      <div class="rlc-cs-icon" data-locked={shown?.locked ? 'true' : undefined}>
        {champ?.icon ? <img src={champ.icon} alt={champ.name} /> : null}
      </div>
      <div class="rlc-cs-meta">
        <span class="rlc-cs-name">{label}</span>
        <span class="rlc-cs-sub">
          {[cell.spell1Id, cell.spell2Id].map((id, i) => {
            const spell = spells.get(id);
            return spell?.icon ? <img key={i} class="rlc-cs-spell" src={spell.icon} alt={spell.name} /> : null;
          })}
          {pos ? <span>{t(pos)}</span> : null}
        </span>
      </div>
      {menu}
    </div>
  );
}

/** `gameName` quando vier; senão o nome buscado pelo puuid (vazio para jogadores ocultos). */
function useCellName(cell: Cell, name: Lcu['name']): string {
  const [found, setFound] = useState<string | null>(null);
  const direct = cell.gameName || null;
  const puuid = !direct && cell.puuid ? cell.puuid : null;
  useEffect(() => {
    setFound(null);
    if (!puuid) return;
    let live = true;
    void name(puuid).then((n) => live && setFound(n));
    return () => void (live = false);
  }, [puuid, name]);
  return direct ?? found ?? '';
}
