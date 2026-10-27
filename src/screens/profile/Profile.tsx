import { Loader } from '../../ui/Loader';
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { Rank } from '../../ui/Rank';
import { useDecoded } from '../../ui/useDecoded';
import { useEscape } from '../../ui/useEscape';
import { useDrawerClose } from '../modes/Modes';
import { formatClock } from '../lobby/format';
import {
  byDay, getJson, inFilter, kda, kdaRatio, laneOf, mine, niceStep, num, perks, playerName, relativeDay, teamGold, tierLabel,
  type Game, type Participant, type Perk, type QueueFilter, type Timeline,
} from './data';
import { crestFromId, prestigeTheme, type BannerCatalog, type ChallengeSummary, type Look } from './look';
import { Badge, IdentityModal, type Tab as IdentityTab } from './Identity';
import { TftHistory } from './TftHistory';
import { PlayerHover } from './PlayerHover';
import { canReportFromHistory, PlayerMenu, ReportDialog, useReported, type EogTarget } from '../postgame/Report';

type Tab = 'summary' | 'history' | 'ranked' | 'mastery';
const TABS: Array<[Tab, TextKey]> = [
  ['summary', 'profileSummary'],
  ['history', 'profileHistory'],
  ['ranked', 'profileRanked'],
  ['mastery', 'profileMastery'],
];

interface Summoner {
  gameName?: string;
  tagLine?: string;
  summonerLevel?: number;
  profileIconId?: number;
}
interface QueueEntry {
  tier?: string;
  division?: string;
  leaguePoints?: number;
  wins?: number;
  losses?: number;
  previousSeasonEndTier?: string;
  previousSeasonEndDivision?: string;
}
type Ranked = { queueMap?: Record<string, QueueEntry> } | null;

/** Valor de uma leitura assíncrona por chave; null até chegar. */
export function useFetched<T>(url: string | null): T | null {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    setValue(null);
    if (!url) return;
    let live = true;
    void getJson<T>(url).then((v) => live && setValue(v));
    return () => void (live = false);
  }, [url]);
  return value;
}

function useChampions(lcu: Lcu) {
  const [map, setMap] = useState<Awaited<ReturnType<Lcu['game']['champions']>>>(new Map());
  useEffect(() => {
    let live = true;
    void lcu.game.champions().then((m) => live && setMap(m));
    return () => void (live = false);
  }, [lcu]);
  return map;
}

