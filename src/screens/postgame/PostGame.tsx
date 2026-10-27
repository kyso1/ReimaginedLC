import type { ComponentChildren } from 'preact';
import { PlayerMenu, ReportDialog, useReported, type EogTarget } from './Report';
import { ReplayButton } from '../profile/ReplayButton';
import { useEffect, useState } from 'preact/hooks';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolEndOfGameEndOfGameStats, LolEndOfGameTFTEndOfGameViewModel } from '../../lcu/types';
import { Rank, rankedQueueOf } from '../../ui/Rank';
import { useAction } from '../../ui/useAction';
import { formatClock } from '../lobby/format';
import { getJson, kda, mine, num, ordinal, playerName, tierLabel, type Game, type Participant, type Timeline } from '../profile/data';
import { Board, DamageBars, GoldChart, icon, useFetched, useIcons, type Icons } from '../profile/Profile';
import { activeTraits, art, band, eogArt, fromEog, meIn, pairs, placeOf as tftPlace, queueOf, tftMatches, tftStats as summarize, tftUrl, type TftArt, type TftMatch, type TftPlayer } from '../profile/tft';
import { pic, TftStandings, Trait, useTftArt, type Art } from '../profile/TftHistory';
import { Loader } from '../../ui/Loader';
import { boardValue, compHistory, compKey, contested, eliminationOrder, hasAny, itemCount, roundLabel, top4Streak, topBy, topUsed, toNextDivision, traitProgress } from './tftInsights';

// Chaves do bloco do fim de jogo → nomes do histórico; assim o placar e os gráficos do perfil servem aqui sem cópia.
const KEYS: Record<string, string> = {
  kills: 'CHAMPIONS_KILLED', deaths: 'NUM_DEATHS', assists: 'ASSISTS', totalMinionsKilled: 'MINIONS_KILLED', neutralMinionsKilled: 'NEUTRAL_MINIONS_KILLED',
  goldEarned: 'GOLD_EARNED', totalDamageDealtToChampions: 'TOTAL_DAMAGE_DEALT_TO_CHAMPIONS', visionScore: 'VISION_SCORE', champLevel: 'LEVEL',
  perk0: 'PERK0', perkSubStyle: 'PERK_SUB_STYLE',
};

/** O bloco do fim de jogo no formato de uma partida do histórico (times 100 e 200, itens em item0..6). */
export function eogToGame(eog: LolEndOfGameEndOfGameStats): Game {
  const participants: Participant[] = [];
  const participantIdentities: Game['participantIdentities'] = [];
  (eog.teams ?? []).forEach((tm, ti) =>
    (tm.players ?? []).forEach((p) => {
      const raw = (p.stats ?? {}) as Record<string, number | undefined>;
      const stats: Participant['stats'] = { win: !!tm.isWinningTeam };
      for (const [k, src] of Object.entries(KEYS)) stats[k] = Number(raw[src] ?? 0);
      (p.items ?? []).forEach((it, s) => (stats[`item${s}`] = it));
      const participantId = participants.length + 1;
      participants.push({ participantId, teamId: p.teamId || tm.teamId || (ti ? 200 : 100), championId: p.championId, spell1Id: p.spell1Id, spell2Id: p.spell2Id, stats });
      participantIdentities.push({ participantId, player: { gameName: p.riotIdGameName || p.summonerName, tagLine: p.riotIdTagLine, puuid: p.puuid, summonerId: p.summonerId, profileIcon: p.profileIconId } });
    }),
  );
  return { gameId: eog.gameId ?? 0, queueId: 0, gameDuration: eog.gameLength ?? 0, gameCreation: 0, participants, participantIdentities };
}

const cs = (p: Participant) => num(p, 'totalMinionsKilled') + num(p, 'neutralMinionsKilled');
const ratio = (p: Participant) => (num(p, 'kills') + num(p, 'assists')) / Math.max(1, num(p, 'deaths'));
const METRICS: Array<[TextKey, (p: Participant) => number]> = [
  ['kda', ratio],
  ['farm', cs],
  ['damage', (p) => num(p, 'totalDamageDealtToChampions')],
  ['vision', (p) => num(p, 'visionScore')],
];
/** Posição do jogador na partida por uma medida (1 = maior). */
const placeOf = (all: Participant[], p: Participant, f: (p: Participant) => number) => all.filter((o) => f(o) > f(p)).length + 1;

interface LpChange {
  gameId?: number;
  queueType?: string;
  tier?: string;
  division?: string;
  leaguePoints?: number;
  leaguePointsDelta?: number;
}
interface MasteryUpdate {
  level?: number;
  pointsGained?: number;
  championPointsGained?: number;
  hasLeveledUp?: boolean;
  pointsSinceLastLevelBeforeGame?: number;
  pointsUntilNextLevelAfterGame?: number;
  grade?: string;
}

