import type { ComponentChildren } from 'preact';
import { PlayerMenu, ReportDialog, useReported, type EogTarget } from './Report';
import { ReplayButton } from '../profile/ReplayButton';
import { useEffect, useState } from 'preact/hooks';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolEndOfGameEndOfGameStats } from '../../lcu/types';
import { crestUrl, Rank, rankedQueueOf } from '../../ui/Rank';
import { useAction } from '../../ui/useAction';
import { formatClock } from '../lobby/format';
import { getJson, kda, mine, num, ordinal, playerName, tierLabel, type Game, type Participant, type Timeline } from '../profile/data';
import { Board, icon, useFetched, useIcons, type Icons } from '../profile/Profile';
import { MatchCharts } from '../profile/MatchCharts';
import { Loader } from '../../ui/Loader';

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
 * progresso (conta, PDL, maestria) ao lado e o placar do perfil embaixo.
 */
export function PostGame({ lcu }: { lcu: Lcu }) {
  const eog = lcu.endOfGame.value.data;
  const queue = lcu.gameflowSession.value.data?.gameData?.queue;
  const gameId = eog?.gameId || lcu.gameflowSession.value.data?.gameData?.gameId || 0;
  // Lidos uma vez por partida; 204/404 viram null e a parte some.
  const lastLp = useFetched<LpChange>(gameId ? '/lol-ranked/v1/current-lp-change-notification' : null);
  // O aviso fica até a próxima ranqueada: de outra partida, não vale.
  const lp = lastLp && (!lastLp.gameId || lastLp.gameId === gameId) ? lastLp : null;
  const mastery = useFetched<MasteryUpdate>(gameId ? '/lol-end-of-game/v1/champion-mastery-updates' : null);
  // O histórico traz a partida completa (e a linha do tempo) alguns segundos depois; até lá vale o bloco do fim de jogo.
  const history = useFetched<Game>(gameId ? `/lol-match-history/v1/games/${gameId}` : null);
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
  const result = myTeam ? (myTeam.isWinningTeam ? 'win' : 'loss') : undefined;
  const title = result === 'win' ? t('victory') : result === 'loss' ? t('defeat') : '—';
  const champ = icons.champions.get(eog?.localPlayer?.championId ?? 0);
  const length = eog?.gameLength;
  const bg = eog?.localPlayer?.skinSplashPath ? `url("${eog.localPlayer.skinSplashPath}")` : '';
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
  ]);
  const menuForPuuid = (puuid: string | undefined) => {
    const target = puuid ? targets.get(puuid) : undefined;
    return target ? <PlayerMenu lcu={lcu} target={target} invite="endOfGame" onReport={reported.has(target.puuid) ? undefined : () => setReporting(target)} /> : null;
  };
  const menuFor = (p: Participant) => menuForPuuid(game?.participantIdentities.find((x) => x.participantId === p.participantId)?.player.puuid);
  if (lcu.endOfGame.value.status === 'loading' && !gaveUp) return <section class="rlc-ingame"><Loader label={t('gameWaitingStats')} /></section>;

  return (
    <section class="rlc-postgame" data-result={result}>
      <div class="rlc-pg-bg" style={bg ? { backgroundImage: bg } : undefined} />
      <div class="rlc-pg-scroll">
        <header class="rlc-pg-head">
          <div class="rlc-pg-hero">
            <h1 class="rlc-pg-result">{title}</h1>
            <div class="rlc-pg-who">
              {eog?.localPlayer ? icon(eog.localPlayer.championSquarePortraitPath || champ?.icon, 'rlc-pg-portrait', champ?.name) : null}
              <div>
                <b>{eog?.localPlayer?.championName || champ?.name || ''}</b>
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
            {game ? <Highlights game={game} me={me} icons={icons} /> : null}
          </div>
          <Progress eog={eog} lp={lp} mastery={mastery} queueId={queue?.id} puuid={eog?.localPlayer?.puuid} honors={honorsFrom(lcu.honorRecognition.value.data ?? [], game, me, icons)} />
        </header>
        {game ? (
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
              <MatchCharts game={game} timeline={timeline} me={me} icons={icons} />
            )}
          </div>
        ) : null}
      </div>
      {reporting && eog?.gameId ? (
        <ReportDialog
          gameId={eog.gameId}
          target={reporting}
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
        {/* Replay da partida, ao lado de Sair. */}
        {eog?.gameId ? <ReplayButton game={{ gameId: eog.gameId, queueId: queue?.id ?? 0, gameType: eog.gameType || 'MATCHED_GAME' }} where="end-of-game" /> : null}
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
          <img src={crestUrl(lp!.tier!)} alt="" />
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
