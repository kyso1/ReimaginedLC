import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import type { Champion, Spell } from '../../data/gamedata';
import { Rank, statsOf } from '../../ui/Rank';
import { RoleIcon } from '../../ui/RoleIcon';
import { positionKey } from '../lobby/format';
import { BRAVERY, displayedChampion, type ArenaBan, type Cell, type Subteam } from './logic';
import { recentOf, type RealName, type Recent } from './names';
import { useDecoded } from '../../ui/useDecoded';
import { usePulse } from './fx';

interface TeamProps {
  cells: Cell[];
  side: 'mine' | 'theirs';
  /** Banimentos do time sob os cartões (Arena); nos outros modos ficam na faixa do cabeçalho. 0 é banimento nulo. */
  bans?: number[];
  /** Vagas agindo agora e o que fazem. */
  active: Map<number, 'ban' | 'pick'>;
  /** Quanto resta do tempo da fase (0 a 1), para a barra de quem está na vez. */
  left?: number;
  /** Campeão que cada aliado quer banir ou já baniu, só na fase de banimento. */
  intents?: Map<number, { championId: number; done: boolean }>;
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
  /** ARAM: retrato pequeno do campeão no canto do cartão (não há rota para mostrar ali); é onde os voos pousam. */
  icons?: boolean;
  /** Título da coluna no lugar de "Seu time" (Arena: o nome do subtime). */
  title?: string;
  /** Favoritos da torcida da Arena: quem travou um deles ganha o selo. */
  crowd?: Set<number>;
  /** Conteúdo abaixo dos cartões (Arena: a ordem de escolha). */
  footer?: ComponentChildren;
}

/**
 * Coluna de um time: um cartão alto por vaga com a splash do campeão. Vazio mostra "?"; em destaque (ainda não travou)
 * a arte fica apagada; travado, cor cheia com o filete na borda e uma varredura de luz na hora em que a LCU confirma.
 * Quem está na vez ganha o anel pulsando e a barra do tempo. Inimigos ficam espelhados: a LCU não mostra o destaque
 * deles, então o campeão só aparece ao travar.
 */
