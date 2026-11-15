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
import { actingCells, allyWants, arenaBanCells, arenaPickOrder, arenaSubteams, arenaTeamSize, banIntents, banPhase, banSlots, BRAVERY, displayedChampion, flatActions, laneOpponent, myTurn, remainingSeconds, selectPhase, unavailable, watching, type Cell, type SelectPhase, type Session } from './logic';
import { useRealNames } from './names';
import { ArenaTeams, BRAVERY_BG, foeName, subteamLabel, Team } from './Teams';
import { ArenaOrder, BraveReel, CrowdFavs, CrowdIntro, FAV_MS } from './Arena';
import { BanReveal, BanStrip, type RevealGroup } from './Bans';
import { useBanReveal, useBraveryEvent, useChangePulse, useLockEvent, usePulse } from './fx';
import { Flights, type FlightSnapshot } from './aramFx';
import { ABYSS_MAP_ID } from './scene/abyss';
import { ARENA_MAP_ID } from './scene/arena';
import { positionKey } from '../lobby/format';
import { MapSide, sceneOnly, useMapArt, useMapRules } from './MapSide';
import { rankedQueueOf } from '../../ui/Rank';
import { useEscape } from '../../ui/useEscape';
import { prefs } from '../../shell/prefs';
import { roseStatus, useRose } from '../../plugins/rose';
import { dodge, dodgeAvailable } from '../../plugins/dodge';
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
 * Seleção de campeões em palco: aliados em cartões altos à esquerda, inimigos espelhados à direita e, no meio, a
 * splash de quem está agindo (a prévia do mouse na grade, o meu campeão, o aliado que escolhe, quem acabou de travar)
 * com o nome grande. No topo, fase, tempo e a faixa de banimentos. A grade cobre a parte de baixo do palco enquanto se
 * escolhe e some no ✕, no Esc ou ao travar. Feitiços, runas, sentinela, skin e Travar ficam na barra do pé.
 * Tudo que anima (tom vermelho do banimento, revelação dos bans, varredura nos cartões, clarão ao travar) segue a
 * sessão da LCU, nunca o clique.
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
  // A seleção começa com a grade fechada enquanto o mapa se forma; com o tempo da vez acabando, abre na hora.
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIntro(false), MAP_INTRO_MS);
    return () => clearTimeout(timer);
  }, []);
  // Só quando há mapa para ver (o id do mapa vem com a sessão; a arte chega depois).
  const holdGrid = intro && !!lcu.gameflowSession.value.data?.map?.id && seconds > INTRO_MIN_SECONDS;
  // A grade segue o momento: abre na minha vez e fecha quando ela acaba (bani ou travei, confirmado pela LCU), para o
  // palco mostrar o que vem depois. Abrir ou fechar à mão vale até a próxima mudança.
  useEffect(() => {
    if (turn && !holdGrid) setDrawerOpen(true);
    else if (!turn) setDrawerOpen(false);
  }, [turn?.action.id, locked, holdGrid]);
  const gridOpen = drawerOpen && !gridless;
  // ARAM: as cartas esperam o mapa se formar, como a grade; depois são distribuídas por cima dele.
  const dealt = cardTurn && !holdGrid;
  const previewing = (gridOpen || dealt) && preview ? preview : 0;
  // ROSE conectado: o carrossel oferece também skins não possuídas. A escolhida (`pick`) só vai para o palco e para o
  // ROSE; a LCU não sabe dela. Zera ao trocar de campeão.
  useRose(prefs.value.rose);
  const rose = prefs.value.rose && roseStatus.value === 'connected';
  const [rosePick, setRosePick] = useState<number | null>(null);
  useEffect(() => setRosePick(null), [shown?.championId]);
  const pick = rose ? rosePick : null;
  // Arena: Ousadia em destaque (minha vez) ou travada: o palco mostra a arte dela no lugar de uma splash.
  const arenaMode = lcu.gameflowSession.value.data?.gameData?.queue?.gameMode === 'CHERRY';
  const brave = arenaMode && !!local && (local.championId === BRAVERY || (turn?.kind === 'pick' && turn.action.championId === BRAVERY));
  // Ousadia travada: o campeão só se sabe no carregamento, então a vaga fica com -3 e não conta como `locked`.
  const braveLocked = arenaMode && local?.championId === BRAVERY;
  const mineSkin = brave && !previewing ? undefined : previewing ? previewing * 1000 : shown ? (shown.locked && (pick ?? local!.selectedSkinId) > 0 ? (pick ?? local!.selectedSkinId) : shown.championId * 1000) : undefined;
  // Palco: quem aparece no meio, em ordem: a prévia do mouse, a minha vez de banir, o que acabei de banir, quem
  // acabou de travar (fora da minha vez), o meu campeão travado, quem está escolhendo agora e, por fim, a minha intenção.
  const banning = !!session && banPhase(session);
  // Com as animações reduzidas ou desligadas não há revelação: a faixa só atualiza.
  const revealed = useBanReveal(session);
  const reveal = prefs.value.motion === 'full' ? revealed : null;
  const lockEvent = useLockEvent(session);
  // Arena: alguém (eu também) travou a Ousadia: a roleta gira no centro e o palco é de quem foi. Com a grade aberta
  // (escolhendo) ou fora da fase de escolha só o selo aparece.
  const braveEvent = useBraveryEvent(arenaMode ? session : null, BRAVERY);
  const braveShow = braveEvent && !gridOpen && !reveal && session?.timer?.phase === 'BAN_PICK' ? braveEvent : null;
  // Arena: os favoritos da torcida são apresentados quando a lista chega (ou quando os banimentos acabam, se ela já
  // estava lá) e depois ficam no cabeçalho. Na minha vez a grade tem a frente: só a faixa aparece.
  const crowdIds = arenaMode ? (lcu.crowdFavorites.value.data ?? []) : [];
  const favPulse = usePulse(crowdIds.length > 0 && !banning && !reveal && session?.timer?.phase === 'BAN_PICK', FAV_MS);
  const favIntro = favPulse && !turn && prefs.value.motion === 'full';
  // Cinemática do meu travamento: com mapa, o clarão e a batida do nome vêm no fim do mergulho; sem mapa, na hora.
  // Enquanto ela dura o palco é meu, mesmo que outro jogador trave junto.
  // No ARAM ninguém trava: o meu campeão muda várias vezes (carta, banco, rolagem, troca) e cada mudança confirmada
  // pela LCU tem a mesma cinemática. -1 enquanto a sessão não chegou: abrir a tela com campeão não é escolher.
  const myChamp = !session ? -1 : gridless ? Math.max(0, local?.championId ?? 0) : 0;
  const swapFx = useChangePulse(myChamp, DIVE_MS + LOCK_FX_MS);
  const lockFx = usePulse(locked && !gridless, DIVE_MS + LOCK_FX_MS) || swapFx;
  const justLocked = lockEvent && !turn && !previewing && !lockFx ? lockEvent : null;
  const acting = session ? watching(session) : null;
  const watch = !previewing && !turn && !locked && !justLocked && !banning && !reveal ? acting : null;
  const myBan = session && banning && !turn && !previewing ? (flatActions(session).filter((a) => a.type === 'ban' && a.actorCellId === session.localPlayerCellId && a.completed && a.championId > 0).pop()?.championId ?? 0) : 0;
  const banPick = turn?.kind === 'ban' && !previewing ? Math.max(0, turn.action.championId) : 0;
  const stage: { id: number; skin?: number; mode?: StageMode } =
    turn?.kind === 'ban'
      ? { id: previewing || banPick, skin: (previewing || banPick) * 1000 || undefined, mode: 'ban' }
      : previewing
        ? { id: previewing, skin: mineSkin, mode: 'dim' }
        : myBan
          ? { id: myBan, skin: myBan * 1000, mode: 'banned' }
          : braveShow
            ? { id: 0, mode: 'full' }
            : justLocked
            ? { id: justLocked.cell.championId, skin: justLocked.cell.championId * 1000, mode: justLocked.foe ? 'foefull' : 'full' }
            : watch && arenaMode && !watch.championId
              ? { id: 0 } // Arena: quem escolhe são outros times, sem destaque à mostra; o palco fica com a arena.
              : watch
              ? { id: watch.championId, skin: watch.championId * 1000 || undefined, mode: watch.foe ? 'foe' : 'dim' }
              : { id: shown?.championId ?? 0, skin: mineSkin, mode: mineSkin || brave ? (locked || braveLocked ? 'full' : 'dim') : undefined };
  const stageSkin = stage.skin;
  const splashUrl = useLoaded(() => lcu.game.splash(stageSkin), null, [stageSkin]);
  const splash = useDecoded(splashUrl);
  const flow = lcu.gameflowSession.value.data;
  const mapArt = useMapArt(flow?.map?.id, flow?.gameData?.queue?.gameMode);
  // Ao travar: o mapa mergulha na minha rota e some na splash do campeão (só na passagem, não ao abrir já travado).
  // Segue só a passagem para travado: a arte do mapa chega depois ao abrir a tela já travado, e isso não é escolher.
  // A Arena é toda desenhada aqui: a cena não precisa da arte do client (só o desenho plano, sem WebGL, precisa).
  const arenaMap = flow?.map?.id === ARENA_MAP_ID;
  const hasMap = !!mapArt || sceneOnly(flow?.map?.id);
  const swapDive = useChangePulse(myChamp, DIVE_MS);
  const diving = (usePulse((locked || braveLocked) && !gridless, DIVE_MS) || swapDive) && hasMap;
  // Howling Abyss: a ponte se forma antes de tudo (mesmo com campeão já sorteado), fica apagada atrás das cartas e
  // volta para o mergulho. Nos outros mapas o mapa só aparece com o palco vazio.
  const abyss = flow?.map?.id === ABYSS_MAP_ID;
  // Arena: a arena também se forma antes de tudo e depois fica no palco sempre que não há splash nem grade (o palco
  // da Arena é dos outros times quase o tempo todo, e a LCU não mostra o destaque deles: a cena mostra quem já travou).
  const arenaScene = arenaMap && arenaMode;
  const sceneIntro = (abyss || arenaScene) && holdGrid && !diving;
  const mapShown =
    hasMap && (diving || (abyss ? sceneIntro || dealt || (!stageSkin && !stage.mode) : arenaScene ? sceneIntro || (!stageSkin && !gridOpen && !brave && !braveShow) : !stageSkin && !stage.mode && !gridOpen && !cardTurn));

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
  const rules = useMapRules(flow?.map?.id, gameMode);
  // Mapa sem runas (ARAM Caos, Arena): nada de recomendação nem de aplicar ao travar.
  const reco: RecoContext | null =
    session && local && rules.runes
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
  // Arena: subtimes pelas vagas (tamanho pela fila); à esquerda o meu, à direita todos os outros com os picks.
  const arenaSize = arenaTeamSize(flow?.gameData?.queue?.id);
  const subteams = arenaMode ? arenaSubteams(session, arenaSize) : [];
  const myCells = arenaMode ? (subteams.find((g) => g.mine)?.cells ?? session.myTeam) : session.myTeam;
  const allowed = (turn?.kind === 'ban' ? lcu.bannable.value.data : lcu.pickable.value.data) ?? [];
  // Arena: cada jogador bane um; o banimento fica no cartão (meu time) ou no retrato (os outros, escondido até a
  // revelação). Nos outros modos, na faixa do cabeçalho.
  const arenaBanMap = arenaMode ? arenaBanCells(session, arenaSize, !!reveal) : null;
  const intents = arenaBanMap ? new Map([...arenaBanMap].filter(([, b]) => b.id > 0 && b.state !== 'hidden').map(([id, b]) => [id, { championId: b.id, done: b.state === 'done' }])) : banIntents(session);
  const myTeamIndex = Math.floor(session.localPlayerCellId / arenaSize);
  const teamOf = (c: Cell) => subteamLabel(Math.floor(c.cellId / arenaSize));
  // Quem é o jogador para o palco: o nome quando a LCU o mostra, senão o time dele.
  const arenaWho = (c: Cell) => (c.cellId === session.localPlayerCellId ? t('socYou') : (c.nameVisibilityType !== 'HIDDEN' && (real.byCell.get(c.cellId)?.gameName || c.gameName)) || teamOf(c));
  const revealGroups: RevealGroup[] | undefined =
    reveal && arenaMode ? subteams.map((g) => ({ team: g.index, title: g.mine ? t('csYourTeam') : subteamLabel(g.index), list: reveal.filter((r) => g.cells.some((c) => c.cellId === r.cellId)) })).filter((g) => g.list.length) : undefined;
  const strip = arenaMode ? { mine: [], theirs: [] } : banSlots(session);
  const active = actingCells(session);
  // Banidos e escolhidos por outro ficam na grade, cinza e sem clique (a LCU pode mandá-los ainda como disponíveis).
  const blocked = unavailable(session);
  const braveryOn = arenaMode && turn?.kind === 'pick';
  const highlighted = turn && ((allowed.includes(turn.action.championId) && !blocked.has(turn.action.championId)) || (braveryOn && turn.action.championId === BRAVERY)) ? turn.action.championId : 0;
  const wants = allyWants(session);
  // Fora da vez de banir os indisponíveis só entram se forem meus (a grade é das minhas escolhas).
  const owned = new Set((lcu.gridChampions.value.data ?? []).filter((c) => c.owned || c.rented || c.freeToPlayForQueue).map((c) => c.id));
  const gridIds = [...new Set([...(turn ? allowed : (lcu.pickable.value.data ?? [])), ...[...blocked.keys()].filter((id) => turn?.kind === 'ban' || !owned.size || owned.has(id))])];
  const banWarn = turn?.kind === 'ban' && highlighted > 0 && wants.has(highlighted);
  const phaseKey = PHASE_TEXT[phase];
  const total = Math.max(1, Math.round((session.timer?.totalTimeInPhase ?? 0) / 1000));
  const left = session.timer?.isInfinite ? 1 : Math.min(1, seconds / total);
  const allyName = (c: Cell) => real.byCell.get(c.cellId)?.gameName || c.gameName || t('csAlly');
  const roleOf = (c: Cell) => {
    const key = positionKey((c.assignedPosition ?? '').toUpperCase());
    return key ? ` · ${t(key)}` : '';
  };
  // Fora da vez o rótulo diz quem está escolhendo; o título grande diz a fase (e conta 3, 2, 1 no fim).
  // Arena: não há "o inimigo"; quem escolhe são os times da rodada em andamento.
  const rounds = arenaMode ? arenaPickOrder(session, arenaSize) : [];
  const nowTeams = (rounds.find((r) => r.state === 'now')?.teams ?? []).map(subteamLabel).join(' · ');
  const phaseLabel = phase === 'waiting' && acting && nowTeams ? nowTeams : phase === 'waiting' && acting ? (acting.foe ? t('csFoePicking') : `${allyName(acting.cell)} ${t('csIsPicking')}`) : phaseKey ? t(phaseKey) : null;
  const rawPhase = session.timer?.phase;
  const starting = rawPhase === 'GAME_STARTING';
  const title = reveal
    ? t('csTitleReveal')
    : rawPhase === 'PLANNING'
      ? t('csTitlePlanning')
      : rawPhase === 'FINALIZATION'
        ? seconds > 0 && seconds <= 3 && !session.timer?.isInfinite
          ? String(seconds)
          : t('csTitleFinal')
        : rawPhase === 'BAN_PICK'
          ? t(banning ? 'csTitleBan' : 'csTitlePick')
          : starting
            ? t('csTitleStarting')
            : null;

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
    prefs.value.dodge && dodgeAvailable() && session.timer?.phase !== 'GAME_STARTING' ? (
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

  const stageId = stage.id;
  // Linha pequena acima do nome: de quem é o campeão no palco e o que está acontecendo com ele.
  const stageSub =
    stage.mode === 'ban'
      ? t(stageId ? 'banAction' : 'csTitleBan')
      : stage.mode === 'banned'
        ? t('csBannedByYou')
        : braveShow
          ? `${arenaWho(braveShow)} ${t('csWentBravery')}${braveShow.cellId === session.localPlayerCellId ? '' : ` · ${teamOf(braveShow)}`}`
          : justLocked && arenaMode
            ? `${arenaWho(justLocked.cell)} ${t('csLockedIn')} · ${teamOf(justLocked.cell)}${crowdIds.includes(justLocked.cell.championId) ? ` · ${t('csCrowdFavorite')}` : ''}`
            : justLocked
          ? `${justLocked.foe ? foeName(justLocked.cell, justLocked.index) : allyName(justLocked.cell)} ${t('csLockedIn')}${roleOf(justLocked.cell)}`
          : watch
            ? arenaMode
              ? ''
              : watch.foe
              ? t('csEnemyTeam')
              : `${allyName(watch.cell)} ${t('csIsPicking')}${roleOf(watch.cell)}`
            : previewing
              ? ''
              : locked || braveLocked
                ? t('csLockedYou')
                : turn?.kind === 'pick'
                  ? t('phasePick')
                  : shown
                    ? t('csIntent')
                    : '';
  const stageName = stage.mode === 'ban' && !stageId ? t('csBanAsk') : (brave || braveShow) && !previewing ? t('csBravery') : watch && arenaMode && !stageId ? '' : watch?.foe ? '? ? ?' : (stageId && champions.get(stageId)?.name) || '';
  const crowd = arenaMode ? new Set(crowdIds) : undefined;
  const skins = lcu.skins.value.data ?? [];
  const chosen = locked && local ? skinOf(skins, pick ?? local.selectedSkinId) : undefined;
  const skin = previewing || justLocked ? undefined : chosen;
  // Preparação: o carrossel grande de skins toma o palco (na Arena também; com a Ousadia não há skin para escolher).
  const skinFlow = phase === 'finalization' && locked && !gridOpen && !(gridless && lockFx);
  const stageMode = skinFlow && stage.mode === 'full' && !justLocked ? 'skin' : stage.mode;
  // ARAM: o outro time fica oculto até o carregamento; sem ninguém para mostrar, o palco vai até a borda direita.
  const solo = gridless && !arenaMode && session.theirTeam.length === 0;
  const flightSnap: FlightSnapshot | null = gridless
    ? { me: session.localPlayerCellId, cells: session.myTeam.map((c) => [c.cellId, c.championId]), bench: ((session.benchChampions ?? []) as Array<{ championId: number }>).map((b) => b.championId), cards: dealt ? subset : [] }
    : null;

  return (
    <section
      class="rlc-champselect"
      data-phase={phase}
      data-grid={gridOpen || dealt ? 'open' : undefined}
      data-gridless={gridless ? 'true' : undefined}
      data-ban={banning || reveal ? 'true' : undefined}
      data-reveal={reveal ? 'true' : undefined}
      data-turn={turn && turn.kind !== 'intent' ? 'true' : undefined}
      data-stage={stageMode}
      data-lockfx={lockFx ? (hasMap ? 'dive' : 'now') : undefined}
      data-arena={arenaMode ? 'true' : undefined}
      data-favintro={favIntro ? 'true' : undefined}
      data-exit={starting ? 'true' : undefined}
      data-scene={sceneIntro && mapShown ? 'intro' : undefined}
      data-solo={solo ? 'true' : undefined}
    >
      <Flights snap={flightSnap} sessionId={session.id} champions={champions} />
      {stageSkin ? <Crossfade src={splash} class="rlc-cs-splash" position="center 15%" /> : (brave || braveShow) && stage.mode !== 'ban' ? <Crossfade src={BRAVERY_BG} class="rlc-cs-splash" position="center 15%" /> : null}
      <i class="rlc-cs-shade" aria-hidden="true" />
      <i class="rlc-cs-foeglow" aria-hidden="true" />
      <i class="rlc-cs-slash" aria-hidden="true" />
      {mapShown ? <MapSide art={mapArt} mapId={flow?.map?.id} cells={myCells} subteams={arenaScene ? subteams : undefined} localCellId={session.localPlayerCellId} champions={champions} name={lcu.name} real={real.byCell} diving={diving} dim={abyss && dealt} /> : null}
      {/* Tom vermelho do banimento: vinheta leve e um fio de luz no topo; só a opacidade anima. */}
      <i class="rlc-cs-heat" aria-hidden="true" />
      {/* Ponte para o ROSE-SkinMonitor, que lê o nome da skin no DOM (`.skin-name-text`) e fica com o último visível. */}
      {rose && chosen ? (
        <span class="skin-name-text rlc-rose-mirror" aria-hidden="true">
          {chosen.name}
        </span>
      ) : null}
      <Team cells={myCells} side="mine" title={arenaMode ? `${t('csYourTeam')} · ${subteamLabel(myTeamIndex)}` : undefined} crowd={crowd} footer={arenaMode ? <ArenaOrder rounds={rounds} mine={myTeamIndex} /> : null} active={active} left={left} intents={intents} localCellId={session.localPlayerCellId} champions={champions} spells={spells} name={lcu.name} splash={lcu.game.splash} real={real.byCell} extra={real.extra} rankQueue={rankedQueueOf(lcu.gameflowSession.value.data?.gameData?.queue?.id) ?? 'RANKED_SOLO_5x5'} menuFor={(c) => (c.cellId === session.localPlayerCellId ? null : swapMenu(session, c))} icons={gridless} />
      <div class="rlc-cs-center">
        <header class="rlc-cs-head">
          <p class="rlc-cs-clock">
            {phaseLabel ? <span class="rlc-cs-phase">{phaseLabel}</span> : null}
            <span>
              <span class="rlc-cs-timer">{seconds}</span> s
            </span>
          </p>
          {title ? (
            <strong key={title} class="rlc-cs-title">
              {title}
            </strong>
          ) : null}
          <span class="rlc-cs-timebar" aria-hidden="true">
            <i style={{ transform: `scaleX(${left})` }} />
          </span>
          <BanStrip slots={strip} champions={champions} flying={reveal} />
          {arenaMode && phase !== 'finalization' && !starting ? <CrowdFavs ids={crowdIds} champions={champions} taken={blocked} /> : null}
          {gridless ? <Bench session={session} champions={champions} subset={subset} pickable={lcu.pickable.value.data ?? null} readOnly={cardTurn} /> : null}
        </header>
        {/* As linhas ficam sempre no lugar (só somem da vista): o nome que aparece no mouse sobre a grade empurrava a
            grade para baixo, o mouse saía do campeão, o nome sumia e a grade subia de novo, sem parar. */}
        <div class="rlc-cs-nameplate">
          <small class="rlc-cs-stage-sub" data-empty={stageSub ? undefined : 'true'}>
            {stageSub || ' '}
          </small>
          <h1 key={justLocked ? `lock-${justLocked.cell.cellId}` : 'name'} class="rlc-cs-champ-name" data-empty={stageName ? undefined : 'true'} aria-hidden={stageName ? undefined : 'true'}>
            {stageName || ' '}
          </h1>
          <i class="rlc-cs-stage-line" aria-hidden="true" />
          {watch?.foe && !arenaMode ? (
            <p class="rlc-cs-skin-name">{t('csFoeHidden')}</p>
          ) : chosen && !chosen.isBase ? (
            <p class="rlc-cs-skin-name" data-empty={skin ? undefined : 'true'} aria-hidden={skin ? undefined : 'true'}>
              {chosen.name}
            </p>
          ) : null}
        </div>
        {dealt ? <SubsetCards ids={subset} champions={champions} splash={lcu.game.splash} disabled={commit.pending} onHover={setPreview} onPick={(id) => commit.run(turn.action.id, id)} /> : null}
        {cardTurn ? null : gridOpen ? (
          <Drawer onClose={() => setDrawerOpen(false)}>
            <ChampionGrid
              ids={gridIds}
              blocked={blocked}
              wanted={turn?.kind === 'ban' ? wants : undefined}
              crowd={crowd}
              bravery={braveryOn ? { selected: highlighted === BRAVERY, onPick: () => hover.run(turn!.action.id, BRAVERY) } : undefined}
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
            {gridless || skinFlow ? null : (
              <button type="button" class="rlc-button rlc-cs-reopen" data-variant="pill" onClick={() => setDrawerOpen(true)}>
                {t('csDrawerOpen')}
              </button>
            )}
            {local ? <SkinCarousel skins={skins} me={local} rose={rose} pick={pick} onPick={setRosePick} flow={skinFlow} /> : null}
          </>
        )}
        {reveal ? <BanReveal key={reveal.map((r) => r.championId).join('-')} bans={reveal} champions={champions} groups={revealGroups} /> : null}
        {favIntro ? <CrowdIntro ids={crowdIds} champions={champions} /> : null}
        {braveShow && prefs.value.motion === 'full' ? <BraveReel key={braveShow.cellId} champions={champions} seed={braveShow.cellId} /> : null}
      </div>
      {arenaMode ? (
        <ArenaTeams subteams={subteams.filter((g) => !g.mine)} champions={champions} bans={arenaBanMap ?? new Map()} active={active} left={left} crowd={crowd} rolling={braveShow?.cellId} />
      ) : solo ? null : (
        <Team cells={session.theirTeam} side="theirs" active={active} left={left} localCellId={-1} champions={champions} spells={spells} name={lcu.name} splash={lcu.game.splash} />
      )}
      <SwapCards session={session} champions={champions} />
      <footer class="rlc-cs-bar">
        {local ? (
          <Loadout
            me={local}
            spells={spells}
            gameMode={lcu.gameflowSession.value.data?.gameData?.queue?.gameMode ?? null}
            pageName={lcu.currentPerkPage.value.data?.name ?? null}
            keystone={lcu.currentPerkPage.value.data?.selectedPerkIds?.[0]}
            onRunes={() => setRunesOpen(true)}
            summonerId={lcu.chatMe.value.data?.summonerId}
            runes={rules.runes}
            ward={rules.ward}
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
          {locked && !mainAction && !gridless ? <span class="rlc-cs-locked">{t('csLockedYou')} ✓</span> : null}
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
      {/* Clarão do travamento (só anima com `data-lockfx`). */}
      <i class="rlc-cs-flash" aria-hidden="true" />
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

/** Tempo da formação do mapa (até o último aliado cair no lugar): a grade espera isso no começo da seleção. */
export const MAP_INTRO_MS = 3800;
/** Com menos que isso na vez, a grade abre logo, mesmo durante a formação do mapa. */
export const INTRO_MIN_SECONDS = 12;

/** Duração do mergulho do mapa ao travar: a descida da câmera (`DIVE_S` da cena) e o sumiço na splash (`rlc-rift-dive-fade`). */
export const DIVE_MS = 1500;

/** Clarão e batida do nome depois do mergulho, quando a LCU confirma a minha escolha (o CSS usa os mesmos tempos). */
export const LOCK_FX_MS = 1000;

/** Como o palco mostra a splash: apagada (ainda escolhendo), cinza (banir), cor cheia (travado), ou só o brilho do inimigo. */
type StageMode = 'dim' | 'ban' | 'banned' | 'full' | 'foe' | 'foefull' | 'skin';