/** Perfil de um jogador (o próprio ou um amigo): vitrine e abas Histórico, Ranqueadas, Maestria. */
export function Profile({ lcu, puuid }: { lcu: Lcu; puuid: string }) {
  const [tab, setTab] = useState<Tab>('summary');
  // Aba para onde vai quando o quadro do histórico termina de descer; null = quadro parado.
  const [leaving, setLeaving] = useState<Tab | null>(null);
  // Histórico e Ranqueadas sobem num quadro abaixo do nome. Com o quadro aberto, trocar de aba (ou clicar na mesma
  // de novo) desce o quadro antes.
  const sheet = tab === 'history' || tab === 'ranked';
  const pick = (k: Tab) => (sheet ? setLeaving(k === tab ? 'summary' : k) : setTab(k));
  const id = encodeURIComponent(puuid);
  const summoner = useFetched<Summoner>(`/lol-summoner/v2/summoners/puuid/${id}`);
  const ranked = useFetched<Ranked>(`/lol-ranked/v1/ranked-stats/${id}`);
  const summary = useFetched<ChallengeSummary>(`/lol-challenges/v1/summary-player-data/player/${id}`);
  // Catálogo de estandartes (com imagem e nome); serve para qualquer jogador.
  const banners = useFetched<BannerCatalog>('/lol-regalia/v3/inventory/REGALIA_BANNER');
  const me = lcu.currentSummoner.value.data as { puuid?: string; summonerId?: number } | null;
  const own = !!me?.puuid && me.puuid === puuid;
  const [skin, setSkin] = useState(0);
  useEffect(() => {
    let live = true;
    void lcu.profile(puuid).then((p) => live && setSkin(p?.backgroundSkinId ?? 0));
    return () => void (live = false);
  }, [lcu, puuid]);
  // O que foi trocado na janela vale por cima do que veio da LCU (o perfil público fica em cache na sessão).
  const [edited, setEdited] = useState<Look | null>(null);
  // Aba da janela de identidade aberta; null = fechada.
  const [customizing, setCustomizing] = useState<IdentityTab | null>(null);
  const solo = ranked?.queueMap?.RANKED_SOLO_5x5;
  const level = summoner?.summonerLevel ?? 0;
  const look: Look = edited ?? {
    icon: summoner?.profileIconId ?? 0,
    crest: crestFromId(summary?.crestId),
    prestige: prestigeTheme(summary?.prestigeCrestBorderLevel ?? level),
    tier: solo?.previousSeasonEndTier || solo?.tier || '',
    banner: summary?.bannerId ?? '1',
    title: summary?.title?.itemId ? String(summary.title.itemId) : '',
    titleName: summary?.title?.name ?? '',
    skin,
    level,
  };
  const [splashUrl, setSplashUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void lcu.game.splash(look.skin || undefined).then((u) => live && setSplashUrl(u));
    return () => void (live = false);
  }, [lcu, look.skin]);
  const splash = useDecoded(splashUrl);
  const games = (solo?.wins ?? 0) + (solo?.losses ?? 0);
  // O elo vem do <Rank> (`{ícone} • {elo} {PDL}`); aqui só nível e taxa de vitórias.
  const line = [level ? `${t('level')} ${level}` : '', games ? `${Math.round(((solo!.wins ?? 0) / games) * 100)}${t('winRateSuffix')}` : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <section class="rlc-profile" data-tab={tab} data-sheet={sheet && !leaving ? 'true' : undefined}>
      <div class="rlc-pf-bg" style={splash ? { backgroundImage: `url("${splash}")` } : undefined} />
      <nav class="rlc-tabs-text">
        {TABS.map(([k, label]) => (
          <button type="button" key={k} aria-current={(leaving ?? tab) === k ? 'page' : undefined} onClick={() => pick(k)}>
            {t(label)}
          </button>
        ))}
      </nav>
      {tab === 'summary' || sheet ? (
        <div class="rlc-pf-showcase">
          <Badge look={look} banners={banners} onEdit={own ? setCustomizing : undefined} bare />
          <div class="rlc-pf-who">
            <h1 class="rlc-pf-name">{summoner?.gameName ?? ''}</h1>
            {look.titleName ? <p class="rlc-pf-title">{look.titleName}</p> : null}
            <p class="rlc-pf-line">
              <Rank puuid={puuid} queue="RANKED_SOLO_5x5" />
              {line ? <span>{line}</span> : null}
            </p>
          </div>
        </div>
      ) : null}
      {own && tab === 'summary' && !leaving ? (
        <button type="button" class="rlc-button rlc-pf-customize" data-variant="pill" onClick={() => setCustomizing('icons')}>
          {t('profCustomize')}
        </button>
      ) : null}
      {customizing ? (
        <IdentityModal
          lcu={lcu}
          puuid={puuid}
          summonerId={me?.summonerId}
          name={summoner?.gameName ?? ''}
          look={look}
          banners={banners}
          splash={splash}
          initialTab={customizing}
          onChange={setEdited}
          onClose={() => setCustomizing(null)}
        />
      ) : null}
      {sheet ? (
        <HistorySheet
          key={tab}
          label={t(tab === 'ranked' ? 'profileRanked' : 'profileHistory')}
          leaving={!!leaving}
          onLeave={() => !customizing && setLeaving('summary')}
          onClosed={() => {
            setTab(leaving ?? 'summary');
            setLeaving(null);
          }}
        >
          {tab === 'ranked' ? <RankedCards ranked={ranked} /> : <History lcu={lcu} puuid={puuid} ranked={ranked} />}
        </HistorySheet>
      ) : null}
      {tab === 'mastery' ? <Mastery lcu={lcu} puuid={puuid} /> : null}
    </section>
  );
}

const FILTERS: Array<[QueueFilter, TextKey]> = [
  ['all', 'filterAll'],
  ['ranked', 'filterRanked'],
  ['normal', 'filterNormal'],
  ['aram', 'filterAram'],
];
const PAGE = 20;

/** Quadro de vidro que sobe sobre o perfil; desce (animado) quando `leaving` liga, e só então avisa `onClosed`. */
function HistorySheet({ label, leaving, onLeave, onClosed, children }: { label: string; leaving: boolean; onLeave: () => void; onClosed: () => void; children: ComponentChildren }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useDrawerClose(ref, onClosed);
  useEffect(() => void (leaving && close()), [leaving]);
  useEscape(onLeave);
  return (
    <div ref={ref} class="rlc-pf-sheet" role="region" aria-label={label}>
      {children}
    </div>
  );
}

