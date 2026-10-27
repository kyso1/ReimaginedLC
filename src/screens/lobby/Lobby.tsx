import { Voice } from './Voice';
import { ModeEmblem } from '../modes/Emblems';
import { queueGroup, type ModeGroupId } from '../modes/queues';
import type { ComponentChildren } from 'preact';
import { signal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import { prefs } from '../../shell/prefs';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import { Confirm } from '../../shell/overlays/Confirm';
import { rankedQueueOf } from '../../ui/Rank';
import { useAction } from '../../ui/useAction';
import { BotPicker, useBots } from './BotPicker';
import { formatClock, useClock } from './format';
import { InviteFriends } from './InviteFriends';
import { MemberMenu } from './MemberMenu';
import { Column, Stage, type Participant } from './Stage';
import { TftCustomize } from './TftCustomize';
import { QuickPlayEditor, quickPlayProblem, SlotStrip } from './QuickPlay';
import type { Champion } from '../../data/gamedata';

const MEMBERS = '/lol-lobby/v2/lobby/members';

/**
 * Gaveta do lobby aberta (Jogo Rápido, Personalizar, convidar, bot). A gaveta fica dentro da tela e o chat da sala
 * fora, por cima: com ela aberta o App esconde o chat para não cobrir a gaveta.
 */
export const lobbyPanelOpen = signal(false);

/** Lobby no layout Palco: uma coluna por vaga e a barra flutuante com fila e busca. */
export function Lobby({ lcu, onModes }: { lcu: Lcu; onModes: () => void }) {
  const [panel, setPanel] = useState<null | 'invite' | 'tft' | { botTeam: number } | { qp: 0 | 1 }>(null);
  const [champions, setChampions] = useState<Map<number, Champion>>(new Map());
  const quickPlay = lcu.lobby.value.data?.gameConfig.showQuickPlaySlotSelection === true;
  useEffect(() => {
    lobbyPanelOpen.value = panel !== null;
    return () => void (lobbyPanelOpen.value = false);
  }, [panel !== null]);
  useEffect(() => {
    if (!quickPlay) return;
    let live = true;
    void lcu.game.champions().then((m) => live && setChampions(m));
    return () => void (live = false);
  }, [quickPlay]);
  const [kicking, setKicking] = useState<Participant | null>(null);
  const bots = useBots(lcu.lobby.value.data?.gameConfig.isCustom === true, lcu.game);
  const switchTeam = useAction((team: number) => request('POST', `/lol-lobby/v2/lobby/team/TEAM${team === 100 ? 1 : 2}`));
  const data = lcu.lobby.value.data;
  // Lobby some antes da fase mudar (expulso, saiu): mostra vazio até a rota trocar.
  if (!data) return <section class="rlc-lobby" />;

  const local = data.localMember;
  const config = data.gameConfig;
  const leader = local.isLeader;
  const isLocal = (m: Participant) => m.summonerId === local.summonerId;

  const memberMenu = (m: Participant, team: number = m.teamId) =>
    leader && m.isBot ? (
      <MemberMenu
        items={[{ label: t('removeBot'), run: () => void request('DELETE', `/lol-lobby/v1/lobby/custom/bots/${encodeURIComponent(m.summonerInternalName || 'bot')}/${encodeURIComponent(m.botUuid)}/${team}`).catch(() => {}) }]}
      />
    ) : leader && !isLocal(m) ? (
      <MemberMenu
        items={[
          { label: t('promote'), run: () => void request('POST', `${MEMBERS}/${m.summonerId}/promote`).catch(() => {}) },
          m.allowedInviteOthers
            ? { label: t('revokeInvite'), run: () => void request('POST', `${MEMBERS}/${m.summonerId}/revoke-invite`).catch(() => {}) }
            : { label: t('grantInvite'), run: () => void request('POST', `${MEMBERS}/${m.summonerId}/grant-invite`).catch(() => {}) },
          { label: t('kick'), run: () => setKicking(m) },
        ]}
      />
    ) : null;

  const inviteSlot =
    leader || local.allowedInviteOthers ? (
      <button type="button" class="rlc-col-invite" onClick={() => setPanel('invite')}>
        + {t('invite')}
      </button>
    ) : null;

  const isTft = config.gameMode === 'TFT';
  const queueName = lcu.queues.value.data?.find((q) => q.id === config.queueId)?.name ?? '';
  const column = (m: Participant | null, key: string, empty: ComponentChildren, team?: number) => (
    <Column
      key={m ? m.puuid || m.botUuid : key}
      member={m}
      profile={lcu.profile}
      name={lcu.name}
      splash={lcu.game.splash}
      isLocal={m ? isLocal(m) : false}
      showPositions={!config.isCustom && config.showPositionSelector}
      label={m?.isBot ? (bots.find((b) => b.id === m.botChampionId)?.name ?? t('bot')) : undefined}
      editPositions={m ? isLocal(m) : false}
      rankQueue={rankedQueueOf(config.queueId)}
      menu={m ? memberMenu(m, team) : null}
      empty={empty}
      companions={isTft ? lcu.game.companions : undefined}
      onLegend={isTft && m && isLocal(m) ? () => setPanel('tft') : undefined}
      slots={quickPlay && m && !m.isBot ? <SlotStrip slots={m.playerSlots} champions={champions} onEdit={isLocal(m) ? (i) => setPanel({ qp: i }) : undefined} /> : undefined}
    />
  );

  let stage: ComponentChildren;
  let bar: ComponentChildren;
  if (config.isCustom) {
    // Sala personalizada: um Palco por time. Vaga do outro time troca de time; o líder também põe bot.
    const size = Math.max(1, config.numPlayersPerTeam);
    // A LCU manda teamId 0 nos membros da sala: o time é a lista em que o membro está.
    const same = (a: Participant, b: Participant) => (a.puuid !== '' && a.puuid === b.puuid) || a.summonerId === b.summonerId;
    const localTeam = config.customTeam100.some((m) => same(m, local)) ? 100 : config.customTeam200.some((m) => same(m, local)) ? 200 : 0;
    const band = (team: 100 | 200, members: Participant[]) => (
      <Stage band={team === 100 ? 'blue' : 'red'}>
        {Array.from({ length: Math.max(size, members.length) }, (_, i) =>
          column(
            members[i] ?? null,
            `${team}-${i}`,
            <>
              {localTeam !== team ? (
                <button type="button" disabled={switchTeam.pending} onClick={() => switchTeam.run(team)}>
                  {t('switchTeam')}
                </button>
              ) : null}
              {leader ? (
                <button type="button" onClick={() => setPanel({ botTeam: team })}>
                  {t('addBot')}
                </button>
              ) : null}
            </>,
            team,
          ),
        )}
      </Stage>
    );
    const spectators = config.customSpectators.length;
    stage = (
      <>
        {band(100, config.customTeam100)}
        {band(200, config.customTeam200)}
      </>
    );
    bar = (
      <LobbyBar
        lcu={lcu}
        title={config.customLobbyName}
        subtitle={[queueName, spectators === 1 ? t('spectatorOne') : spectators > 1 ? `${spectators} ${t('spectatorMany')}` : ''].filter(Boolean).join(' · ')}
        leader={leader}
        start={leader ? { label: t('start'), path: '/lol-lobby/v1/lobby/custom/start-champ-select', enabled: true } : null}
      >
        {inviteSlot}
      </LobbyBar>
    );
  } else {
    const slots = Array.from({ length: Math.max(config.maxLobbySize, data.members.length) }, (_, i) => data.members[i] ?? null);
    stage = <Stage>{slots.map((m, i) => column(m, `empty-${i}`, inviteSlot))}</Stage>;
    bar = (
      <LobbyBar
        lcu={lcu}
        title={queueName}
        subtitle={quickPlay ? (quickPlayProblem(data.restrictions, data.scarcePositions) ?? undefined) : undefined}
        onTitle={leader ? onModes : undefined}
        leader={leader}
        partyType={data.partyType}
        // Jogo Rápido: a LCU deixa `canStartActivity` ligado mesmo com vaga inválida; a restrição QP é quem diz.
        start={leader ? { label: t('findMatch'), path: '/lol-lobby/v2/lobby/matchmaking/search', enabled: data.canStartActivity && !(quickPlay && quickPlayProblem(data.restrictions, data.scarcePositions)) } : null}
      >
        {isTft ? (
          <button type="button" class="rlc-button" onClick={() => setPanel('tft')}>
            {t('tftCustomize')}
          </button>
        ) : null}
      </LobbyBar>
    );
  }

  return (
    // Entrada: colunas sobem uma a uma saindo do desfoque, a barra por último (só ao montar a tela).
    <section class="rlc-lobby" data-custom={config.isCustom ? 'true' : undefined} data-enter={prefs.value.lobbyAnim && prefs.value.motion !== 'off' ? 'true' : undefined}>
      {stage}
      {bar}
      {panel === 'tft' ? <TftCustomize onClose={() => setPanel(null)} /> : null}
      {panel === 'invite' ? <InviteFriends friends={lcu.friends.value.data ?? []} exclude={new Set(data.members.map((m) => m.puuid))} onClose={() => setPanel(null)} /> : null}
      {panel && typeof panel === 'object' && 'qp' in panel ? <QuickPlayEditor lcu={lcu} slots={local.playerSlots} queueId={config.queueId} summonerId={local.summonerId} initial={panel.qp} scarce={data.scarcePositions} onClose={() => setPanel(null)} /> : null}
      {panel && typeof panel === 'object' && 'botTeam' in panel ? <BotPicker bots={bots} teamId={panel.botTeam} onClose={() => setPanel(null)} /> : null}
      {kicking ? (
        <Confirm
          message={`${t('kickConfirm')} ${kicking.summonerName}`}
          confirmLabel={t('kick')}
          onConfirm={() => {
            void request('POST', `${MEMBERS}/${kicking.summonerId}/kick`).catch(() => {});
            setKicking(null);
          }}
          onCancel={() => setKicking(null)}
        />
      ) : null}
    </section>
  );
}

/** Emblema do modo do lobby: pelo grupo da fila; sem a fila na lista (ainda carregando), pelo `gameMode`. */
export function lobbyEmblem(lcu: Lcu): ModeGroupId {
  const config = lcu.lobby.value.data?.gameConfig;
  const q = lcu.queues.value.data?.find((x) => x.id === config?.queueId);
  if (q) return queueGroup(q);
  const mode = config?.gameMode ?? '';
  return mode === 'TFT' ? 'tft' : mode === 'ARAM' || mode.startsWith('KIWI') ? 'aram' : mode === 'CLASSIC' || mode === 'SWIFTPLAY' ? 'sr' : 'other';
}

interface BarProps {
  lcu: Lcu;
  title: string;
  subtitle?: string;
  onTitle?: () => void;
  leader: boolean;
  /** Ausente na sala personalizada, que não tem lobby aberto ou fechado. */
  partyType?: string;
  /** Ação principal do líder (Encontrar partida ou Iniciar); null para quem não é líder. */
  start: { label: string; path: string; enabled: boolean } | null;
  children?: ComponentChildren;
}

/** Barra flutuante do Palco. Em busca, vira cronômetro com estimativa e Cancelar. */
export function LobbyBar({ lcu, title, subtitle, onTitle, leader, partyType, start, children }: BarProps) {
  const leave = useAction(() => request('DELETE', '/lol-lobby/v2/lobby'));
  const begin = useAction((path: string) => request('POST', path));
  const cancel = useAction(() => request('DELETE', '/lol-lobby/v2/lobby/matchmaking/search'));
  const party = useAction((type: string) => request('PUT', '/lol-lobby/v2/lobby/partyType', type));
  const search = lcu.search.value.data;
  // A fila normal fica na fase Lobby enquanto procura; só a busca diz se está na fila.
  const searching = search?.isCurrentlyInQueue === true;
  const clock = useClock(search?.timeInQueue ?? 0, searching);
  const error = search?.errors?.[0];

  return (
    <div class="rlc-bar-wrap">
      {error ? (
        <div class="rlc-bar-error" role="status">
          {error.message}
          {error.penaltyTimeRemaining > 0 ? <strong> {formatClock(error.penaltyTimeRemaining)}</strong> : null}
        </div>
      ) : null}
      <div class="rlc-bar">
        {/* Seletor de modo só com o emblema (o nome fica no balão): não encolhe até sumir com a barra cheia. */}
        {onTitle && !searching ? (
          <button type="button" class="rlc-bar-mode" aria-label={`${t('changeMode')}: ${title}`} title={title} onClick={onTitle}>
            <ModeEmblem id={lobbyEmblem(lcu)} />
            <span class="rlc-bar-caret" aria-hidden="true">▾</span>
          </button>
        ) : (
          // Sem trocar (não líder, sala personalizada, na fila): o nome fica escrito ao lado.
          <span class="rlc-bar-mode" aria-hidden="true">
            <ModeEmblem id={lobbyEmblem(lcu)} />
          </span>
        )}
        {subtitle || !onTitle || searching ? (
          <div class="rlc-bar-title">
            {!onTitle || searching ? <span class="rlc-bar-queue">{title}</span> : null}
            {subtitle ? <small>{subtitle}</small> : null}
          </div>
        ) : null}
        {leader && partyType && !searching ? (
          <button type="button" class="rlc-button" data-variant="pill" disabled={party.pending} onClick={() => party.run(partyType === 'open' ? 'closed' : 'open')}>
            {partyType === 'open' ? t('openLobby') : t('closedLobby')}
          </button>
        ) : null}
        {children}
        {!searching ? (
          <button type="button" class="rlc-button" data-variant="danger" disabled={leave.pending} onClick={() => leave.run()}>
            {t('leave')}
          </button>
        ) : null}
        <Voice lcu={lcu} />
        <div class="rlc-bar-end">
          {searching ? (
            <>
              <span class="rlc-bar-clock">{formatClock(clock)}</span>
              <small>
                {formatClock(search?.estimatedQueueTime ?? 0)} {t('estimated')}
              </small>
              {leader ? (
                <button type="button" class="rlc-button" disabled={cancel.pending} onClick={() => cancel.run()}>
                  {t('cancel')}
                </button>
              ) : null}
            </>
          ) : start ? (
            <button type="button" class="rlc-button" data-variant="primary" disabled={!start.enabled || begin.pending} onClick={() => begin.run(start.path)}>
              {start.label}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

