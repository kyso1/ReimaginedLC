import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolChatFriendRequestResource } from '../../lcu/types';
import { useAction } from '../../ui/useAction';

const REQUESTS = '/lol-chat/v2/friend-requests';

/** Pedidos de amizade: recebidos (aceitar, recusar) e enviados (cancelar). */
export function FriendRequests({ lcu }: { lcu: Lcu }) {
  const list = lcu.friendRequests.value.data ?? [];
  if (!list.length) return null;
  return (
    <details class="rlc-rc-group" open>
      <summary class="rlc-rc-group-title">{`${t('friendRequests')} (${list.length})`}</summary>
      {list.map((r) => (
        <RequestRow key={r.puuid} request={r} />
      ))}
    </details>
  );
}

function RequestRow({ request: r }: { request: LolChatFriendRequestResource }) {
  const url = `${REQUESTS}/${encodeURIComponent(r.puuid)}`;
  const accept = useAction(() => request('PUT', url, { direction: 'both' }));
  const remove = useAction(() => request('DELETE', url));
  const busy = accept.pending || remove.pending;
  return (
    <div class="rlc-req">
      <span class="rlc-rc-fname">
        {r.gameName}
        {r.tagLine ? <small> #{r.tagLine}</small> : null}
      </span>
      {String(r.direction) === 'in' ? (
        <>
          <button type="button" class="rlc-button" data-variant="pill" disabled={busy} onClick={() => accept.run()}>
            {t('accept')}
          </button>
          <button type="button" class="rlc-button" data-variant="pill" disabled={busy} onClick={() => remove.run()}>
            {t('decline')}
          </button>
        </>
      ) : (
        <button type="button" class="rlc-button" data-variant="pill" disabled={busy} onClick={() => remove.run()}>
          {t('cancel')}
        </button>
      )}
    </div>
  );
}

/** `Nome#TAG` em partes; null se faltar uma delas. */
export function parseRiotId(text: string): { gameName: string; tagLine: string } | null {
  const m = /^(.+)#([^#]+)$/.exec(text.trim());
  if (!m) return null;
  const gameName = m[1]!.trim();
  const tagLine = m[2]!.trim();
  return gameName && tagLine ? { gameName, tagLine } : null;
}

/** Adicionar amigo por Riot ID. */
export function AddFriend() {
  const [value, setValue] = useState('');
  const id = parseRiotId(value);
  const send = useAction(async () => {
    await request('POST', REQUESTS, { ...id!, direction: 'out' });
    setValue('');
  });
  return (
    <div class="rlc-add-friend">
      <input class="rlc-input" placeholder={t('addFriendHint')} aria-label={t('addFriendHint')} value={value} maxLength={40} onInput={(e) => setValue(e.currentTarget.value)} />
      <button type="button" class="rlc-button" data-variant="pill" disabled={!id || send.pending} onClick={() => send.run()}>
        {t('addFriend')}
      </button>
    </div>
  );
}

/** Disponibilidade (online, ausente, invisível) e mensagem de status do jogador. */
export function StatusEditor({ lcu }: { lcu: Lcu }) {
  const me = lcu.chatMe.value.data;
  const [message, setMessage] = useState(me?.statusMessage ?? '');
  useEffect(() => setMessage(me?.statusMessage ?? ''), [me?.statusMessage]);
  const put = (body: Record<string, string>) => request('PUT', '/lol-chat/v1/me', body);
  const saveAvailability = useAction(put);
  const saveMessage = useAction(put);
  const availability = me?.availability === 'away' || me?.availability === 'offline' ? me.availability : 'chat';
  return (
    <div class="rlc-status">
      <select class="rlc-input" aria-label={t('statusOnline')} value={availability} onChange={(e) => saveAvailability.run({ availability: e.currentTarget.value })}>
        <option value="chat">{t('statusOnline')}</option>
        <option value="away">{t('statusAway')}</option>
        <option value="offline">{t('statusInvisible')}</option>
      </select>
      <input
        class="rlc-input"
        aria-label={t('statusMessage')}
        placeholder={t('statusMessage')}
        value={message}
        maxLength={100}
        onInput={(e) => setMessage(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') saveMessage.run({ statusMessage: message.trim() });
        }}
      />
    </div>
  );
}