type Tab = 'board' | 'charts';

/** Sem dados do fim de jogo depois disso, a tela aparece mesmo assim. */
const GIVE_UP_MS = 8000;

/**
 * Fim de jogo: o resultado em letras grandes sobre a splash do seu campeão, seus números com a posição na partida,
 * progresso (conta, PDL, maestria) ao lado e o placar do perfil embaixo. TFT mostra colocação e composição final.
 */
export function PostGame({ lcu }: { lcu: Lcu }) {
  const eog = lcu.endOfGame.value.data;
  const queue = lcu.gameflowSession.value.data?.gameData?.queue;
  const tft = queue?.gameMode === 'TFT' || eog?.gameMode === 'TFT';
  const gameId = eog?.gameId || lcu.gameflowSession.value.data?.gameData?.gameId || 0;
  const tftStats = useFetched<LolEndOfGameTFTEndOfGameViewModel>(tft ? '/lol-end-of-game/v1/tft-eog-stats' : null);
  // Lidos uma vez por partida; 204/404 viram null e a parte some.
  const lastLp = useFetched<LpChange>(gameId ? '/lol-ranked/v1/current-lp-change-notification' : null);
  // O aviso fica até a próxima ranqueada: de outra partida, não vale.
  const lp = lastLp && (!lastLp.gameId || lastLp.gameId === gameId) ? lastLp : null;
  const mastery = useFetched<MasteryUpdate>(gameId && !tft ? '/lol-end-of-game/v1/champion-mastery-updates' : null);
  // O histórico traz a partida completa (e a linha do tempo) alguns segundos depois; até lá vale o bloco do fim de jogo.
  const history = useFetched<Game>(gameId && !tft ? `/lol-match-history/v1/games/${gameId}` : null);
  const icons = useIcons(lcu);
  const [tab, setTab] = useState<Tab>('board');
  const timeline = useFetched<Timeline>(history && tab === 'charts' ? `/lol-match-history/v1/game-timelines/${gameId}` : null);
  const again = useAction(() => request('POST', '/lol-lobby/v2/play-again'));
  // As duas independentes: dismiss-stats falha quando não há resultados (404), e a recusa precisa sair mesmo assim.
  const leave = useAction(() => Promise.allSettled([request('POST', '/lol-end-of-game/v1/state/dismiss-stats'), request('POST', '/lol-lobby/v2/play-again-decline')]));

  const n = new Intl.NumberFormat(locale());
  const game = history?.participants?.length ? history : eog ? eogToGame(eog) : null;
  const me = game && eog?.localPlayer ? mine(game, eog.localPlayer.puuid) : undefined;
  const myTeam = eog?.teams?.find((tm) => tm.isPlayerTeam);
  const tftMe = tftStats?.localPlayer ?? tftStats?.players?.find((p) => p.isLocalPlayer);
  const place = tftMe ? (tftMe.partnerGroupId > 0 ? Math.ceil(tftMe.rank / 2) : tftMe.rank) : 0;
  const result = tft && place ? 'place' : myTeam ? (myTeam.isWinningTeam ? 'win' : 'loss') : undefined;
  const title = result === 'place' ? ordinal(place) : result === 'win' ? t('victory') : result === 'loss' ? t('defeat') : '—';
  const champ = icons.champions.get(eog?.localPlayer?.championId ?? 0);
  const length = eog?.gameLength ?? tftStats?.gameLength;
  // TFT: o fundo de TFT do mapa (o fundo personalizado do usuário tira, ver styles.css); a arte da Pequena Lenda vai no lugar do retrato.
  // A arte do lobby do set ocupa a tela inteira; a de gameflow tem uma faixa escura à direita, feita para a interface da Riot.
  const assets = lcu.gameflowSession.value.data?.map?.assets as Record<string, string> | undefined;
  const arena = `/${assets?.['parties-background'] ?? assets?.['gameflow-background'] ?? 'lol-game-data/assets/ASSETS/UX/TFT/OutOfGame/Backgrounds/gameflow.jpg'}`;
  const legend = tftMe?.companion?.icon;
  const bg = tft ? `url("${arena}")` : eog?.localPlayer?.skinSplashPath ? `url("${eog.localPlayer.skinSplashPath}")` : '';
  const where = [queue?.description || lcu.queues.value.data?.find((q) => q.type === eog?.queueType)?.name, typeof length === 'number' ? formatClock(length) : ''].filter(Boolean);
  // A LCU ainda não respondeu o fim de jogo: a animação de carregando, por até GIVE_UP_MS (depois a tela mostra o que tiver, com os botões).
  const [gaveUp, setGaveUp] = useState(false);
  const [reporting, setReporting] = useState<EogTarget | null>(null);
  const [reported, markReported] = useReported(eog?.gameId);
  useEffect(() => {
    const id = setTimeout(() => setGaveUp(true), GIVE_UP_MS);
    return () => clearTimeout(id);
  }, []);
  // Ações por jogador (não eu, não bot): pelo puuid da linha do placar, com o summonerId do fim de jogo.
  const targets = new Map<string, EogTarget>([
    ...(eog?.teams ?? []).flatMap((tm) => tm.players ?? []).filter((p) => !p.isLocalPlayer && !p.botPlayer && p.puuid).map((p) => [p.puuid, { puuid: p.puuid, summonerId: p.summonerId, name: p.riotIdGameName || p.summonerName || '' }] as const),
    ...(tftStats?.players ?? []).filter((p) => !p.isLocalPlayer && p.puuid).map((p) => [p.puuid, { puuid: p.puuid, summonerId: p.summonerId, name: p.riotIdGameName || '' }] as const),
  ]);
  const menuForPuuid = (puuid: string | undefined) => {
    const target = puuid ? targets.get(puuid) : undefined;
    return target ? <PlayerMenu lcu={lcu} target={target} invite="endOfGame" onReport={reported.has(target.puuid) ? undefined : () => setReporting(target)} /> : null;
  };
  const menuFor = (p: Participant) => menuForPuuid(game?.participantIdentities.find((x) => x.participantId === p.participantId)?.player.puuid);
  if (lcu.endOfGame.value.status === 'loading' && !tftStats && !gaveUp) return <section class="rlc-ingame"><Loader label={t('gameWaitingStats')} /></section>;

  return (
    <section class="rlc-postgame" data-mode={tft ? 'tft' : undefined} data-result={result === 'place' ? (place <= (tftMe!.partnerGroupId > 0 ? 2 : 4) ? 'win' : 'loss') : result}>
      <div class="rlc-pg-bg" style={bg ? { backgroundImage: bg } : undefined} />
      <div class="rlc-pg-scroll">
        <header class="rlc-pg-head">
          <div class="rlc-pg-hero">
            <h1 class="rlc-pg-result">{title}</h1>
            <div class="rlc-pg-who">
              {eog?.localPlayer ? icon(eog.localPlayer.championSquarePortraitPath || champ?.icon, 'rlc-pg-portrait', champ?.name) : legend ? icon(legend, 'rlc-pg-legend', tftMe?.companion.speciesName) : null}
              <div>
                <b>{eog?.localPlayer?.championName || champ?.name || (tft ? tftMe?.riotIdGameName : '') || ''}</b>
                {where.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>
            </div>
            {me && game ? (
              <dl class="rlc-pg-numbers">
                {METRICS.map(([label, f]) => {
                  const at = placeOf(game.participants, me, f);
                  return (
                    <div key={label}>
                      <dt>{t(label)}</dt>
                      <dd>{label === 'kda' ? kda(me) : n.format(f(me))}</dd>
                      {/* Só o pódio ganha marca; o resto da tabela fica quieto. */}
                      {at <= 3 && game.participants.length > 3 ? <small data-place={at}>{`${ordinal(at)} ${t('pgInGame')}`}</small> : null}
                    </div>
                  );
                })}
              </dl>
            ) : null}
            {game && !tft ? <Highlights game={game} me={me} icons={icons} /> : null}
          </div>
          <Progress eog={eog} lp={lp} mastery={mastery} queueId={queue?.id} puuid={eog?.localPlayer?.puuid} honors={tft ? [] : honorsFrom(lcu.honorRecognition.value.data ?? [], game, me, icons)} />
        </header>
        {tft && tftStats ? <TftBoard lcu={lcu} stats={tftStats} me={tftMe} lp={lp} menuFor={menuForPuuid} /> : null}
        {game && !tft ? (
          <div class="rlc-pg-detail">
            <nav class="rlc-tabs-text">
              {(
                [
                  ['board', 'mdBoard'],
                  ['charts', 'mdCharts'],
                ] as Array<[Tab, TextKey]>
              ).map(([k, label]) => (
                <button type="button" key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
                  {t(label)}
                </button>
              ))}
            </nav>
            {tab === 'board' ? (
              <div class="rlc-pg-board">
                <Board game={game} me={me} icons={icons} menuFor={menuFor} lcu={lcu} />
              </div>
            ) : (
              <div class="rlc-md-charts">
                {timeline?.frames?.length ? <GoldChart game={game} timeline={timeline} /> : null}
                <DamageBars game={game} me={me} icons={icons} />
              </div>
            )}
          </div>
        ) : null}
      </div>
      {reporting && eog?.gameId ? (
        <ReportDialog
          gameId={eog.gameId}
          target={reporting}
          game={tft ? 'tft' : 'lol'}
          onSent={() => {
            markReported(reporting.puuid);
            setReporting(null);
          }}
          onClose={() => setReporting(null)}
        />
      ) : null}
      <div class="rlc-pg-actions">
        <button type="button" class="rlc-button" data-variant="danger" disabled={leave.pending} onClick={() => leave.run()}>
          {t('leave')}
        </button>
        {/* Replay da partida (LoL; TFT não tem), ao lado de Sair. */}
        {!tft && eog?.gameId ? <ReplayButton game={{ gameId: eog.gameId, queueId: queue?.id ?? 0, gameType: eog.gameType || 'MATCHED_GAME' }} where="end-of-game" /> : null}
        <button type="button" class="rlc-button" data-variant="primary" disabled={again.pending} onClick={() => again.run()}>
          {t('playAgain')}
        </button>
      </div>
    </section>
  );
}

/** Marcas discretas: melhor da partida (maior KDA do time vencedor) e os maiores dano, ouro e visão. */
function Highlights({ game, me, icons }: { game: Game; me: Participant | undefined; icons: Icons }) {
  const all = game.participants;
  if (all.length < 2) return null;
  const top = (list: Participant[], f: (p: Participant) => number) => list.reduce((a, b) => (f(b) > f(a) ? b : a));
  const winners = all.filter((p) => p.stats.win);
  const marks: Array<[TextKey, Participant]> = [
    ['pgMvp', top(winners.length ? winners : all, ratio)],
    ['pgTopDamage', top(all, (p) => num(p, 'totalDamageDealtToChampions'))],
    ['pgTopGold', top(all, (p) => num(p, 'goldEarned'))],
    ['pgTopVision', top(all, (p) => num(p, 'visionScore'))],
  ];
  return (
    <ul class="rlc-pg-marks">
      {marks.map(([label, p]) => {
        const ch = icons.champions.get(p.championId);
        return (
          <li key={label} data-me={p === me ? 'true' : undefined} data-team={p.teamId}>
            {icon(ch?.icon, 'rlc-md-mini', ch?.name)}
            <span>
              <small>{t(label)}</small>
              {playerName(game, p.participantId)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Coluna de progresso: nível da conta com a XP ganha, PDL ganho/perdido com o elo, maestria do campeão. */
interface HonorFrom {
  key: string;
  name: string;
  icon?: string;
  enemy: boolean;
}

/** Quem te honrou: nome e campeão de cada um pela partida; sem remetente (a Riot esconde em alguns casos), anônimo. */
export function honorsFrom(list: Array<{ senderPuuid?: string }>, game: Game | null, me: Participant | undefined, icons: Icons): HonorFrom[] {
  return list.map((h, i) => {
    const id = game?.participantIdentities.find((x) => !!h.senderPuuid && x.player.puuid === h.senderPuuid)?.participantId;
    const p = game?.participants.find((x) => x.participantId === id);
    const ch = p ? icons.champions.get(p.championId) : undefined;
    return { key: `${h.senderPuuid ?? ''}${i}`, name: game && id ? playerName(game, id) : t('pgHonorAnon'), icon: ch?.icon, enemy: !!p && !!me && p.teamId !== me.teamId };
  });
}

function Progress({ eog, lp, mastery, queueId, puuid, honors }: { eog: LolEndOfGameEndOfGameStats | null; lp: LpChange | null; mastery: MasteryUpdate | null; queueId?: number; puuid?: string; honors: HonorFrom[] }) {
  const n = new Intl.NumberFormat(locale(), { signDisplay: 'exceptZero' });
  const plain = new Intl.NumberFormat(locale());
  const pct = (a: number, b: number) => `${Math.min(100, Math.max(0, (a / Math.max(1, b)) * 100))}%`;
  const delta = lp?.leaguePointsDelta ?? 0;
  const tier = tierLabel(lp?.tier, lp?.division);
  const gained = mastery?.pointsGained ?? mastery?.championPointsGained ?? 0;
  const before = mastery?.pointsSinceLastLevelBeforeGame ?? 0;
  const rows = [
    eog?.currentLevel ? (
      <li key="xp">
        <small>{t('pgAccount')}</small>
        <b>{`${t('level')} ${eog.currentLevel}`}</b>
        <span class="rlc-pg-delta">{`+${plain.format(eog.experienceEarned ?? 0)} XP`}</span>
        <span class="rlc-pg-meter">
          <i style={{ width: pct(eog.experienceTotal ?? 0, eog.nextLevelXp ?? 0) }} />
        </span>
        {eog.leveledUp ? <em>{t('pgLevelUp')}</em> : eog.missionsXpEarned ? <em>{`${plain.format(eog.missionsXpEarned)} ${t('pgMissionsXp')}`}</em> : null}
      </li>
    ) : null,
    tier ? (
      <li key="lp">
        <small>{t('pgRanked')}</small>
        <b class="rlc-rank">
          <img src={`/fe/lol-static-assets/images/ranked-mini-crests/${lp!.tier!.toLowerCase()}.svg`} alt="" />
          {`${tier} ${lp!.leaguePoints ?? 0} ${t('lp')}`}
        </b>
        <span class="rlc-pg-delta" data-sign={delta < 0 ? 'down' : 'up'}>{`${n.format(delta)} ${t('lp')}`}</span>
        <span class="rlc-pg-meter">
          <i style={{ width: pct(lp!.leaguePoints ?? 0, 100) }} />
        </span>
      </li>
    ) : rankedQueueOf(queueId) ? (
      // Sem aviso de mudança ainda: o elo atual do jogador.
      <li key="lp">
        <small>{t('pgRanked')}</small>
        <Rank puuid={puuid} queue={rankedQueueOf(queueId)} />
      </li>
    ) : null,
    mastery?.level ? (
      <li key="mastery">
        <small>{t('pgMastery')}</small>
        <b>{`${t('level')} ${mastery.level}${mastery.grade ? ` · ${mastery.grade}` : ''}`}</b>
        <span class="rlc-pg-delta">{`+${plain.format(gained)} ${t('pgPoints')}`}</span>
        {mastery.hasLeveledUp ? (
          <em>{t('pgLevelUp')}</em>
        ) : (
          <span class="rlc-pg-meter">
            <i style={{ width: pct(before + gained, before + gained + (mastery.pointsUntilNextLevelAfterGame ?? 0)) }} />
          </span>
        )}
      </li>
    ) : null,
    honors.length ? (
      <li key="honor" class="rlc-pg-honors">
        <small>{t('pgHonoredBy').replace('{n}', String(honors.length))}</small>
        <ul>
          {honors.map((h) => (
            <li key={h.key} data-team={h.enemy ? 'enemy' : 'ally'}>
              {icon(h.icon, 'rlc-md-mini', h.name)}
              <span>{h.name}</span>
              {h.enemy ? <em>{t('pgHonorEnemy')}</em> : null}
            </li>
          ))}
        </ul>
      </li>
    ) : null,
  ].filter(Boolean);
  return rows.length ? <ol class="rlc-pg-progress">{rows}</ol> : null;
}

type EogPlayer = LolEndOfGameTFTEndOfGameViewModel['players'][number];
type TftTab = 'standings' | 'match' | 'history';
const TFT_TABS: Array<[TftTab, TextKey]> = [
  ['standings', 'pgStandings'],
  ['match', 'pgTftMatch'],
  ['history', 'pgTftVsHistory'],
];

/** Histórico de TFT com a partida atual; ela entra no histórico um tempo depois do fim: tenta de novo a cada 10 s por até 2 min. */
function useTftHistory(puuid: string | undefined, gameId: number) {
  const [state, setState] = useState<{ matches: TftMatch[] | null; waiting: boolean }>({ matches: null, waiting: true });
  useEffect(() => {
    if (!puuid) return;
    let live = true;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () =>
      void getJson<Parameters<typeof tftMatches>[0]>(tftUrl(puuid)).then((r) => {
        if (!live) return;
        const matches = tftMatches(r);
        const again = !matches.some((x) => x.gameId === gameId) && tries++ < 12;
        setState({ matches, waiting: again });
        if (again) timer = setTimeout(load, 10_000);
      });
    load();
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [puuid, gameId]);
  return state;
}

/**
 * TFT: sua composição final em destaque (estrelas, borda de custo, itens) com os traços ativos em emblemas, e embaixo
 * três abas: a classificação dos oito (com os fatos do lobby em cima), a partida (traços, quem caiu quando) e você
 * contra o seu histórico.
 */
function TftBoard({ lcu, stats, me, lp, menuFor }: { lcu: Lcu; stats: LolEndOfGameTFTEndOfGameViewModel; me: EogPlayer | undefined; lp: LpChange | null; menuFor?: (puuid: string | undefined) => ComponentChildren }) {
  const catalog = useTftArt(lcu);
  const [tab, setTab] = useState<TftTab>('standings');
  const players = stats.players ?? [];
  const gameId = stats.gameId ?? 0;
  const hist = useTftHistory(me?.puuid, gameId);
  // Unidades e itens vêm com arte no próprio fim de jogo; o catálogo cobre os do histórico que não estão em tabuleiro nenhum.
  const own = eogArt(players);
  const a: Art = { ...catalog, units: new Map([...catalog.units, ...own.units]), items: new Map([...catalog.items, ...own.items]) };
  const m: TftMatch = { gameId, gameCreation: 0, participants: players.map((p) => fromEog(p, a.traits)) };
  const mine = m.participants.find((p) => !!me && p.puuid === me.puuid);
  const played = hist.matches?.find((x) => x.gameId === gameId);
  const pieces = me?.boardPieces ?? [];
  const traits = mine ? activeTraits(mine) : [];
  return (
    <div class="rlc-pg-tft">
      {pieces.length ? (
        <section>
          <h2>{t('pgFinalBoard')}</h2>
          <ul class="rlc-pg-units">
            {pieces.map((p, i) => (
              <li key={i} data-cost={p.price} title={p.name}>
                <span class="rlc-pg-stars" aria-label={`${p.level}★`}>
                  {'★'.repeat(Math.max(1, p.level))}
                </span>
                {icon(p.icon, 'rlc-pg-unit', p.name)}
                <span class="rlc-pg-unititems">
                  {(p.items ?? []).map((it, k) => (
                    <img key={k} src={it.icon} alt={it.name} title={it.name} />
                  ))}
                </span>
              </li>
            ))}
          </ul>
          {traits.length ? (
            <div class="rlc-pg-traits">
              {traits.map((tr) => (
                <Trait key={tr.name} tr={tr} a={a} named />
              ))}
            </div>
          ) : null}
          {mine?.augs?.length ? (
            <div class="rlc-pg-augs">
              <small>{t('pgAugments')}</small>
              {mine.augs.map((x, k) => (
                <span key={k}>
                  <img src={x.icon} alt="" />
                  {x.name}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      {m.participants.length ? (
        <section class="rlc-pg-standings">
          <nav class="rlc-tabs-text">
            {TFT_TABS.map(([k, label]) => (
              <button type="button" key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
                {t(label)}
              </button>
            ))}
          </nav>
          {tab === 'standings' ? (
            <>
              <LobbyFacts players={players} me={me} a={a} />
              <TftStandings m={m} me={mine} a={a} />
            </>
          ) : tab === 'match' ? (
            <TftMatchTab m={m} mine={mine} played={played} waiting={hist.waiting} a={a} menuFor={menuFor} />
          ) : (
            <TftVsHistory m={played ?? m} mine={(mine && played && meIn(played, mine.puuid ?? '')) || mine} matches={hist.matches} gameId={gameId} queueId={stats.queueId} lp={lp} a={a} />
          )}
        </section>
      ) : null}
    </div>
  );
}

const nameOf = (p: { riotIdGameName?: string; summonerName?: string } | undefined) => p?.riotIdGameName || p?.summonerName || '—';

/** Fatos do lobby: tabuleiro mais caro, mais itens, o valor do seu e as suas unidades que outros também tinham. */
function LobbyFacts({ players, me, a }: { players: EogPlayer[]; me: EogPlayer | undefined; a: Art }) {
  if (players.length < 2) return null;
  const rich = topBy(players, (p) => boardValue(p.boardPieces))!;
  const geared = topBy(players, (p) => itemCount(p.boardPieces))!;
  const mineAt = me ? players.filter((p) => boardValue(p.boardPieces) > boardValue(me.boardPieces)).length + 1 : 0;
  const shared = me ? contested(me, players) : [];
  return (
    <div class="rlc-pg-lobby">
      <dl class="rlc-pg-facts">
        <div data-me={rich === me ? 'true' : undefined}>
          <dt>{t('pgTftRichest')}</dt>
          <dd>{nameOf(rich)}</dd>
          <small>{`${boardValue(rich.boardPieces)} ${t('pgTftGold')}`}</small>
        </div>
        <div data-me={geared === me ? 'true' : undefined}>
          <dt>{t('pgTftMostItems')}</dt>
          <dd>{nameOf(geared)}</dd>
          <small>{`${itemCount(geared.boardPieces)} ${t('pgTftItems')}`}</small>
        </div>
        {me ? (
          <div>
            <dt>{t('pgTftYourBoard')}</dt>
            <dd>{`${boardValue(me.boardPieces)} ${t('pgTftGold')}`}</dd>
            <small>{t('pgTftBoardRank').replace('{n}', ordinal(mineAt))}</small>
          </div>
        ) : null}
      </dl>
      {shared.length ? (
        <div class="rlc-pg-contested">
          <small>{t('pgTftContested')}</small>
          <ul>
            {shared.map((x) => {
              const u = art(a.units, x.id);
              return (
                <li key={x.id} title={u.name}>
                  {pic(u, 'rlc-pg-cunit')}
                  <span>
                    <b>{u.name}</b>
                    <small>{t('pgTftContestedBy').replace('{p}', String(x.players)).replace('{c}', String(x.copies))}</small>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** A partida: dupla, progresso de cada traço e a linha do tempo de quem caiu (do histórico, que chega depois). */
function TftMatchTab({ m, mine, played, waiting, a, menuFor }: { m: TftMatch; mine: TftPlayer | undefined; played: TftMatch | undefined; waiting: boolean; a: Art; menuFor?: (puuid: string | undefined) => ComponentChildren }) {
  const hp = played?.participants ?? [];
  const meH = mine?.puuid ? hp.find((p) => p.puuid === mine.puuid) : undefined;
  const traits = [...((meH ?? mine)?.traits ?? [])].filter((x) => x.num_units > 0).sort((x, y) => y.style - x.style || y.num_units - x.num_units);
  const partner = mine && pairs(m) ? m.participants.find((p) => p !== mine && p.partner_group_id === mine.partner_group_id) : undefined;
  const dmg = hasAny(hp, (p) => p.total_damage_to_players);
  const kos = hasAny(hp, (p) => p.players_eliminated);
  return (
    <div class="rlc-pg-match">
      {partner ? (
        <p class="rlc-pg-partner">
          <small>{t('pgTftPartner')}</small>
          <b>{partner.riotIdGameName || '—'}</b>
        </p>
      ) : null}
      {traits.length ? (
        <section>
          <h3>{t('pgTftTraitProgress')}</h3>
          <ul class="rlc-pg-tprog">
            {traits.map((tr) => {
              const x = art(a.traits, tr.name);
              const g = traitProgress(tr, x.tiers);
              const known = !!x.tiers?.length;
              return (
                <li key={tr.name} data-style={Math.min(4, tr.style)}>
                  {pic(x, 'rlc-pg-ticon')}
                  <span>{x.name}</span>
                  <b>{known && g.next ? `${g.have}/${g.next}` : g.have}</b>
                  {known ? <small>{g.next ? t('pgTftMissing').replace('{n}', String(g.missing)) : t('pgTftMaxed')}</small> : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <section>
        <h3>{t('pgTftTimeline')}</h3>
        {played ? (
          <table class="rlc-pg-elim">
            <thead>
              <tr>
                <th>{t('pgTftFell')}</th>
                <th>{t('pgTftPlayer')}</th>
                <th>{t('pgTftLevel')}</th>
                <th>{t('pgTftGoldLeft')}</th>
                <th title={t('pgTftScoreHint')}>{t('pgTftScore')}</th>
                {dmg ? <th>{t('pgTftDamage')}</th> : null}
                {kos ? <th>{t('pgTftKos')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {eliminationOrder(hp).map((p, i) => (
                <tr key={p.puuid ?? i} data-me={p.puuid === mine?.puuid ? 'true' : undefined} data-band={band(played, p)}>
                  <td>
                    {p.placement === 1 ? (
                      t('pgTftSurvived')
                    ) : (
                      <>
                        {roundLabel(p.last_round)}
                        {p.time_eliminated ? <small>{formatClock(p.time_eliminated)}</small> : null}
                      </>
                    )}
                  </td>
                  <td class="rlc-pg-elim-name">
                    <b class="rlc-tft-place">{ordinal(tftPlace(played, p))}</b>
                    {p.riotIdGameName || '—'}
                    {menuFor?.(p.puuid)}
                  </td>
                  <td>{p.level ?? '—'}</td>
                  <td>{p.gold_left ?? '—'}</td>
                  <td>{p.missions?.PlayerScore2 ?? '—'}</td>
                  {dmg ? <td>{p.total_damage_to_players ?? 0}</td> : null}
                  {kos ? <td>{p.players_eliminated ?? 0}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          waiting ? <Loader small label={t('pgTftLoading')} /> : <p class="rlc-muted rlc-pg-wait">{t('pgTftNoDetails')}</p>
        )}
      </section>
    </div>
  );
}

/** Você contra suas últimas partidas da mesma fila: colocação vs média, sequência de top 4, comp repetida, PdL, mais usados. */
function TftVsHistory(props: { m: TftMatch; mine: TftPlayer | undefined; matches: TftMatch[] | null; gameId: number; queueId?: number; lp: LpChange | null; a: Art }) {
  const { m, mine, matches, gameId, queueId, lp, a } = props;
  if (!matches) return <Loader small label={t('pgTftLoading')} />;
  if (!mine) return null;
  const puuid = mine.puuid ?? '';
  const others = matches.filter((x) => x.gameId !== gameId && (!queueId || queueOf(x) === queueId));
  const s = summarize(others, puuid);
  if (!s.games) return <p class="rlc-muted rlc-pg-wait">{t('pgTftNoHistory')}</p>;
  const place = mine.placement;
  const recent = [m, ...others].map((x) => ({ x, p: meIn(x, puuid) })).filter((r): r is { x: TftMatch; p: TftPlayer } => !!r.p);
  const streak = top4Streak(recent.map((r) => r.p.placement));
  const key = compKey(mine);
  const comp = key ? compHistory(others, puuid, key) : null;
  const units = topUsed(others, puuid, (p) => (p.units ?? []).map((u) => u.character_id));
  const items = topUsed(others, puuid, (p) => (p.units ?? []).flatMap((u) => u.itemNames ?? []));
  const hereU = new Set((mine.units ?? []).map((u) => u.character_id));
  const hereI = new Set((mine.units ?? []).flatMap((u) => u.itemNames ?? []));
  const next = lp ? toNextDivision(lp.tier, lp.division, lp.leaguePoints ?? 0, lp.leaguePointsDelta ?? 0) : null;
  const dec = new Intl.NumberFormat(locale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const avgText = (g: { games: number; avg: number }) => t('pgTftTimesAvg').replace('{n}', String(g.games)).replace('{avg}', dec.format(g.avg));
  const used = (title: TextKey, list: Array<[string, number]>, map: Map<string, TftArt>, here: Set<string>) =>
    list.length ? (
      <section>
        <h3>{t(title)}</h3>
        <ul class="rlc-pg-used">
          {list.map(([id, n]) => {
            const x = art(map, id);
            return (
              <li key={id} data-here={here.has(id) ? 'true' : undefined} title={x.name}>
                {pic(x, 'rlc-pg-uicon')}
                <span>{x.name}</span>
                <small>{`${n}×`}</small>
              </li>
            );
          })}
        </ul>
      </section>
    ) : null;
  return (
    <div class="rlc-pg-vs">
      <dl class="rlc-pg-facts">
        <div>
          <dt>{t('pgTftThisGame')}</dt>
          <dd>{ordinal(tftPlace(m, mine))}</dd>
          <small data-sign={place < s.avg ? 'up' : place > s.avg ? 'down' : undefined}>{t(place < s.avg ? 'pgTftAboveAvg' : place > s.avg ? 'pgTftBelowAvg' : 'pgTftAtAvg')}</small>
        </div>
        <div>
          <dt>{t('pgTftYourAvg')}</dt>
          <dd>{dec.format(s.avg)}</dd>
          <small>{`${t('profLast')} ${s.games}`}</small>
        </div>
        <div>
          <dt>{t('pgTftStreak')}</dt>
          <dd>{streak}</dd>
          <small>{t('pgTftStreakHint')}</small>
        </div>
        {next ? (
          <div>
            <dt>{t('pgTftUntil').replace('{tier}', tierLabel(next.tier, next.division))}</dt>
            <dd>{`${next.need} ${t('lp')}`}</dd>
            <small>{next.games ? t('pgTftGamesLike').replace('{n}', String(next.games)) : t('pgTftPerDivision')}</small>
          </div>
        ) : null}
      </dl>
      <section>
        <h3>{t('pgTftRecent')}</h3>
        <ol class="rlc-tft-strip" aria-label={t('pgTftRecent')}>
          {recent.map(({ x, p }) => (
            <li key={x.gameId} data-band={band(x, p)} data-now={x === m ? 'true' : undefined}>
              {tftPlace(x, p)}
            </li>
          ))}
        </ol>
      </section>
      {key && comp ? (
        <section class="rlc-pg-comp">
          <h3>{t('pgTftYourComp')}</h3>
          <p>
            <span class="rlc-pg-compname">
              {key.map((k) => {
                const x = art(a.traits, k);
                return (
                  <span key={k}>
                    {pic(x, 'rlc-pg-ticon')}
                    {x.name}
                  </span>
                );
              })}
            </span>
            <span>{comp.same.games ? `${t('pgTftSameComp')}: ${avgText(comp.same)}` : t('pgTftNewComp')}</span>
            {comp.traits.games > comp.same.games ? <span>{`${t('pgTftSameTraits')}: ${avgText(comp.traits)}`}</span> : null}
          </p>
        </section>
      ) : null}
      <div class="rlc-pg-usedcols">
        {used('pfTftTopUnits', units, a.units, hereU)}
        {used('pgTftTopItems', items, a.items, hereI)}
      </div>
      {units.length || items.length ? <small class="rlc-muted">{t('pgTftHereHint')}</small> : null}
    </div>
  );
}
