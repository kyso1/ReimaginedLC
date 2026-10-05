import { useEffect, useMemo, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import { useAction } from '../../ui/useAction';
import { useDecoded } from '../../ui/useDecoded';
import { ChampionGrid, Drawer, LANES, type Lane, type Tab } from './Drawer';
import { RunesSpellsTab, SkinsTab } from './Loadout';
import { Bench, SwapCards, swapMenu } from './Swaps';
import { bansByTeam, displayedChampion, flatActions, myTurn, remainingSeconds, selectPhase, type SelectPhase, type Session } from './logic';
import { Team } from './Teams';
import { prefs } from '../../shell/prefs';
import { extensions, useExtensionNames } from '../../extensions';

const PHASE_TEXT: Record<SelectPhase, TextKey | null> = {
  ban: 'phaseBan',
  pick: 'phasePick',
  waiting: 'phaseWaiting',
  finalization: 'phaseFinal',
  planning: 'phasePlanning',
  none: null,
};

/** Seleção de campeões no layout Cinemático: campeão em tela cheia, times no topo, gaveta com abas embaixo. */
export function ChampSelect({ lcu }: { lcu: Lcu }) {
  const session = lcu.champSelect.value.data;
  const champions = useLoaded(lcu.game.champions, EMPTY);
  const spells = useLoaded(lcu.game.spells, EMPTY);
  const [tab, setTab] = useState<Tab>('champions');
  const seconds = useSelectClock(session);
  const local = session?.myTeam.find((c) => c.cellId === session.localPlayerCellId) ?? null;
  const shown = local ? displayedChampion(local) : null;
  const turn = session ? myTurn(session) : null;
  const locked = shown?.locked === true;
  // A aba segue o momento: Campeões na minha vez, Skins depois de confirmar. Trocar à mão vale até a próxima mudança.
  useEffect(() => {
    if (turn) setTab('champions');
    else if (locked) setTab('skins');
  }, [turn?.action.id, locked]);
  const splashUrl = useLoaded(() => lcu.game.splash(shown ? (shown.locked && local!.selectedSkinId > 0 ? local!.selectedSkinId : shown.championId * 1000) : undefined), null, [shown?.championId, shown?.locked, local?.selectedSkinId]);
  const splash = useDecoded(splashUrl);

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
  const revealed = useExtensionNames(lcu);

  if (!session) return <section class="rlc-champselect" />;

  const phase = selectPhase(session);
  const allowed = (turn?.kind === 'ban' ? lcu.bannable.value.data : lcu.pickable.value.data) ?? [];
  const highlighted = turn && allowed.includes(turn.action.championId) ? turn.action.championId : 0;
  const bans = bansByTeam(session);
  const active = new Set(flatActions(session).filter((a) => a.isInProgress && !a.completed).map((a) => a.actorCellId));
  const phaseKey = PHASE_TEXT[phase];

  const assigned = (local?.assignedPosition ?? '').toUpperCase();
  const favorites = new Map((lcu.gridChampions.value.data ?? []).map((c) => [c.id, c.positionsFavorited ?? []]));
  for (const [id, lanes] of favOverrides) favorites.set(id, lanes);
  const quitButton = (session as Session & { showQuitButton?: boolean }).showQuitButton ? (
    <button type="button" class="rlc-button" data-variant="pill" disabled={quit.pending} onClick={() => quit.run()}>
      {t('quitSelect')}
    </button>
  ) : null;

  const mainAction = turn ? (
    <button type="button" class="rlc-button" data-variant="primary" disabled={!highlighted || commit.pending || hover.pending} onClick={() => commit.run(turn.action.id, highlighted)}>
      {turn.kind === 'ban' ? t('banAction') : t('confirm')}
    </button>
  ) : null;

  return (
    <section class="rlc-champselect" data-layout={prefs.value.champSelectLayout}>
      <div class="rlc-cs-splash" key={splash ?? 'none'} style={splash ? { backgroundImage: `url("${splash}")` } : undefined} />
      <header class="rlc-cs-top">
        <Team cells={session.myTeam} side="mine" bans={bans.mine} active={active} localCellId={session.localPlayerCellId} champions={champions} spells={spells} name={lcu.name} revealed={revealed} menuFor={(c) => (c.cellId === session.localPlayerCellId ? null : swapMenu(session, c))} />
        <div class="rlc-cs-clock">
          <span class="rlc-cs-timer">{seconds}</span>
          {phaseKey ? <span class="rlc-cs-phase">{t(phaseKey)}</span> : null}
        </div>
        <Team cells={session.theirTeam} side="theirs" bans={bans.theirs} active={active} localCellId={-1} champions={champions} spells={spells} name={lcu.name} />
      </header>
      {shown ? <h1 class="rlc-cs-champ-name">{champions.get(shown.championId)?.name ?? ''}</h1> : null}
      <SwapCards session={session} />
      <Bench session={session} champions={champions} />
      <Drawer
        tab={tab}
        onTab={setTab}
        action={
          <>
            {extensions().champSelectActions.map((Action, i) => (
              <Action key={i} lcu={lcu} />
            ))}
            {quitButton}
            {mainAction}
          </>
        }
      >
        {tab === 'champions' ? (
          <ChampionGrid
            ids={turn ? allowed : (lcu.pickable.value.data ?? [])}
            champions={champions}
            selected={highlighted}
            lanes={lcu.lanes.value.data ?? {}}
            favorites={favorites}
            initialLane={(LANES as readonly string[]).includes(assigned) ? (assigned as Lane) : null}
            onFavorite={(id, lane) => favorite.run(id, lane)}
            onPick={(id) => {
              // Fora da minha vez a grade só mostra; nada é enviado.
              if (turn) hover.run(turn.action.id, id);
            }}
          />
        ) : null}
        {tab === 'skins' && local ? <SkinsTab lcu={lcu} skins={lcu.skins.value.data ?? []} me={local} /> : null}
        {tab === 'runes' && local ? (
          <RunesSpellsTab
            me={local}
            spells={spells}
            gameMode={lcu.gameflowSession.value.data?.gameData?.queue?.gameMode ?? null}
            pages={lcu.perkPages.value.data ?? []}
            currentPage={lcu.currentPerkPage.value.data?.id ?? null}
          />
        ) : null}
      </Drawer>
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