/** Seletor de jogo do quadro: LoL ou TFT (cada um com feed, filtros e coluna próprios). */
function GameSwitch({ tft, onChange }: { tft: boolean; onChange: (tft: boolean) => void }) {
  return (
    <div class="rlc-pf-game" role="group" aria-label={t('pfTftGame')}>
      <button type="button" aria-pressed={!tft} onClick={() => onChange(false)}>
        {t('pfTftLol')}
      </button>
      <button type="button" aria-pressed={tft} onClick={() => onChange(true)}>
        {t('modeTft')}
      </button>
    </div>
  );
}

const TFT_QUEUES: Array<[string, TextKey]> = [
  ['RANKED_TFT', 'filterRanked'],
  ['RANKED_TFT_DOUBLE_UP', 'pfTftDoubleUp'],
];

function History({ lcu, puuid, ranked }: { lcu: Lcu; puuid: string; ranked: Ranked }) {
  const [tft, setTft] = useState(false);
  const head = <GameSwitch tft={tft} onChange={setTft} />;
  const champions = useChampions(lcu);
  const [games, setGames] = useState<Game[]>([]);
  const [count, setCount] = useState(PAGE);
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [open, setOpen] = useState<{ gameId: number; originY: number } | null>(null);
  const [exhausted, setExhausted] = useState(false);
  // Página em voo: o botão fica desabilitado (dois cliques pulariam uma página).
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setLoading(true);
    const beg = count - PAGE;
    void getJson<{ games?: { games?: Game[] } }>(`/lol-match-history/v1/products/lol/${encodeURIComponent(puuid)}/matches?begIndex=${beg}&endIndex=${count}`).then((r) => {
      if (!live) return;
      setLoading(false);
      const page = r?.games?.games ?? [];
      if (!page.length) setExhausted(true);
      setGames((prev) => [...prev.slice(0, beg), ...page]);
    });
    return () => void (live = false);
  }, [puuid, count]);
  const queueName = (id: number) => lcu.queues.value.data?.find((q) => q.id === id)?.name ?? '';

  if (tft) return <TftHistory lcu={lcu} puuid={puuid} head={head} elo={<EloPanel ranked={ranked} queues={TFT_QUEUES} />} />;
  if (open) return <MatchDetail lcu={lcu} puuid={puuid} gameId={open.gameId} originY={open.originY} onBack={() => setOpen(null)} />;
  const days = byDay(games.filter((g) => inFilter(g.queueId, filter)));
  return (
    <div class="rlc-pf-feedwrap">
      <div class="rlc-mh">
        {head}
        <div class="rlc-chip-row">
          {FILTERS.map(([f, label]) => (
            <button type="button" key={f} class="rlc-queue-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {t(label)}
            </button>
          ))}
        </div>
        <div class="rlc-mh-list">
          {days.map((d) => (
            <section key={d.label} class="rlc-pf-day">
              <h3>{d.label}</h3>
              <div>
                {d.games.map((g) => {
                  const p = mine(g, puuid);
                  const champ = champions.get(p?.championId ?? 0);
                  const lane = laneOf(g, p);
                  return (
                    <button
                      type="button"
                      key={g.gameId}
                      class="rlc-mh-row"
                      data-win={p?.stats.win ? 'true' : 'false'}
                      onClick={(e) => setOpen({ gameId: g.gameId, originY: (e.currentTarget as HTMLElement).offsetTop })}
                    >
                      {champ?.icon ? <img src={champ.icon} alt={champ.name} title={champ.name} /> : <span class="rlc-mh-icon" />}
                      <b>{p?.stats.win ? t('victory') : t('defeat')}</b>
                      <span class="rlc-mh-meta">{[queueName(g.queueId), lane ? t(lane) : ''].filter(Boolean).join(' · ')}</span>
                      <span class="rlc-mh-kda">{p ? kda(p) : ''}</span>
                      <small>{formatClock(g.gameDuration)}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          {/* Roda enquanto a página chega (a primeira ou "carregar mais"); a LCU pode levar segundos. */}
          {loading ? <Loader small label={t('mhLoading')} /> : null}
          {!loading && !days.length ? <p class="rlc-muted">{t('profNoGames')}</p> : null}
        </div>
        {!exhausted && games.length ? (
          <button type="button" class="rlc-button" data-variant="pill" disabled={loading} onClick={() => setCount(count + PAGE)}>
            {t('loadMore')}
          </button>
        ) : null}
      </div>
      <aside class="rlc-pf-aside">
        <EloPanel ranked={ranked} />
        <RolesPanel games={games} puuid={puuid} />
        <KdaPanel games={games.slice(0, PAGE)} puuid={puuid} />
      </aside>
    </div>
  );
}

const crestUrl = (tier: string) => `/fe/lol-static-assets/images/ranked-mini-crests/${tier.toLowerCase()}.svg`;

/** Elo de cada fila com a barra de PdL (0 a 100; elos de topo enchem a barra). */
function EloPanel({ ranked, queues = QUEUES }: { ranked: Ranked; queues?: Array<[string, TextKey]> }) {
  return (
    <div class="rlc-pf-panel">
      <h4>{t('profEloByQueue')}</h4>
      {queues.map(([q, label]) => {
        const e = ranked?.queueMap?.[q];
        const tier = tierLabel(e?.tier, e?.division);
        const lp = e?.leaguePoints ?? 0;
        return (
          <div key={q} class="rlc-pf-elo">
            {tier ? <img src={crestUrl(e!.tier!)} alt="" /> : <span />}
            <b>{tier || t('unranked')}</b>
            <small>{tier ? `${t(label)} · ${lp} ${t('lp')}` : t(label)}</small>
            <span class="rlc-pf-bar">
              <i style={{ width: `${tier ? Math.min(100, lp) : 0}%` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

const pct = (a: number, b: number) => `${Math.round((a / Math.max(1, b)) * 100)}%`;

/** Rotas das partidas carregadas (só Summoner's Rift): fatia dos jogos na barra, taxa de vitórias ao lado. */
function RolesPanel({ games, puuid }: { games: Game[]; puuid: string }) {
  const by = new Map<TextKey, { n: number; w: number }>();
  for (const g of games) {
    const p = mine(g, puuid);
    const lane = laneOf(g, p);
    if (!lane) continue;
    const r = by.get(lane) ?? { n: 0, w: 0 };
    r.n++;
    if (p?.stats.win) r.w++;
    by.set(lane, r);
  }
  const total = [...by.values()].reduce((s, r) => s + r.n, 0);
  if (!total) return null;
  return (
    <div class="rlc-pf-panel">
      <h4>
        <span>{t('profRoles')}</span>
        <span>{`${total} ${t('profGames')}`}</span>
      </h4>
      <div class="rlc-pf-roles">
        <small />
        <small>{t('profColGames')}</small>
        <small>{t('profColWins')}</small>
        {[...by.entries()]
          .sort((a, b) => b[1].n - a[1].n)
          .map(([lane, r]) => [
            <span key={`${lane}n`}>{t(lane)}</span>,
            <span key={`${lane}b`} class="rlc-pf-bar" title={pct(r.n, total)}>
              <i style={{ width: pct(r.n, total) }} />
            </span>,
            <span key={`${lane}w`} class="rlc-muted">
              {pct(r.w, r.n)}
            </span>,
          ])}
      </div>
    </div>
  );
}

/** KDA das últimas partidas em linha, da mais antiga (esquerda) à mais recente; tracejado na média. */
function KdaPanel({ games, puuid }: { games: Game[]; puuid: string }) {
  if (games.length < 2) return null;
  const ps = games.map((g) => mine(g, puuid)).reverse();
  const values = ps.map(kdaRatio);
  const sum = (k: string) => ps.reduce((s, p) => s + num(p, k), 0);
  const avg = (sum('kills') + sum('assists')) / Math.max(1, sum('deaths'));
  const top = Math.max(6, ...values);
  const w = 200;
  const h = 48;
  const y = (v: number) => (h - 4 - (Math.min(v, top) / top) * (h - 8)).toFixed(1);
  const dec = new Intl.NumberFormat(locale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  return (
    <div class="rlc-pf-panel">
      <h4>
        <span>{`${t('kda')} · ${t('profLast')} ${games.length}`}</span>
        <span>{`${t('profAverage')} ${dec.format(avg)}`}</span>
      </h4>
      <svg class="rlc-pf-kda" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={`${t('kda')}: ${values.map((v) => dec.format(v)).join(', ')}`}>
        <line x1="0" x2={w} y1={y(avg)} y2={y(avg)} />
        <polyline points={values.map((v, i) => `${(4 + (i * (w - 8)) / (values.length - 1)).toFixed(1)},${y(v)}`).join(' ')} />
      </svg>
    </div>
  );
}

type DetailTab = 'board' | 'stats' | 'charts';
const DETAIL_TABS: Array<[DetailTab, TextKey]> = [
  ['board', 'mdBoard'],
  ['stats', 'mdStats'],
  ['charts', 'mdCharts'],
];

export interface Icons {
  champions: Awaited<ReturnType<Lcu['game']['champions']>>;
  items: Map<number, string>;
  spells: Awaited<ReturnType<Lcu['game']['spells']>>;
  runes: Map<number, Perk>;
}

/** Ícones de campeões, itens, feitiços e runas para o placar; mapas vazios até chegar (e se a LCU falhar). */
export function useIcons(lcu: Lcu): Icons {
  const champions = useChampions(lcu);
  const [rest, setRest] = useState<Omit<Icons, 'champions'>>({ items: new Map(), spells: new Map(), runes: new Map() });
  useEffect(() => {
    let live = true;
    void Promise.all([lcu.game.items(), lcu.game.spells(), perks()]).then(([items, spells, runes]) => live && setRest({ items, spells, runes }));
    return () => void (live = false);
  }, [lcu]);
  return { champions, ...rest };
}

const cs = (p: Participant) => num(p, 'totalMinionsKilled') + num(p, 'neutralMinionsKilled');
const damageOf = (p: Participant) => num(p, 'totalDamageDealtToChampions');

/** Detalhe da partida: cresce a partir da linha clicada até a tela inteira (o "zoom" do client atual). */
function MatchDetail({ lcu, puuid, gameId, originY, onBack }: { lcu: Lcu; puuid: string; gameId: number; originY: number; onBack: () => void }) {
  const icons = useIcons(lcu);
  const game = useFetched<Game>(`/lol-match-history/v1/games/${gameId}`);
  const [tab, setTab] = useState<DetailTab>('board');
  const timeline = useFetched<Timeline>(tab === 'charts' ? `/lol-match-history/v1/game-timelines/${gameId}` : null);
  const n = new Intl.NumberFormat(locale());
  const me = game ? mine(game, puuid) : undefined;
  const champ = (p: Participant | undefined) => icons.champions.get(p?.championId ?? 0);
  // Ações por jogador, como no client: ver perfil, convidar para o meu lobby, adicionar e denunciar (até 5 dias).
  const [reporting, setReporting] = useState<EogTarget | null>(null);
  const [reported, markReported] = useReported(game?.gameId);
  const menuFor = (p: Participant) => {
    const who = game?.participantIdentities.find((x) => x.participantId === p.participantId)?.player;
    if (!game || !who?.puuid || who.puuid === lcu.chatMe.value.data?.puuid) return null;
    const target: EogTarget = { puuid: who.puuid, summonerId: who.summonerId ?? 0, name: playerName(game, p.participantId) };
    const report = canReportFromHistory(game.gameCreation) && !reported.has(who.puuid) ? () => setReporting(target) : undefined;
    return <PlayerMenu lcu={lcu} target={target} invite="lobby" onReport={report} />;
  };

  return (
    <div class="rlc-md" style={{ '--rlc-origin-y': `${originY}px` }}>
      <button type="button" class="rlc-button rlc-md-back" data-variant="pill" onClick={onBack}>
        {t('backToHistory')}
      </button>
      {game ? (
        <>
          <h2 class="rlc-md-result">{me?.stats.win ? t('victory') : t('defeat')}</h2>
          <p class="rlc-muted">{`${champ(me)?.name ?? ''} · ${lcu.queues.value.data?.find((q) => q.id === game.queueId)?.name ?? ''} · ${formatClock(game.gameDuration)}`}</p>
          <nav class="rlc-tabs-text">
            {DETAIL_TABS.map(([k, label]) => (
              <button type="button" key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
                {t(label)}
              </button>
            ))}
          </nav>
          {tab === 'board' ? <Board game={game} me={me} icons={icons} menuFor={menuFor} lcu={lcu} /> : null}
          {tab === 'stats' ? (
            <table class="rlc-md-team rlc-md-stats">
              <thead>
                <tr>
                  <th />
                  <th>{t('damage')}</th>
                  <th>{t('gold')}</th>
                  <th>{t('vision')}</th>
                  <th>{t('farm')}</th>
                  <th>{t('objectives')}</th>
                </tr>
              </thead>
              <tbody>
                {game.participants.map((p) => (
                  <tr key={p.participantId} data-me={p === me ? 'true' : undefined} data-team={p.teamId}>
                    <td>
                      <span class="rlc-md-who">
                        {champ(p)?.icon ? <img class="rlc-md-mini" src={champ(p)!.icon} alt="" /> : <span class="rlc-md-mini" />}
                        {playerName(game, p.participantId)}
                      </span>
                    </td>
                    <td>{n.format(damageOf(p))}</td>
                    <td>{n.format(num(p, 'goldEarned'))}</td>
                    <td>{n.format(num(p, 'visionScore'))}</td>
                    <td>{n.format(cs(p))}</td>
                    <td>{n.format(num(p, 'damageDealtToObjectives'))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {tab === 'charts' ? (
            <div class="rlc-md-charts">
              {timeline?.frames?.length ? <GoldChart game={game} timeline={timeline} /> : null}
              <DamageBars game={game} me={me} icons={icons} />
            </div>
          ) : null}
        </>
      ) : (
        <Loader label={t('mhLoading')} />
      )}
      {reporting && game ? (
        <ReportDialog
          gameId={game.gameId}
          target={reporting}
          game="lol"
          from="history"
          onSent={() => {
            markReported(reporting.puuid);
            setReporting(null);
          }}
          onClose={() => setReporting(null)}
        />
      ) : null}
    </div>
  );
}

const TEAMS: Array<[number, TextKey]> = [
  [100, 'mdBlueTeam'],
  [200, 'mdRedTeam'],
];

// Colunas do placar (a largura de cada uma fica no CSS, por data-col).
const COLS = ['champ', 'loadout', 'name', 'kda', 'cs', 'items', 'gold', 'damage'];

/** Ícone com nome no balão; sem ícone vira um encaixe vazio do mesmo tamanho (a grade não pula). */
export const icon = (src: string | undefined, cls: string, name = '') => (src ? <img class={cls} src={src} alt={name} title={name || undefined} /> : <span class={cls} />);

/** Placar no padrão do client: campeão com nível, feitiços e runas, jogador, A/M/A, farm, 7 itens (o 7º é o amuleto), ouro e dano. */
/** Placar dos dois times. `menuFor` põe ações por jogador ao lado do nome (fim de jogo: convidar, adicionar, denunciar). */
export function Board({ game, me, icons, menuFor, lcu }: { game: Game; me: Participant | undefined; icons: Icons; menuFor?: (p: Participant) => ComponentChildren; lcu?: Lcu }) {
  const n = new Intl.NumberFormat(locale());
  const dec = new Intl.NumberFormat(locale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const minutes = Math.max(1, game.gameDuration / 60);
  const maxDamage = Math.max(1, ...game.participants.map(damageOf));
  return (
    <>
      {TEAMS.map(([teamId, label]) => {
        const team = game.participants.filter((p) => p.teamId === teamId);
        if (!team.length) return null;
        const total = (key: string) => team.reduce((s, p) => s + num(p, key), 0);
        return (
          <table key={teamId} class="rlc-md-team rlc-md-board" data-team={teamId}>
            <colgroup>
              {COLS.map((c) => (
                <col key={c} data-col={c} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th colSpan={3}>
                  <span class="rlc-md-side">{t(label)}</span>
                  <span class="rlc-md-outcome">{team[0]!.stats.win ? t('victory') : t('defeat')}</span>
                </th>
                <th>{`${total('kills')}/${total('deaths')}/${total('assists')}`}</th>
                <th>{t('farm')}</th>
                <th>{t('mdItems')}</th>
                <th>{t('gold')}</th>
                <th>{t('damage')}</th>
              </tr>
            </thead>
            <tbody>
              {team.map((p) => {
                const ch = icons.champions.get(p.championId);
                const s1 = icons.spells.get(p.spell1Id ?? 0);
                const s2 = icons.spells.get(p.spell2Id ?? 0);
                const keystone = icons.runes.get(num(p, 'perk0'));
                const sub = icons.runes.get(num(p, 'perkSubStyle'));
                return (
                  <tr key={p.participantId} data-me={p === me ? 'true' : undefined}>
                    <td class="rlc-md-champcell">
                      {icon(ch?.icon, 'rlc-md-champ', ch?.name)}
                      {num(p, 'champLevel') ? <b class="rlc-md-lvl">{num(p, 'champLevel')}</b> : null}
                    </td>
                    <td>
                      <div class="rlc-md-loadout">
                        {icon(s1?.icon, 'rlc-md-spell', s1?.name)}
                        {icon(keystone?.icon, 'rlc-md-rune', keystone?.name)}
                        {icon(s2?.icon, 'rlc-md-spell', s2?.name)}
                        {icon(sub?.icon, 'rlc-md-rune', sub?.name)}
                      </div>
                    </td>
                    <td class="rlc-md-name">
                      {(() => {
                        const who = game.participantIdentities.find((x) => x.participantId === p.participantId)?.player;
                        const name = <span>{playerName(game, p.participantId)}</span>;
                        // Com o mouse no nome: fundo de perfil e elo, sem abrir o perfil (bots não têm puuid).
                        return lcu && who?.puuid ? (
                          <PlayerHover lcu={lcu} player={{ puuid: who.puuid, name: playerName(game, p.participantId), tag: who.tagLine, icon: who.profileIcon }}>
                            {name}
                          </PlayerHover>
                        ) : (
                          name
                        );
                      })()}
                      <small>{ch?.name ?? ''}</small>
                      {menuFor?.(p)}
                    </td>
                    <td>{kda(p)}</td>
                    <td class="rlc-md-cs">
                      <span>{n.format(cs(p))}</span>
                      <small>{`${dec.format(cs(p) / minutes)}/min`}</small>
                    </td>
                    <td>
                      <div class="rlc-md-items">
                        {[0, 1, 2, 3, 4, 5, 6].map((s) => {
                          const src = icons.items.get(num(p, `item${s}`));
                          return src ? <img key={s} class="rlc-md-item" src={src} alt="" data-slot={s} /> : <span key={s} class="rlc-md-item" data-slot={s} />;
                        })}
                      </div>
                    </td>
                    <td>{n.format(num(p, 'goldEarned'))}</td>
                    <td class="rlc-md-dmg">
                      <span>{n.format(damageOf(p))}</span>
                      <span class="rlc-md-fill" style={{ width: `${(damageOf(p) / maxDamage) * 100}%` }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      })}
    </>
  );
}

// Medidas do gráfico em unidades do viewBox; o SVG escala inteiro (texto junto) sem distorcer.
const W = 720;
const H = 240;
const PAD = { l: 52, r: 16, t: 12, b: 28 };

/** Ouro somado de cada time minuto a minuto: eixo de ouro à esquerda, minutos embaixo, dica por minuto. */
export function GoldChart({ game, timeline }: { game: Game; timeline: Timeline }) {
  const teamOf = Object.fromEntries(game.participants.map((p) => [p.participantId, p.teamId]));
  const { blue, red } = teamGold(timeline, teamOf);
  const at = timeline.frames.map((f) => f.timestamp / 60000);
  const lastMin = Math.max(1, at[at.length - 1] ?? 1);
  const peak = Math.max(1, ...blue, ...red);
  const step = niceStep(peak);
  const top = Math.ceil(peak / step) * step;
  const minStep = Math.max(1, niceStep(lastMin, 6));
  const x = (m: number) => PAD.l + (m / lastMin) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / top) * (H - PAD.t - PAD.b);
  const pts = (series: number[]) => series.map((v, i) => `${x(at[i]!).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const c = new Intl.NumberFormat(locale(), { notation: 'compact', maximumFractionDigits: 1 });
  const yTicks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const xTicks = Array.from({ length: Math.floor(lastMin / minStep) + 1 }, (_, i) => i * minStep);
  const end = (series: number[]) => series[series.length - 1] ?? 0;
  return (
    <figure class="rlc-md-chart">
      <figcaption>
        <b>{t('teamGold')}</b>
        <span class="rlc-md-legend" data-team="100">{`${t('mdBlueTeam')} ${c.format(end(blue))}`}</span>
        <span class="rlc-md-legend" data-team="200">{`${t('mdRedTeam')} ${c.format(end(red))}`}</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('teamGold')}>
        {yTicks.map((v) => (
          <g key={`y${v}`} class="rlc-md-grid">
            <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} />
            <text x={PAD.l - 8} y={y(v)} text-anchor="end" dominant-baseline="middle">
              {c.format(v)}
            </text>
          </g>
        ))}
        {xTicks.map((m) => (
          <text key={`x${m}`} class="rlc-md-axis" x={x(m)} y={H - 8} text-anchor="middle">
            {`${m} min`}
          </text>
        ))}
        <polyline points={pts(blue)} data-team="100" />
        <polyline points={pts(red)} data-team="200" />
        {at.map((m, i) => {
          const x0 = x(Math.max(0, m - 0.5));
          return (
            <rect key={i} class="rlc-md-hit" x={x0} y={PAD.t} width={x(Math.min(lastMin, m + 0.5)) - x0} height={H - PAD.t - PAD.b}>
              <title>{`${Math.round(m)} min · ${t('mdBlueTeam')} ${c.format(blue[i]!)} · ${t('mdRedTeam')} ${c.format(red[i]!)}`}</title>
            </rect>
          );
        })}
      </svg>
    </figure>
  );
}

/** Dano a campeões de cada jogador: uma barra por jogador, todas na escala do maior dano da partida. */
export function DamageBars({ game, me, icons }: { game: Game; me: Participant | undefined; icons: Icons }) {
  const n = new Intl.NumberFormat(locale());
  const max = Math.max(1, ...game.participants.map(damageOf));
  return (
    <figure class="rlc-md-chart">
      <figcaption>
        <b>{t('mdDamageByPlayer')}</b>
      </figcaption>
      <ul class="rlc-md-bars">
        {[...game.participants]
          .sort((a, b) => a.teamId - b.teamId)
          .map((p) => {
            const ch = icons.champions.get(p.championId);
            return (
              <li key={p.participantId} data-team={p.teamId} data-me={p === me ? 'true' : undefined}>
                {icon(ch?.icon, 'rlc-md-mini', ch?.name)}
                <span class="rlc-md-barname">{playerName(game, p.participantId)}</span>
                <span class="rlc-md-track">
                  <span class="rlc-md-fill" style={{ width: `${(damageOf(p) / max) * 100}%` }} />
                </span>
                <span class="rlc-md-barval">{n.format(damageOf(p))}</span>
              </li>
            );
          })}
      </ul>
    </figure>
  );
}

const QUEUES: Array<[string, TextKey]> = [
  ['RANKED_SOLO_5x5', 'rankedSolo'],
  ['RANKED_FLEX_SR', 'rankedFlex'],
  ['RANKED_TFT', 'rankedTft'],
];

function RankedCards({ ranked }: { ranked: Ranked }) {
  const prev = ranked?.queueMap?.RANKED_SOLO_5x5;
  const prevLabel = tierLabel(prev?.previousSeasonEndTier, prev?.previousSeasonEndDivision);
  return (
    <div class="rlc-rk">
      <div class="rlc-rk-cards">
        {QUEUES.map(([q, label]) => {
          const e = ranked?.queueMap?.[q];
          const tier = tierLabel(e?.tier, e?.division);
          return (
            <div key={q} class="rlc-rk-card" data-tier={(e?.tier || 'none').toLowerCase()}>
              <small>{t(label)}</small>
              <div class="rlc-rk-emblem" style={e?.tier && tier ? { backgroundImage: `url("/fe/lol-static-assets/images/ranked-emblem/emblem-${e.tier.toLowerCase()}.png")` } : undefined} />
              <strong>{tier || t('unranked')}</strong>
              {tier ? <span class="rlc-muted">{`${e!.leaguePoints ?? 0} ${t('lp')} · ${e!.wins ?? 0} ${t('winsShort')} / ${e!.losses ?? 0} ${t('lossesShort')}`}</span> : null}
            </div>
          );
        })}
      </div>
      {prevLabel ? <p class="rlc-muted">{`${t('previousSeason')}: ${prevLabel}`}</p> : null}
    </div>
  );
}

type Sort = 'points' | 'level' | 'name';
const SORTS: Array<[Sort, TextKey]> = [
  ['points', 'sortPoints'],
  ['level', 'sortLevel'],
  ['name', 'sortName'],
];

function Mastery({ lcu, puuid }: { lcu: Lcu; puuid: string }) {
  const champions = useChampions(lcu);
  const list = useFetched<Array<{ championId: number; championLevel: number; championPoints: number }>>(`/lol-champion-mastery/v1/${encodeURIComponent(puuid)}/champion-mastery`) ?? [];
  const [sort, setSort] = useState<Sort>('points');
  const [query, setQuery] = useState('');
  const n = new Intl.NumberFormat(locale(), { notation: 'compact' });
  const name = (id: number) => champions.get(id)?.name ?? String(id);
  const q = query.trim().toLowerCase();
  const shown = list
    .filter((m) => !q || name(m.championId).toLowerCase().includes(q))
    .sort((a, b) => (sort === 'points' ? b.championPoints - a.championPoints : sort === 'level' ? b.championLevel - a.championLevel || b.championPoints - a.championPoints : name(a.championId).localeCompare(name(b.championId))));
  return (
    <div class="rlc-ms">
      <div class="rlc-chip-row">
        <input type="search" class="rlc-input" placeholder={t('searchChampion')} aria-label={t('searchChampion')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
        {SORTS.map(([s, label]) => (
          <button type="button" key={s} class="rlc-queue-chip" aria-pressed={sort === s} onClick={() => setSort(s)}>
            {t(label)}
          </button>
        ))}
      </div>
      <div class="rlc-ms-grid">
        {shown.map((m) => (
          <div key={m.championId} class="rlc-ms-champ" aria-label={name(m.championId)} title={name(m.championId)}>
            <span class="rlc-ms-ring" data-level={Math.min(m.championLevel, 10)}>
              {champions.get(m.championId)?.icon ? <img src={champions.get(m.championId)!.icon} alt="" /> : null}
              <b>{m.championLevel}</b>
            </span>
            <span>{name(m.championId)}</span>
            <small>{n.format(m.championPoints)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
