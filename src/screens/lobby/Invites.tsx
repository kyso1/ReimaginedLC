import { useEffect, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolLobbyLobbyInvitationDto } from '../../lcu/types';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';

type Invite = LolLobbyLobbyInvitationDto;

/** Situação do convite: esperando resposta, entrou (ou aceitou) ou não veio (recusou, erro, expulso). */
export function inviteStatus(state: Invite['state']): 'pending' | 'joined' | 'declined' {
  if (state === 'Accepted' || state === 'Joined') return 'joined';
  if (state === 'Declined' || state === 'Error' || state === 'Kicked') return 'declined';
  return 'pending';
}

const LABEL: Record<ReturnType<typeof inviteStatus>, TextKey> = { pending: 'invitePending', joined: 'inviteJoined', declined: 'inviteDeclined' };

/** Nome do convidado. A LCU manda `toSummonerName` vazio desde o Riot ID: vem pelo puuid. */
export function useInviteName(invite: Invite, name: Lcu['name']): string {
  const [found, setFound] = useState<string | null>(null);
  const puuid = invite.toSummonerName ? null : invite.toPuuid;
  useEffect(() => {
    setFound(null);
    if (!puuid) return;
    let live = true;
    void name(puuid).then((n) => live && setFound(n));
    return () => void (live = false);
  }, [puuid, name]);
  return invite.toSummonerName || found || '';
}

/**
 * Carta na barra do lobby com todos os convites da sala: reticências pulando para quem ainda não respondeu, X para
 * quem recusou e ✓ para quem entrou. Abre com o mouse (some ao sair) ou presa pelo clique (fecha no clique ou no Esc).
 * Quem pode convidar reenvia o convite a quem não entrou (como no client da Riot). Some sem convites.
 */
export function Invites({ invitations, name, canInvite = false }: { invitations: Invite[]; name: Lcu['name']; canInvite?: boolean }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  useEscape(() => setPinned(false));
  if (!invitations.length) return null;
  const pending = invitations.filter((v) => inviteStatus(v.state) === 'pending').length;
  const open = hover || pinned;
  return (
    <div class="rlc-voice-group rlc-inv" onMouseLeave={() => setHover(false)}>
      {open ? (
        <div class="rlc-voice-pop" role="list" aria-label={t('invitesTitle')}>
          <p class="rlc-voice-pop-title">{t('invitesTitle')}</p>
          {invitations.map((v) => (
            <InviteRow key={v.invitationId || v.toPuuid} invite={v} name={name} canInvite={canInvite} />
          ))}
        </div>
      ) : null}
      <button
        type="button"
        class="rlc-button rlc-voice-people"
        data-variant="pill"
        aria-expanded={open}
        aria-label={`${t('invitesTitle')}: ${invitations.length}`}
        onMouseEnter={() => setHover(true)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        onClick={() => setPinned(!pinned)}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M4 6h16v12H4zM4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
        </svg>
        {pending ? <span class="rlc-voice-count">{pending}</span> : null}
      </button>
    </div>
  );
}

function InviteRow({ invite, name, canInvite }: { invite: Invite; name: Lcu['name']; canInvite: boolean }) {
  const who = useInviteName(invite, name);
  const status = inviteStatus(invite.state);
  // Erro da LCU já vira aviso no `request`.
  const again = useAction(() => request('POST', '/lol-lobby/v2/lobby/invitations', [{ toSummonerId: invite.toSummonerId, toPuuid: invite.toPuuid }]));
  return (
    <div class="rlc-voice-person rlc-inv-row" role="listitem" data-status={status} aria-label={`${who} · ${t(LABEL[status])}`}>
      <span class="rlc-voice-name">{who}</span>
      <span class="rlc-inv-state" title={t(LABEL[status])} aria-hidden="true">
        {status === 'pending' ? (
          <span class="rlc-inv-dots">
            <i />
            <i />
            <i />
          </span>
        ) : status === 'joined' ? (
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          </svg>
        )}
      </span>
      {canInvite && status !== 'joined' ? (
        <button type="button" class="rlc-inv-again" aria-label={`${t('inviteAgain')}: ${who}`} title={t('inviteAgain')} disabled={again.pending} onClick={() => again.run()}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M19 12a7 7 0 1 1-2-4.9M19 4v4h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
