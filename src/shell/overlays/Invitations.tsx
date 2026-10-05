import { t } from '../../i18n';
import { request } from '../../lcu/request';
import type { LolGameQueuesQueue, LolLobbyReceivedInvitationDto } from '../../lcu/types';
import { useAction } from '../../ui/useAction';

/** Cartões de convite de grupo pendentes, no canto superior direito, sobre qualquer tela nossa. */
export function InvitationCards({ invitations, queues }: { invitations: LolLobbyReceivedInvitationDto[]; queues: LolGameQueuesQueue[] }) {
  const pending = invitations.filter((i) => i.state === 'Pending');
  if (pending.length === 0) return null;
  return (
    <aside class="rlc-invites" aria-live="polite">
      {pending.map((i) => (
        <Card key={i.invitationId} invitation={i} queueName={queues.find((q) => q.id === i.gameConfig?.queueId)?.name ?? null} />
      ))}
    </aside>
  );
}

function Card({ invitation, queueName }: { invitation: LolLobbyReceivedInvitationDto; queueName: string | null }) {
  const base = `/lol-lobby/v2/received-invitations/${encodeURIComponent(invitation.invitationId)}`;
  const accept = useAction(() => request('POST', `${base}/accept`));
  const decline = useAction(() => request('POST', `${base}/decline`));
  const busy = accept.pending || decline.pending;
  return (
    <div class="rlc-invite">
      <span class="rlc-invite-title">{t('partyInvite')}</span>
      <strong>{invitation.fromSummonerName}</strong>
      {queueName ? <span class="rlc-invite-queue">{queueName}</span> : null}
      <div class="rlc-invite-actions">
        <button type="button" class="rlc-button" data-variant="pill" disabled={busy || !invitation.canAcceptInvitation} onClick={() => accept.run()}>
          {t('accept')}
        </button>
        <button type="button" class="rlc-button" data-variant="pill" disabled={busy} onClick={() => decline.run()}>
          {t('decline')}
        </button>
      </div>
    </div>
  );
}
