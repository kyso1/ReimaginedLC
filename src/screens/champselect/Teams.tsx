import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { locale, t } from '../../i18n';
import type { Lcu } from '../../lcu';
import type { Champion, Spell } from '../../data/gamedata';
import { Rank, statsOf } from '../../ui/Rank';
import { RoleIcon } from '../../ui/RoleIcon';
import { positionKey } from '../lobby/format';
import { displayedChampion, type Cell } from './logic';
import { recentOf, type RealName, type Recent } from './names';
import { useDecoded } from '../../ui/useDecoded';

interface TeamProps {
  cells: Cell[];
  side: 'mine' | 'theirs';
  /** Banimentos do time; 0 é banimento nulo. */
  bans: number[];
  /** Vagas agindo agora e o que fazem. */
  active: Map<number, 'ban' | 'pick'>;
  localCellId: number;
  champions: Map<number, Champion>;
  spells: Map<number, Spell>;
  name: Lcu['name'];
  /** Caminho da splash de uma skin (`lcu.game.splash`). */
  splash: Lcu['game']['splash'];
  /** Menu de trocas por vaga de aliado. */
  menuFor?: (cell: Cell) => ComponentChildren;
  /** Fila ranqueada (chave do `queueMap`) para o elo de cada aliado; inimigos não têm puuid. */
  rankQueue?: string | null;
  /** Nomes reais por vaga (sala de chat da seleção). */
  real?: Map<number, RealName>;
  /** Aliados na sala que não deu para ligar a uma vaga (nomes ocultos). */
  extra?: RealName[];
}

/**
 * Coluna de um time: um cartão de vidro por vaga, com a splash do campeão entrando pelo lado de fora, e os banimentos
 * numa fileira pequena embaixo. Inimigos ficam espelhados e sem nome: só o campeão ou o que estão fazendo.
 */
