import { useEffect, useState } from 'preact/hooks';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { useDecoded } from '../../ui/useDecoded';
import { formatClock } from '../lobby/format';
import { getJson, inFilter, kda, mine, num, playerName, relativeDay, teamGold, tierLabel, type Game, type QueueFilter, type Timeline } from './data';

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
function useFetched<T>(url: string | null): T | null {
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
  const id = encodeURIComponent(puuid);
  const summoner = useFetched<Summoner>(`/lol-summoner/v2/summoners/puuid/${id}`);
  const ranked = useFetched<Ranked>(`/lol-ranked/v1/ranked-stats/${id}`);
  const [splashUrl, setSplashUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void lcu.profile(puuid).then((p) => lcu.game.splash(p?.backgroundSkinId)).then((u) => live && setSplashUrl(u));
    return () => void (live = false);
  }, [lcu, puuid]);
  const splash = useDecoded(splashUrl);
  const solo = ranked?.queueMap?.RANKED_SOLO_5x5;
  const games = (solo?.wins ?? 0) + (solo?.losses ?? 0);
  const line = [tierLabel(solo?.tier, solo?.division), summoner?.summonerLevel ? `${t('level')} ${summoner.summonerLevel}` : '', games ? `${Math.round(((solo!.wins ?? 0) / games) * 100)}${t('winRateSuffix')}` : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <section class="rlc-profile" data-tab={tab}>
      <div class="rlc-pf-bg" style={splash ? { backgroundImage: `url("${splash}")` } : undefined} />
      <nav class="rlc-tabs-text">
        {TABS.map(([k, label]) => (
          <button type="button" key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
            {t(label)}
          </button>
        ))}
      </nav>
      {tab === 'summary' ? (
        <div class="rlc-pf-showcase">
          <h1 class="rlc-pf-name">{summoner?.gameName ?? ''}</h1>
          <p class="rlc-pf-line">{line}</p>
        </div>
      ) : null}
      {tab === 'history' ? <History lcu={lcu} puuid={puuid} /> : null}
      {tab === 'ranked' ? <RankedCards ranked={ranked} /> : null}
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

function History({ lcu, puuid }: { lcu: Lcu; puuid: string }) {
  const champions = useChampions(lcu);
  const [games, setGames] = useState<Game[]>([]);
  const [count, setCount] = useState(PAGE);
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [open, setOpen] = useState<{ gameId: number; originY: number } | null>(null);
  const [exhausted, setExhausted] = useState(false);
  useEffect(() => {
    let live = true;
    const beg = count - PAGE;
    void getJson<{ games?: { games?: Game[] } }>(`/lol-match-history/v1/products/lol/${encodeURIComponent(puuid)}/matches?begIndex=${beg}&endIndex=${count}`).then((r) => {
      if (!live) return;
      const page = r?.games?.games ?? [];
      if (!page.length) setExhausted(true);
      setGames((prev) => [...prev.slice(0, beg), ...page]);
    });
    return () => void (live = false);
  }, [puuid, count]);
  const queueName = (id: number) => lcu.queues.value.data?.find((q) => q.id === id)?.name ?? '';

  if (open) return <MatchDetail lcu={lcu} puuid={puuid} gameId={open.gameId} originY={open.originY} onBack={() => setOpen(null)} />;
  return (
    <div class="rlc-mh">
      <div class="rlc-chip-row">
        {FILTERS.map(([f, label]) => (
          <button type="button" key={f} class="rlc-queue-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {t(label)}
          </button>
        ))}
      </div>
      <div class="rlc-mh-list">
        {games
          .filter((g) => inFilter(g.queueId, filter))
          .map((g) => {
            const p = mine(g, puuid);
            const champ = champions.get(p?.championId ?? 0);
            return (
              <button
                type="button"
                key={g.gameId}
                class="rlc-mh-row"
                data-win={p?.stats.win ? 'true' : 'false'}
                onClick={(e) => setOpen({ gameId: g.gameId, originY: (e.currentTarget as HTMLElement).offsetTop })}
              >
                {champ?.icon ? <img src={champ.icon} alt="" /> : <span class="rlc-mh-icon" />}
                <b class="rlc-mh-mark" />
                <span class="rlc-mh-main">{`${champ?.name ?? ''} · ${p ? kda(p) : ''}`}</span>
                <small>{queueName(g.queueId)}</small>
                <small>{formatClock(g.gameDuration)}</small>
                <small>{relativeDay(g.gameCreation)}</small>
              </button>
            );
          })}
      </div>
      {!exhausted && games.length ? (
        <button type="button" class="rlc-button" data-variant="pill" onClick={() => setCount(count + PAGE)}>
          {t('loadMore')}
        </button>
      ) : null}
    </div>
  );
}

type DetailTab = 'board' | 'stats' | 'charts';
const DETAIL_TABS: Array<[DetailTab, TextKey]> = [
  ['board', 'mdBoard'],
  ['stats', 'mdStats'],
  ['charts', 'mdCharts'],
];

/** Detalhe da partida: cresce a partir da linha clicada até a tela inteira (o "zoom" do client atual). */
function MatchDetail({ lcu, puuid, gameId, originY, onBack }: { lcu: Lcu; puuid: string; gameId: number; originY: number; onBack: () => void }) {
  const champions = useChampions(lcu);
  const game = useFetched<Game>(`/lol-match-history/v1/games/${gameId}`);
  const [tab, setTab] = useState<DetailTab>('board');
  const timeline = useFetched<Timeline>(tab === 'charts' ? `/lol-match-history/v1/game-timelines/${gameId}` : null);
  const [items, setItems] = useState<Map<number, string>>(new Map());
  useEffect(() => {
    let live = true;
    void lcu.game.items().then((m) => live && setItems(m));
    return () => void (live = false);
  }, [lcu]);
  const n = new Intl.NumberFormat(locale());
  const me = game ? mine(game, puuid) : undefined;
  const teams = game ? [100, 200].map((id) => game.participants.filter((p) => p.teamId === id)) : [];

  return (
    <div class="rlc-md" style={{ '--rlc-origin-y': `${originY}px` }}>
      <button type="button" class="rlc-button" data-variant="pill" onClick={onBack}>
        {t('backToHistory')}
      </button>
      {game ? (
        <>
          <h2 class="rlc-md-result">{me?.stats.win ? t('victory') : t('defeat')}</h2>
          <p class="rlc-muted">{`${champions.get(me?.championId ?? 0)?.name ?? ''} · ${lcu.queues.value.data?.find((q) => q.id === game.queueId)?.name ?? ''} · ${formatClock(game.gameDuration)}`}</p>
          <nav class="rlc-tabs-text">
            {DETAIL_TABS.map(([k, label]) => (
              <button type="button" key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
                {t(label)}
              </button>
            ))}
          </nav>
          {tab === 'board'
            ? teams.map((team, i) => (
                <table key={i} class="rlc-md-team">
                  <tbody>
                    {team.map((p) => (
                      <tr key={p.participantId} data-me={p === me ? 'true' : undefined}>
                        <td>{champions.get(p.championId)?.icon ? <img class="rlc-md-champ" src={champions.get(p.championId)!.icon} alt="" /> : null}</td>
                        <td>{`${playerName(game, p.participantId)} · ${champions.get(p.championId)?.name ?? ''}`}</td>
                        <td>{kda(p)}</td>
                        <td>
                          <div class="rlc-md-items">
                            {[0, 1, 2, 3, 4, 5, 6].map((s) => {
                              const icon = items.get(num(p, `item${s}`));
                              return icon ? <img key={s} src={icon} alt="" /> : <span key={s} class="rlc-md-noitem" />;
                            })}
                          </div>
                        </td>
                        <td>{n.format(num(p, 'totalDamageDealtToChampions'))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))
            : null}
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
                    <td>{playerName(game, p.participantId)}</td>
                    <td>{n.format(num(p, 'totalDamageDealtToChampions'))}</td>
                    <td>{n.format(num(p, 'goldEarned'))}</td>
                    <td>{n.format(num(p, 'visionScore'))}</td>
                    <td>{n.format(num(p, 'totalMinionsKilled') + num(p, 'neutralMinionsKilled'))}</td>
                    <td>{n.format(num(p, 'damageDealtToObjectives'))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {tab === 'charts' && timeline ? <GoldChart game={game} timeline={timeline} /> : null}
        </>
      ) : null}
    </div>
  );
}

function GoldChart({ game, timeline }: { game: Game; timeline: Timeline }) {
  const teamOf = Object.fromEntries(game.participants.map((p) => [p.participantId, p.teamId]));
  const { blue, red } = teamGold(timeline, teamOf);
  const max = Math.max(1, ...blue, ...red);
  const pts = (series: number[]) => series.map((v, i) => `${(i / Math.max(1, series.length - 1)) * 300},${120 - (v / max) * 110}`).join(' ');
  return (
    <figure class="rlc-md-chart">
      <figcaption class="rlc-muted">{t('teamGold')}</figcaption>
      <svg viewBox="0 0 300 120" preserveAspectRatio="none" role="img" aria-label={t('teamGold')}>
        <polyline points={pts(blue)} data-team="100" />
        <polyline points={pts(red)} data-team="200" />
      </svg>
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
