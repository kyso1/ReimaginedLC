import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import { Confirm } from '../../shell/overlays/Confirm';
import { useAction } from '../../ui/useAction';
import { BotPicker, useBots } from './BotPicker';
import { formatClock } from './format';
import { InviteFriends } from './InviteFriends';
import { MemberMenu } from './MemberMenu';
import { Positions } from './Positions';
import { Column, Stage, type Participant } from './Stage';

const MEMBERS = '/lol-lobby/v2/lobby/members';

/** Lobby no layout Palco: uma coluna por vaga e a barra flutuante com fila e busca. */
export function Lobby({ lcu, onModes }: { lcu: Lcu; onModes: () => void }) {
  const [panel, setPanel] = useState<null | 'positions' | 'invite' | { botTeam: number }>(null);
  const [kicking, setKicking] = useState<Participant | null>(null);
  const bots = useBots(lcu.lobby.value.data?.gameConfig.isCustom === true);
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

  const queueName = lcu.queues.value.data?.find((q) => q.id === config.queueId)?.name ?? '';
  const column = (m: Participant | null, key: string, empty: ComponentChildren, team?: number) => (
    <Column
      key={m ? m.puuid || m.botUuid : key}
      member={m}
      profile={lcu.profile}
      name={lcu.name}
      splash={lcu.splash}
      isLocal={m ? isLocal(m) : false}
      showPositions={!config.isCustom && config.showPositionSelector}
      label={m?.isBot ? (bots.find((b) => b.id === m.botChampionId)?.name ?? t('bot')) : undefined}
      onSelf={m && isLocal(m) && !config.isCustom && config.showPositionSelector ? () => setPanel('positions') : undefined}
      menu={m ? memberMenu(m, team) : null}
      empty={empty}
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
                <button type="button" onClick={() => void request('POST', `/lol-lobby/v2/lobby/team/TEAM${team === 100 ? 1 : 2}`).catch(() => {})}>
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
        onTitle={leader ? onModes : undefined}
        leader={leader}
        partyType={data.partyType}
        start={leader ? { label: t('findMatch'), path: '/lol-lobby/v2/lobby/matchmaking/search', enabled: data.canStartActivity } : null}
      />
    );
  }

  return (
    <section class="rlc-lobby" data-custom={config.isCustom ? 'true' : undefined}>
      {stage}
      {bar}
      {panel === 'positions' ? <Positions onClose={() => setPanel(null)} /> : null}
      {panel === 'invite' ? <InviteFriends friends={lcu.friends.value.data ?? []} exclude={new Set(data.members.map((m) => m.puuid))} onClose={() => setPanel(null)} /> : null}
      {panel && typeof panel === 'object' ? <BotPicker bots={bots} teamId={panel.botTeam} onClose={() => setPanel(null)} /> : null}
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
        <div class="rlc-bar-title">
          {onTitle && !searching ? (
            <button type="button" class="rlc-bar-queue" onClick={onTitle}>
              {title} ▾
            </button>
          ) : (
            <span class="rlc-bar-queue">{title}</span>
          )}
          {subtitle ? <small>{subtitle}</small> : null}
        </div>
        {leader && partyType && !searching ? (
          <button type="button" class="rlc-button" data-variant="pill" disabled={party.pending} onClick={() => party.run(partyType === 'open' ? 'closed' : 'open')}>
            {partyType === 'open' ? t('openLobby') : t('closedLobby')}
          </button>
        ) : null}
        {children}
        {!searching ? (
          <button type="button" class="rlc-button" data-variant="pill" disabled={leave.pending} onClick={() => leave.run()}>
            {t('leave')}
          </button>
        ) : null}
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

/** Tempo na fila contado localmente a partir do último valor da LCU, que só chega em eventos esparsos. */
function useClock(base: number, active: boolean): number {
  const [anchor, setAnchor] = useState(() => ({ base, at: Date.now() }));
  const [, tick] = useState(0);
  useEffect(() => setAnchor({ base, at: Date.now() }), [base]);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return active ? anchor.base + (Date.now() - anchor.at) / 1000 : base;
}