export function Team({ cells, side, bans, active, localCellId, champions, spells, name, splash, menuFor, rankQueue = null, real, extra = [] }: TeamProps) {
  return (
    <div class="rlc-cs-side" data-side={side}>
      <div class="rlc-cs-team">
        {cells.map((c) =>
          side === 'mine' ? (
            <Slot key={c.cellId} cell={c} acting={active.get(c.cellId)} local={c.cellId === localCellId} champions={champions} spells={spells} name={name} splash={splash} menu={menuFor?.(c)} rankQueue={rankQueue} real={real?.get(c.cellId)} />
          ) : (
            <Foe key={c.cellId} cell={c} acting={active.get(c.cellId)} champions={champions} splash={splash} />
          ),
        )}
      </div>
      {extra.length ? (
        <div class="rlc-cs-room" aria-label={t('csInRoom')}>
          <span>{t('csInRoom')}</span>
          {extra.map((r) => (
            <span key={r.puuid} class="rlc-cs-room-name" title={`${r.gameName}#${r.tagLine}`}>
              {r.gameName}
              {r.tagLine ? <small class="rlc-cs-tag">#{r.tagLine}</small> : null}
            </span>
          ))}
        </div>
      ) : null}
      {bans.length ? (
        <div class="rlc-cs-bans" aria-label={t('bans')} title={t('bans')}>
          {bans.map((id, i) => {
            // 0: o jogador não baniu (banimento nulo).
            if (!id) return <span key={i} class="rlc-cs-ban-none" role="img" aria-label={t('csBanNone')} title={t('csBanNone')} />;
            const champ = champions.get(id);
            return champ?.icon ? <img key={i} src={champ.icon} alt={champ.name} title={champ.name} /> : <span key={i} class="rlc-cs-ban-empty" />;
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Subtimes da Arena na ordem das vagas (o client usa os mesmos nomes e ícones). */
const SUBTEAMS = ['Poro', 'Minion', 'Scuttle', 'Krug', 'Raptor', 'Sentinel'];

/**
 * Arena: os outros times em grupos pequenos (um por subtime, pela vaga), cada um com o ícone do subtime e os
 * campeões escolhidos. Os banimentos de todos ficam juntos embaixo, como no client.
 */
export function ArenaTeams({ cells, size, champions, bans }: { cells: Cell[]; size: number; champions: Map<number, Champion>; bans: number[] }) {
  const groups = new Map<number, Cell[]>();
  for (const c of [...cells].sort((a, b) => a.cellId - b.cellId)) {
    const g = Math.floor(c.cellId / size);
    groups.set(g, [...(groups.get(g) ?? []), c]);
  }
  return (
    <div class="rlc-cs-side rlc-cs-arena" data-side="theirs">
      {[...groups].map(([g, list]) => {
        const name = SUBTEAMS[g] ?? '';
        return (
          <div key={g} class="rlc-cs-subteam" aria-label={name}>
            {name ? <img class="rlc-cs-subteam-icon" src={`/fe/lol-champ-select/images/subteams/${name}.png`} alt={name} title={name} /> : null}
            {list.map((c) => {
              const shown = displayedChampion(c);
              const champ = shown ? champions.get(shown.championId) : undefined;
              return (
                <span key={c.cellId} class="rlc-cs-subteam-pick" data-locked={shown?.locked ? 'true' : undefined} title={champ?.name ?? t('cellPicking')}>
                  {champ?.icon ? <img src={champ.icon} alt={champ.name} /> : null}
                </span>
              );
            })}
          </div>
        );
      })}
      {bans.length ? (
        <div class="rlc-cs-bans" aria-label={t('bans')} title={t('bans')}>
          {bans.map((id, i) => {
            const champ = champions.get(id);
            return champ?.icon ? <img key={i} src={champ.icon} alt={champ.name} title={champ.name} /> : <span key={i} class="rlc-cs-ban-none" role="img" aria-label={t('csBanNone')} />;
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Arte da vaga: skin escolhida depois de confirmar, senão a base do campeão em destaque. */
function useCellArt(cell: Cell, splash: Lcu['game']['splash']): string | null {
  const shown = displayedChampion(cell);
  const skinId = shown ? (shown.locked && cell.selectedSkinId > 0 ? cell.selectedSkinId : shown.championId * 1000) : 0;
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(null);
    if (!skinId) return;
    let live = true;
    void splash(skinId).then((u) => live && setUrl(u)).catch(() => {});
    return () => void (live = false);
  }, [skinId, splash]);
  return useDecoded(url);
}

const Art = ({ url, locked }: { url: string | null; locked: boolean }) => (url ? <span class="rlc-cs-art" data-locked={locked ? 'true' : undefined} style={{ backgroundImage: `url("${url}")` }} aria-hidden="true" /> : null);

function Slot({ cell, acting, local, champions, spells, name, splash, menu, rankQueue, real }: { cell: Cell; acting?: 'ban' | 'pick'; local: boolean; champions: Map<number, Champion>; spells: Map<number, Spell>; name: Lcu['name']; splash: Lcu['game']['splash']; menu?: ComponentChildren; rankQueue: string | null; real?: RealName }) {
  const shown = displayedChampion(cell);
  const champ = shown ? champions.get(shown.championId) : undefined;
  const label = useCellName(cell, name);
  const art = useCellArt(cell, splash);
  const puuid = real?.puuid || cell.puuid || undefined;
  const pos = positionKey((cell.assignedPosition ?? '').toUpperCase());
  const status = acting === 'ban' ? t('cellBanning') : acting === 'pick' ? t('cellPicking') : (champ?.name ?? '');
  return (
    <div class="rlc-cs-cell" data-active={acting ? 'true' : undefined} data-local={local ? 'true' : undefined}>
      <Art url={art} locked={shown?.locked === true} />
      {pos ? (
        <span class="rlc-cs-pos" role="img" aria-label={t(pos)} title={t(pos)}>
          <RoleIcon role={cell.assignedPosition} />
        </span>
      ) : null}
      <div class="rlc-cs-meta">
        <span class="rlc-cs-name" title={real ? `${real.gameName}#${real.tagLine}` : undefined}>
          {real ? real.gameName : label}
          {real?.tagLine ? <small class="rlc-cs-tag">#{real.tagLine}</small> : null}
        </span>
        <Rank puuid={puuid} queue={rankQueue} />
        {puuid ? <PlayerLine puuid={puuid} queue={rankQueue} /> : null}
        {status ? (
          <span class="rlc-cs-status" data-champ={!acting && champ ? 'true' : undefined}>
            {status}
          </span>
        ) : null}
      </div>
      <span class="rlc-cs-sub">
        {[cell.spell1Id, cell.spell2Id].map((id, i) => {
          const spell = spells.get(id);
          return spell?.icon ? <img key={i} class="rlc-cs-spell" src={spell.icon} alt={spell.name} /> : null;
        })}
      </span>
      {menu}
    </div>
  );
}

/** Vaga inimiga: só o campeão (ou "escolhendo…"), como no client. */
function Foe({ cell, acting, champions, splash }: { cell: Cell; acting?: 'ban' | 'pick'; champions: Map<number, Champion>; splash: Lcu['game']['splash'] }) {
  const shown = displayedChampion(cell);
  const champ = shown ? champions.get(shown.championId) : undefined;
  const art = useCellArt(cell, splash);
  const status = acting === 'ban' ? t('cellBanning') : (champ?.name ?? t('cellPicking'));
  return (
    <div class="rlc-cs-cell" data-active={acting ? 'true' : undefined} data-empty={champ ? undefined : 'true'}>
      <Art url={art} locked={shown?.locked === true} />
      <div class="rlc-cs-meta">
        <span class="rlc-cs-status">{status}</span>
      </div>
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

const pct = (x: number) => new Intl.NumberFormat(locale(), { style: 'percent', maximumFractionDigits: 0 }).format(x);
const dec = (x: number) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(x);

/** Vitórias na temporada da fila, KDA médio e rota mais jogada das últimas 20 partidas, numa linha só. */
function PlayerLine({ puuid, queue }: { puuid: string; queue: string | null }) {
  const [season, setSeason] = useState<{ wins: number; losses: number } | null>(null);
  const [recent, setRecent] = useState<Recent | null>(null);
  useEffect(() => {
    setSeason(null);
    setRecent(null);
    let live = true;
    if (queue)
      void statsOf(puuid).then((m) => {
        const e = m?.[queue];
        if (live && e && (e.wins ?? 0) + (e.losses ?? 0) > 0) setSeason({ wins: e.wins ?? 0, losses: e.losses ?? 0 });
      });
    void recentOf(puuid).then((r) => live && setRecent(r));
    return () => void (live = false);
  }, [puuid, queue]);
  if (!season && !recent?.games) return null;
  const total = season ? season.wins + season.losses : 0;
  return (
    <span class="rlc-cs-stats">
      {season ? (
        <span title={`${t('csSeasonWins')}: ${season.wins}${t('csWinsShort')} ${season.losses}${t('csLossesShort')}`}>
          {pct(season.wins / total)}
          <small>{` ${season.wins}${t('csWinsShort')} ${season.losses}${t('csLossesShort')}`}</small>
        </span>
      ) : null}
      {recent?.kda != null ? <span title={t('csRecentKda')}>{`${dec(recent.kda)} KDA`}</span> : null}
      {recent?.lane ? (
        <span title={t('csRecentLane')}>
          <RoleIcon role={recent.lane} />
        </span>
      ) : null}
    </span>
  );
}
