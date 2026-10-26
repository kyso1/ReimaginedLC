import { useEffect, useMemo, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import { Crossfade } from '../../ui/Crossfade';
import { useAction } from '../../ui/useAction';
import { useDecoded } from '../../ui/useDecoded';
import { ChampionGrid, Drawer, LANES, type Lane } from './Drawer';
import { Loadout, SkinCarousel, skinOf } from './Loadout';
import { RuneEditor, useApplyOnLock, type RecoContext } from './RuneEditor';
import { Bench, SubsetCards, SwapCards, swapMenu } from './Swaps';
import { actingCells, allyWants, bansByTeam, displayedChampion, laneOpponent, myTurn, remainingSeconds, selectPhase, unavailable, type SelectPhase, type Session } from './logic';
import { useRealNames } from './names';
import { ArenaTeams, Team } from './Teams';
import { MapSide, useMapArt } from './MapSide';
import { rankedQueueOf } from '../../ui/Rank';
import { useEscape } from '../../ui/useEscape';
import { prefs } from '../../shell/prefs';
import { roseStatus, useRose } from '../../plugins/rose';
import { dodge } from '../../plugins/dodge';
import { Confirm } from '../../shell/overlays/Confirm';

const PHASE_TEXT: Record<SelectPhase, TextKey | null> = {
  ban: 'phaseBan',
  pick: 'phasePick',
  waiting: 'phaseWaiting',
  finalization: 'phaseFinal',
  planning: 'phasePlanning',
  none: null,
};

/**
 * Seleção de campeões em palco: a splash do seu campeão ocupa a tela (o mouse na grade troca a prévia), com fase,
 * tempo, nome e skin no topo e o carrossel de skins embaixo. Aliados em cartões à esquerda, inimigos espelhados à
 * direita. A grade cobre o palco enquanto se escolhe e some no ✕, no Esc ou ao travar. Feitiços, runas, sentinela,
 * skin e Travar ficam na barra de vidro do pé.
 */
export function ChampSelect({ lcu }: { lcu: Lcu }) {
  const session = lcu.champSelect.value.data;
  const champions = useLoaded(lcu.game.champions, EMPTY);
  const spells = useLoaded(lcu.game.spells, EMPTY);
  // Grade fechada mostra o palco (o mapa do lado do time até eu escolher); abre sozinha na minha vez e fecha ao travar.
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Campeão sob o mouse na grade: só a prévia do palco, nada é enviado.
  const [preview, setPreview] = useState<number | null>(null);
  const real = useRealNames(session, prefs.value.nameReveal);
  const seconds = useSelectClock(session);
  const local = session?.myTeam.find((c) => c.cellId === session.localPlayerCellId) ?? null;
  const shown = local ? displayedChampion(local) : null;
  const turn = session ? myTurn(session) : null;
  const locked = shown?.locked === true;
  // ARAM não tem grade: o campeão vem dos cartões (ARAM atual), do banco ou da rolagem (ARAM antigo).
  const cards = session?.allowSubsetChampionPicks === true;
  const gridless = !!session && (cards || session.benchEnabled || session.allowRerolling);
  const cardTurn = cards && turn?.kind === 'pick';
  const subset = lcu.subset.value.data ?? [];
  useEffect(() => {
    if (cards) void lcu.subset.refresh();
  }, [cards, session?.id]);
  // A grade segue o momento: abre na minha vez, fecha ao travar. Abrir ou fechar à mão vale até a próxima mudança.
  useEffect(() => {
    if (turn) setDrawerOpen(true);
    else if (locked) setDrawerOpen(false);
  }, [turn?.action.id, locked]);
  const gridOpen = drawerOpen && !gridless;
  const previewing = (gridOpen || cardTurn) && preview ? preview : 0;
  // ROSE conectado: o carrossel oferece também skins não possuídas. A escolhida (`pick`) só vai para o palco e para o
  // ROSE; a LCU não sabe dela. Zera ao trocar de campeão.
  useRose(prefs.value.rose);
  const rose = prefs.value.rose && roseStatus.value === 'connected';
  const [rosePick, setRosePick] = useState<number | null>(null);
  useEffect(() => setRosePick(null), [shown?.championId]);
  const pick = rose ? rosePick : null;
  const stageSkin = previewing ? previewing * 1000 : shown ? (shown.locked && (pick ?? local!.selectedSkinId) > 0 ? (pick ?? local!.selectedSkinId) : shown.championId * 1000) : undefined;
  const splashUrl = useLoaded(() => lcu.game.splash(stageSkin), null, [stageSkin]);
  const splash = useDecoded(splashUrl);
  const flow = lcu.gameflowSession.value.data;
  const mapArt = useMapArt(flow?.map?.id, flow?.gameData?.queue?.gameMode);

  const hover = useAction((id: number, championId: number) => request('PATCH', `/lol-champ-select/v1/session/actions/${id}`, { championId }));
  const commit = useAction((id: number, championId: number) => request('PATCH', `/lol-champ-select/v1/session/actions/${id}`, { championId, completed: true }));
  // `all-grid-champions` não se atualiza depois da troca; o valor confirmado vem de `grid-champions/{id}`.
  const [favOverrides, setFavOverrides] = useState<Map<number, string[]>>(new Map());
  const favorite = useAction(async (id: number, lane: Lane) => {
    await request('POST', `/lol-champ-select/v1/toggle-favorite/${id}/${lane.toLowerCase()}`);
    const fresh = await request<{ positionsFavorited?: string[] }>('GET', `/lol-champ-select/v1/grid-champions/${id}`);
    setFavOverrides((prev) => new Map(prev).set(id, fresh?.positionsFavorited ?? []));
  });
  const quit = useAction(() => request('POST', '/lol-lobby-team-builder/champ-select/v1/session/quit'));
  const leave = useAction(dodge);
  const [dodging, setDodging] = useState(false);

  // Editor de runas por cima do centro e da direita; recomendações para o campeão em destaque.
  const [runesOpen, setRunesOpen] = useState(false);
  // Com o editor de runas aberto, o Escape é dele.
  useEscape(() => !runesOpen && setDrawerOpen(false));
  const lanes = lcu.lanes.value.data ?? {};
  const position = local ? local.assignedPosition || (lanes[String(shown?.championId ?? 0)]?.recommendedPositions?.[0] ?? '') : '';
  const gameMode = lcu.gameflowSession.value.data?.gameData?.queue?.gameMode ?? null;
  // Arena não tem runas: nada de recomendação nem de aplicar ao travar.
  const reco: RecoContext | null =
    session && local && gameMode !== 'CHERRY'
      ? {
          championId: shown?.championId ?? 0,
          position,
          enemies: session.theirTeam.map((c) => (c.championId > 0 ? c.championId : 0)),
          laneEnemy: laneOpponent(session.theirTeam, position, lanes),
          champions,
          spells,
          me: local,
        }
      : null;
  useApplyOnLock(lcu, reco, locked, session?.id ?? '');

  if (!session) return <section class="rlc-champselect" />;

  const phase = selectPhase(session);
  const allowed = (turn?.kind === 'ban' ? lcu.bannable.value.data : lcu.pickable.value.data) ?? [];
  const bans = bansByTeam(session);
  const active = actingCells(session);
  // Banidos e escolhidos por outro ficam na grade, cinza e sem clique (a LCU pode mandá-los ainda como disponíveis).
  const blocked = unavailable(session);
  const highlighted = turn && allowed.includes(turn.action.championId) && !blocked.has(turn.action.championId) ? turn.action.championId : 0;
  const wants = allyWants(session);
  // Fora da vez de banir os indisponíveis só entram se forem meus (a grade é das minhas escolhas).
  const owned = new Set((lcu.gridChampions.value.data ?? []).filter((c) => c.owned || c.rented || c.freeToPlayForQueue).map((c) => c.id));
  const gridIds = [...new Set([...(turn ? allowed : (lcu.pickable.value.data ?? [])), ...[...blocked.keys()].filter((id) => turn?.kind === 'ban' || !owned.size || owned.has(id))])];
  const banWarn = turn?.kind === 'ban' && highlighted > 0 && wants.has(highlighted);
  const phaseKey = PHASE_TEXT[phase];
  const total = Math.max(1, Math.round((session.timer?.totalTimeInPhase ?? 0) / 1000));

  const assigned = (local?.assignedPosition ?? '').toUpperCase();
  const favorites = new Map((lcu.gridChampions.value.data ?? []).map((c) => [c.id, c.positionsFavorited ?? []]));
  for (const [id, lanes] of favOverrides) favorites.set(id, lanes);
  const quitButton = (session as Session & { showQuitButton?: boolean }).showQuitButton ? (
    <button type="button" class="rlc-button" data-variant="danger" disabled={quit.pending} onClick={() => quit.run()}>
      {t('quitSelect')}
    </button>
  ) : null;

  // Plugin de dodge: sai da seleção sem fechar o client, depois de confirmar. Some quando a partida já vai começar.
  const dodgeButton =
    prefs.value.dodge && session.timer?.phase !== 'GAME_STARTING' ? (
      <button type="button" class="rlc-button" data-variant="danger" disabled={leave.pending} onClick={() => setDodging(true)}>
        {t('csDodge')}
      </button>
    ) : null;

  // No planejamento só se declara a intenção, e nos cartões do ARAM o clique já escolhe: sem botão de travar.
  const mainAction =
    turn && turn.kind !== 'intent' && !cardTurn ? (
      <button type="button" class="rlc-button rlc-cs-lock" data-variant="primary" data-kind={turn.kind} disabled={!highlighted || commit.pending || hover.pending} onClick={() => commit.run(turn.action.id, highlighted)}>
        {turn.kind === 'ban' ? t('banAction') : t('csLock')}
      </button>
    ) : null;

  const stageId = previewing || shown?.championId || 0;
  const skins = lcu.skins.value.data ?? [];
  const chosen = locked && local ? skinOf(skins, pick ?? local.selectedSkinId) : undefined;
  const skin = previewing ? undefined : chosen;

  return (
    <section class="rlc-champselect" data-phase={phase} data-grid={gridOpen || cardTurn ? 'open' : undefined}>
      {stageSkin ? <Crossfade src={splash} class="rlc-cs-splash" position="center 15%" /> : mapArt && !gridOpen && !cardTurn ? <MapSide art={mapArt} cells={session.myTeam} champions={champions} /> : null}
      {/* Ponte para o ROSE-SkinMonitor, que lê o nome da skin no DOM (`.skin-name-text`) e fica com o último visível. */}
      {rose && chosen ? (
        <span class="skin-name-text rlc-rose-mirror" aria-hidden="true">
          {chosen.name}
        </span>
      ) : null}
      <span class="rlc-cs-timebar" aria-hidden="true">
        <i style={{ width: `${Math.min(100, (seconds / total) * 100)}%` }} />
      </span>
      <Team cells={session.myTeam} side="mine" bans={bans.mine} active={active} localCellId={session.localPlayerCellId} champions={champions} spells={spells} name={lcu.name} splash={lcu.game.splash} real={real.byCell} extra={real.extra} rankQueue={rankedQueueOf(lcu.gameflowSession.value.data?.gameData?.queue?.id) ?? 'RANKED_SOLO_5x5'} menuFor={(c) => (c.cellId === session.localPlayerCellId ? null : swapMenu(session, c))} />
      <div class="rlc-cs-center">
        <header class="rlc-cs-head">
          <p class="rlc-cs-clock">
            {phaseKey ? <span class="rlc-cs-phase">{t(phaseKey)}</span> : null}
            <span>
              <span class="rlc-cs-timer">{seconds}</span> s
            </span>
          </p>
          {stageId ? <h1 class="rlc-cs-champ-name">{champions.get(stageId)?.name ?? ''}</h1> : null}
          {skin && !skin.isBase ? <p class="rlc-cs-skin-name">{skin.name}</p> : null}
        </header>
        {cardTurn ? (
          <SubsetCards ids={subset} champions={champions} splash={lcu.game.splash} disabled={commit.pending} onHover={setPreview} onPick={(id) => commit.run(turn.action.id, id)} />
        ) : (
          <Bench session={session} champions={champions} subset={subset} />
        )}
        {cardTurn ? null : gridOpen ? (
          <Drawer onClose={() => setDrawerOpen(false)}>
            <ChampionGrid
              ids={gridIds}
              blocked={blocked}
              wanted={turn?.kind === 'ban' ? wants : undefined}
              champions={champions}
              selected={highlighted}
              lanes={lanes}
              favorites={favorites}
              initialLane={(LANES as readonly string[]).includes(assigned) ? (assigned as Lane) : null}
              onFavorite={(id, lane) => favorite.run(id, lane)}
              onHover={setPreview}
              onPick={(id) => {
                // Fora da minha vez a grade só mostra; nada é enviado.
                if (turn) hover.run(turn.action.id, id);
              }}
            />
          </Drawer>
        ) : (
          <>
            {gridless ? null : (
              <button type="button" class="rlc-button rlc-cs-reopen" data-variant="pill" onClick={() => setDrawerOpen(true)}>
                {t('csDrawerOpen')}
              </button>
            )}
            {local ? <SkinCarousel skins={skins} me={local} rose={rose} pick={pick} onPick={setRosePick} /> : null}
          </>
        )}
      </div>
      {gameMode === 'CHERRY' ? (
        <ArenaTeams cells={session.theirTeam} size={Math.max(1, session.myTeam.length)} champions={champions} bans={bans.theirs} />
      ) : (
        <Team cells={session.theirTeam} side="theirs" bans={bans.theirs} active={active} localCellId={-1} champions={champions} spells={spells} name={lcu.name} splash={lcu.game.splash} />
      )}
      <SwapCards session={session} />
      <footer class="rlc-cs-bar">
        {local ? (
          <Loadout
            me={local}
            spells={spells}
            gameMode={lcu.gameflowSession.value.data?.gameData?.queue?.gameMode ?? null}
            pageName={lcu.currentPerkPage.value.data?.name ?? null}
            onRunes={() => setRunesOpen(true)}
            summonerId={lcu.chatMe.value.data?.summonerId}
          />
        ) : null}
        {local && locked && skins.some((s) => s.unlocked) ? (
          <button type="button" class="rlc-button rlc-cs-skin-chip" data-variant="pill" aria-pressed={!gridOpen} onClick={() => setDrawerOpen(false)}>
            {t('tabSkins')}
            {skin ? <small>{skin.name}</small> : null}
          </button>
        ) : null}
        <div class="rlc-cs-action">
          {banWarn ? (
            <p class="rlc-cs-warn" role="alert">
              {t('csBanAllyWarn')}
            </p>
          ) : null}
          {quitButton}
          {dodgeButton}
          {mainAction}
        </div>
      </footer>
      {dodging ? (
        <Confirm
          message={t('csDodgeConfirm')}
          confirmLabel={t('csDodge')}
          onConfirm={() => {
            setDodging(false);
            leave.run();
          }}
          onCancel={() => setDodging(false)}
        />
      ) : null}
      {runesOpen ? <RuneEditor lcu={lcu} mode="overlay" reco={reco} artSkin={stageSkin ?? null} onClose={() => setRunesOpen(false)} /> : null}
    </section>
  );
}

const EMPTY = new Map<number, never>();

/** Valor de uma leitura assíncrona; `fallback` até chegar. */
function useLoaded<T>(load: () => Promise<T>, fallback: T, deps: unknown[] = [load]): T {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    let live = true;
    void load().then((v) => live && setValue(v)).catch(() => {});
    return () => void (live = false);
  }, deps);
  return value;
}

/**
 * Segundos restantes. `adjustedTimeLeftInPhase` vale no instante `internalNowInEpochMs` (relógio da LCU, mesma máquina),
 * e a LCU reenvia o mesmo objeto sem atualizar: a âncora é esse instante, não a hora em que a tela montou.
 * Sem o instante, ancora na primeira leitura daquele valor.
 */
function useSelectClock(session: Session | null): number {
  const timer = session?.timer;
  const left = timer?.adjustedTimeLeftInPhase ?? 0;
  const at = useMemo(() => ((timer?.internalNowInEpochMs ?? 0) > 0 ? timer!.internalNowInEpochMs : Date.now()), [left, timer?.phase, timer?.internalNowInEpochMs]);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!timer || timer.isInfinite) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [timer?.isInfinite, !!timer]);
  return remainingSeconds(left, at, Date.now());
}