export function Team({ cells, side, bans = [], active, left = 1, intents, localCellId, champions, spells, name, splash, menuFor, rankQueue = null, real, extra = [], icons = false, title, crowd, footer }: TeamProps) {
  return (
    <div class="rlc-cs-side" data-side={side}>
      <h2 class="rlc-cs-team-title">{title ?? t(side === 'mine' ? 'csYourTeam' : 'csEnemyTeam')}</h2>
      <div class="rlc-cs-team">
        {cells.map((c, i) =>
          side === 'mine' ? (
            <Slot key={c.cellId} cell={c} acting={active.get(c.cellId)} left={left} intent={intents?.get(c.cellId)} local={c.cellId === localCellId} champions={champions} spells={spells} name={name} splash={splash} menu={menuFor?.(c)} rankQueue={rankQueue} real={real?.get(c.cellId)} icon={icons} crowd={crowd} />
          ) : (
            <Foe key={c.cellId} cell={c} index={i} acting={active.get(c.cellId)} left={left} champions={champions} splash={splash} />
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
      {footer}
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

/** Subtimes da Arena na ordem das vagas (o client usa os mesmos ícones, em `/fe/lol-champ-select/images/subteams`). */
export const SUBTEAMS = ['Poro', 'Minion', 'Scuttle', 'Krug', 'Raptor', 'Sentinel', 'Wolf', 'Gromp'] as const;
const SUBTEAM_NAME: Record<(typeof SUBTEAMS)[number], TextKey> = {
  Poro: 'csSubPoro',
  Minion: 'csSubMinion',
  Scuttle: 'csSubScuttle',
  Krug: 'csSubKrug',
  Raptor: 'csSubRaptor',
  Sentinel: 'csSubSentinel',
  Wolf: 'csSubWolf',
  Gromp: 'csSubGromp',
};
/** Retrato da Ousadia na grade e nas vagas e o fundo dela no palco (artes do client). */
export const BRAVERY_ICON = '/fe/lol-champ-select/images/champion-grid/bravery-champion.png';
export const BRAVERY_BG = '/fe/lol-champ-select/images/background/bravery-splash-background.png';

/** Nome do subtime da Arena pelo índice, como no client; passando dos oito conhecidos, "Equipe N". */
export const subteamLabel = (index: number): string => {
  const key = SUBTEAMS[index];
  return key ? t(SUBTEAM_NAME[key]) : `${t('csTeamN')} ${index + 1}`;
};

/** Selo no retrato ou no nome: favorito da torcida (dourado) ou Ousadia (laranja). Desenhos próprios, não do client. */
export function Badge({ kind }: { kind: 'crowd' | 'brave' }) {
  const label = t(kind === 'brave' ? 'csBravery' : 'csCrowdFavorite');
  return (
    <i class="rlc-cs-badge" data-kind={kind} role="img" aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {kind === 'brave' ? (
          <path d="M13 2c.6 3.6 5 5.6 5 11a6 6 0 0 1-12 0c0-2.4 1.1-4 2.4-5.2.2 1.8.9 2.8 2 3.4C10.2 8 10.8 5 13 2z" />
        ) : (
          <path d="M12 3.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zM6.2 21v-3a5.8 5.8 0 0 1 11.6 0v3zM4.8 7.7a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6zM1 20v-2.4a3.9 3.9 0 0 1 5-3.7A7.6 7.6 0 0 0 4.4 18v2zM19.2 7.7a2.3 2.3 0 1 0 0 4.6 2.3 2.3 0 0 0 0-4.6zM23 20v-2.4a3.9 3.9 0 0 0-5-3.7 7.6 7.6 0 0 1 1.6 4.1v2z" />
        )}
      </svg>
    </i>
  );
}

interface ArenaTeamsProps {
  subteams: Subteam[];
  champions: Map<number, Champion>;
  /** Banimento de cada jogador, por vaga (`arenaBanCells`). */
  bans: Map<number, ArenaBan>;
  active: Map<number, 'ban' | 'pick'>;
  /** Quanto resta do tempo da fase (0 a 1), para a barra do time que está na vez. */
  left?: number;
  crowd?: Set<number>;
  /** Vaga cuja Ousadia está na roleta agora. */
  rolling?: number;
}

/**
 * Arena: os outros times (duplas ou trios, quantos a sessão trouxer) compactos na coluna da direita, cada um na sua
 * cor, com o ícone e o nome do subtime e, por jogador, o retrato do campeão (travado, em destaque ou a Ousadia), o
 * banimento no canto do retrato (escondido até a revelação) e o selo de favorito da torcida ou de Ousadia.
 */
export function ArenaTeams({ subteams, champions, bans, active, left = 1, crowd, rolling }: ArenaTeamsProps) {
  return (
    <div class="rlc-cs-side rlc-cs-arena" data-side="theirs">
      <h2 class="rlc-cs-team-title">{t('csOtherTeams')}</h2>
      {subteams.map((team) => {
        const key = SUBTEAMS[team.index];
        const label = subteamLabel(team.index);
        const doing = team.cells.map((c) => active.get(c.cellId)).find(Boolean);
        return (
          <section key={team.index} class="rlc-cs-subteam" aria-label={label} data-team={team.index % 8} data-size={team.cells.length} data-acting={doing ? 'true' : undefined}>
            <header class="rlc-cs-subteam-head">
              {key ? <img class="rlc-cs-subteam-icon" src={`/fe/lol-champ-select/images/subteams/${key}.png`} alt="" /> : null}
              <span>{label}</span>
              {doing ? <em>{t(doing === 'ban' ? 'cellBanning' : 'cellPicking')}</em> : null}
            </header>
            <div class="rlc-cs-subteam-picks">
              {team.cells.map((c) => {
                const brave = c.championId === BRAVERY;
                const shown = displayedChampion(c);
                const champ = shown ? champions.get(shown.championId) : undefined;
                const acting = active.get(c.cellId);
                const text = brave ? t('csBravery') : (champ?.name ?? (acting === 'ban' ? t('cellBanning') : acting === 'pick' ? t('cellPicking') : t('csSubWaiting')));
                const icon = brave ? BRAVERY_ICON : champ?.icon;
                const ban = bans.get(c.cellId);
                const banned = ban?.state === 'done' ? champions.get(ban.id) : undefined;
                const banLabel = !ban ? '' : ban.state === 'hidden' ? t('csBanHidden') : ban.state === 'none' ? t('csBanNone') : `${t('csBanned')}: ${banned?.name ?? ''}`;
                const who = c.nameVisibilityType !== 'HIDDEN' ? c.gameName : '';
                return (
                  <div key={c.cellId} class="rlc-cs-subteam-pick" title={who || undefined} data-locked={brave || shown?.locked ? 'true' : undefined} data-acting={acting} data-rolling={rolling === c.cellId ? 'true' : undefined}>
                    <span class="rlc-cs-subteam-face">
                      {icon ? <img key={icon} src={icon} alt="" /> : null}
                      {ban && ban.state !== 'intent' ? (
                        <i class="rlc-cs-subteam-ban" data-ban-cell={c.cellId} data-state={ban.state} role="img" aria-label={banLabel} title={banLabel}>
                          {banned?.icon ? <img src={banned.icon} alt="" /> : null}
                        </i>
                      ) : null}
                      {brave ? <Badge kind="brave" /> : shown?.locked && crowd?.has(shown.championId) ? <Badge kind="crowd" /> : null}
                    </span>
                    <span class="rlc-cs-subteam-name" title={text}>
                      {text}
                    </span>
                  </div>
                );
              })}
            </div>
            {doing ? (
              <span class="rlc-cs-subteam-bar" aria-hidden="true">
                <i style={{ transform: `scaleX(${left})` }} />
              </span>
            ) : null}
          </section>
        );
      })}
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

/** Tempo das animações de um disparo do cartão ao travar (varredura de luz, salto); o CSS usa os mesmos. */
export const CARD_FX_MS = 900;

/**
 * Camadas do cartão que precisam de recorte (arte, véu, varredura, filete e barra do tempo). Ficam num recorte à
 * parte para o menu de trocas poder sair do cartão.
 */
function Layers({ url, locked, acting, left }: { url: string | null; locked: boolean; acting: boolean; left: number }) {
  return (
    <span class="rlc-cs-clip" aria-hidden="true">
      {url ? <span class="rlc-cs-art" data-locked={locked ? 'true' : undefined} style={{ backgroundImage: `url("${url}")` }} /> : null}
      <i class="rlc-cs-veil" />
      <b class="rlc-cs-q">?</b>
      <i class="rlc-cs-sweep" />
      <i class="rlc-cs-edge" />
      {acting ? (
        <span class="rlc-cs-turnbar">
          <i style={{ transform: `scaleX(${left})` }} />
        </span>
      ) : null}
    </span>
  );
}

const stateOf = (shown: { locked: boolean } | null, brave = false) => (brave || shown?.locked ? 'locked' : shown ? 'hover' : 'empty');

function Slot({ cell, acting, left, intent, local, champions, spells, name, splash, menu, rankQueue, real, icon, crowd }: { crowd?: Set<number>; icon?: boolean; cell: Cell; acting?: 'ban' | 'pick'; left: number; intent?: { championId: number; done: boolean }; local: boolean; champions: Map<number, Champion>; spells: Map<number, Spell>; name: Lcu['name']; splash: Lcu['game']['splash']; menu?: ComponentChildren; rankQueue: string | null; real?: RealName }) {
  const shown = displayedChampion(cell);
  const champ = shown ? champions.get(shown.championId) : undefined;
  const label = useCellName(cell, name);
  const art = useCellArt(cell, splash);
  const puuid = real?.puuid || cell.puuid || undefined;
  const pos = positionKey((cell.assignedPosition ?? '').toUpperCase());
  // Ousadia travada (Arena): o campeão só aparece no jogo; a vaga mostra a arte da Ousadia.
  const brave = cell.championId === BRAVERY;
  const locked = brave || shown?.locked === true;
  // Só quando a LCU confirma o travamento com a tela aberta.
  const fx = usePulse(locked, CARD_FX_MS);
  const doing = acting === 'ban' ? t('cellBanning') : acting === 'pick' ? t('cellPicking') : '';
  const who = brave ? t('csBravery') : (champ?.name ?? '');
  const status = locked ? who : who ? `${who} · ${doing || t('csIntent')}` : doing;
  const ban = intent ? champions.get(intent.championId) : undefined;
  const banLabel = ban ? `${t(intent!.done ? 'csBanned' : 'csBanIntent')}: ${ban.name}` : '';
  return (
    <div class="rlc-cs-cell" data-state={stateOf(shown, brave)} data-active={acting ? 'true' : undefined} data-local={local ? 'true' : undefined} data-fx={fx ? 'lock' : undefined}>
      <Layers url={brave ? BRAVERY_BG : art} locked={locked} acting={!!acting} left={left} />
      {pos ? (
        <span class="rlc-cs-pos" role="img" aria-label={t(pos)} title={t(pos)}>
          <RoleIcon role={cell.assignedPosition} />
        </span>
      ) : icon ? (
        <span class="rlc-cs-ic" data-fly={`cell:${cell.cellId}`} aria-hidden="true">
          {champ?.icon ? <img key={champ.id} src={champ.icon} alt="" /> : null}
        </span>
      ) : null}
      <span class="rlc-cs-sub">
        {[cell.spell1Id, cell.spell2Id].map((id, i) => {
          const spell = spells.get(id);
          return spell?.icon ? <img key={i} class="rlc-cs-spell" src={spell.icon} alt={spell.name} /> : null;
        })}
      </span>
      <div class="rlc-cs-meta">
        <span class="rlc-cs-who">
          <span class="rlc-cs-name" title={real ? `${real.gameName}#${real.tagLine}` : undefined}>
            {real ? real.gameName : label}
            {real?.tagLine ? <small class="rlc-cs-tag">#{real.tagLine}</small> : null}
          </span>
          {local ? <u class="rlc-cs-you">{t('socYou')}</u> : null}
          {brave ? <Badge kind="brave" /> : locked && crowd?.has(cell.championId) ? <Badge kind="crowd" /> : null}
        </span>
        <Rank puuid={puuid} queue={rankQueue} />
        {puuid ? <PlayerLine puuid={puuid} queue={rankQueue} /> : null}
        {status ? (
          <span class="rlc-cs-status" data-champ={locked && who ? 'true' : undefined}>
            {status}
          </span>
        ) : null}
      </div>
      {ban ? (
        <span class="rlc-cs-intent" data-ban-cell={cell.cellId} data-done={intent!.done ? 'true' : undefined} role="img" aria-label={banLabel} title={banLabel}>
          {ban.icon ? <img src={ban.icon} alt="" /> : null}
        </span>
      ) : null}
      {menu}
    </div>
  );
}

/**
 * Vaga inimiga: "Inimigo N" (o nome só quando a LCU o mostra, como nas personalizadas) e o campeão depois de travado.
 * A arte entra pelo lado de fora na hora em que a escolha é revelada.
 */
function Foe({ cell, index, acting, left, champions, splash }: { cell: Cell; index: number; acting?: 'ban' | 'pick'; left: number; champions: Map<number, Champion>; splash: Lcu['game']['splash'] }) {
  const shown = displayedChampion(cell);
  const champ = shown ? champions.get(shown.championId) : undefined;
  const art = useCellArt(cell, splash);
  const locked = shown?.locked === true;
  const fx = usePulse(locked, CARD_FX_MS);
  const status = champ?.name ?? (acting === 'ban' ? t('cellBanning') : acting === 'pick' ? t('cellPicking') : '');
  return (
    <div class="rlc-cs-cell" data-state={stateOf(shown)} data-active={acting ? 'true' : undefined} data-empty={champ ? undefined : 'true'} data-fx={fx ? 'lock' : undefined}>
      <Layers url={art} locked={locked} acting={!!acting} left={left} />
      <div class="rlc-cs-meta">
        <span class="rlc-cs-who">
          <span class="rlc-cs-name">{foeName(cell, index)}</span>
        </span>
        {status ? (
          <span class="rlc-cs-status" data-champ={locked ? 'true' : undefined}>
            {status}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Nome do inimigo quando a LCU o mostra; escondido (ranqueada, nomes ocultos) vira "Inimigo N". */
export const foeName = (cell: Cell, index: number): string => (cell.nameVisibilityType !== 'HIDDEN' && cell.gameName) || `${t('csEnemy')} ${index + 1}`;

/** `gameName` quando vier; senão o nome buscado pelo puuid (vazio para jogadores ocultos). */
export function useCellName(cell: Cell, name: Lcu['name']): string {
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
