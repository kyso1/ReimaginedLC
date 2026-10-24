import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolChatFriendRequestResource } from '../../lcu/types';
import { readSetting, writeSetting } from '../../shell/storage';
import { useAction } from '../../ui/useAction';

const REQUESTS = '/lol-chat/v2/friend-requests';
const FOLDERS = 'rlc.friendFolders';

/** Pastas abertas/fechadas à mão, guardadas entre aberturas do client. Lê e grava o mapa inteiro para uma pasta não apagar a outra. */
const savedFolders = (): Record<string, boolean> => {
  const v = readSetting<unknown>(FOLDERS, {});
  return typeof v === 'object' && v !== null ? (v as Record<string, boolean>) : {};
};

/**
 * Pasta recolhível da gaveta. Sem escolha guardada, segue `auto`; com `forceOpen` (busca) abre sem gravar.
 * Botão em vez de `<details>`: o `toggle` do details dispara também quando o código muda `open`, e gravaria o automático.
 */
export function Folder({ id, title, count, auto, forceOpen = false, children }: { id: string; title: string; count: string; auto: boolean; forceOpen?: boolean; children: () => ComponentChildren }) {
  const [saved, setSaved] = useState<boolean | undefined>(() => savedFolders()[id]);
  const open = forceOpen || (saved ?? auto);
  const toggle = () => {
    setSaved(!open);
    writeSetting(FOLDERS, { ...savedFolders(), [id]: !open });
  };
  return (
    <section class="rlc-rc-group" data-open={open ? 'true' : undefined}>
      <button type="button" class="rlc-rc-row rlc-rc-group-title" aria-expanded={open} onClick={toggle}>
        <span class="rlc-rc-label">
          {title} <span class="rlc-rc-count">{count}</span>
        </span>
        <span class="rlc-rc-cell" aria-hidden="true">
          <svg viewBox="0 0 12 12" width="10" height="10">
            <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </button>
      {open ? children() : null}
    </section>
  );
}

/** Pedidos de amizade: recebidos (aceitar, recusar) e enviados (cancelar). */
export function FriendRequests({ lcu }: { lcu: Lcu }) {
  const list = lcu.friendRequests.value.data ?? [];
  if (!list.length) return null;
  return (
    <Folder id="requests" title={t('friendRequests')} count={String(list.length)} auto>
      {() => list.map((r) => <RequestRow key={r.puuid} request={r} />)}
    </Folder>
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

/** Adicionar amigo por Riot ID; Esc ou envio feito fecham (`onDone`). */
export function AddFriend({ onDone }: { onDone?: () => void }) {
  const [value, setValue] = useState('');
  const id = parseRiotId(value);
  const input = useRef<HTMLInputElement>(null);
  // Aberto pelo botão da gaveta: já entra com o cursor no campo.
  useEffect(() => void (onDone && input.current?.focus()), []);
  const send = useAction(async () => {
    await request('POST', REQUESTS, { ...id!, direction: 'out' });
    setValue('');
    onDone?.();
  });
  return (
    <div class="rlc-add-friend">
      <input
        class="rlc-input"
        placeholder={t('addFriendHint')}
        aria-label={t('addFriendHint')}
        value={value}
        maxLength={40}
        ref={input}
        onInput={(e) => setValue(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && id && !send.pending) send.run();
          if (e.key === 'Escape') onDone?.();
        }}
      />
      <button type="button" class="rlc-button" data-variant="pill" disabled={!id || send.pending} onClick={() => send.run()}>
        {t('addFriend')}
      </button>
    </div>
  );
}

/** Disponibilidade (online, ausente, invisível) com o ponto da cor dela, e mensagem de status editável no lugar. */
export function StatusEditor({ lcu }: { lcu: Lcu }) {
  const me = lcu.chatMe.value.data;
  const [message, setMessage] = useState(me?.statusMessage ?? '');
  // Último texto enviado: Enter e a saída do campo não mandam o mesmo duas vezes.
  const sent = useRef<string | null>(null);
  useEffect(() => {
    setMessage(me?.statusMessage ?? '');
    sent.current = null;
  }, [me?.statusMessage]);
  const put = (body: Record<string, string>) => request('PUT', '/lol-chat/v1/me', body);
  const saveAvailability = useAction(put);
  const saveMessage = useAction(put);
  const availability = me?.availability === 'away' || me?.availability === 'offline' ? me.availability : 'chat';
  const commit = () => {
    const text = message.trim();
    if (text === (sent.current ?? me?.statusMessage ?? '')) return;
    sent.current = text;
    saveMessage.run({ statusMessage: text });
  };
  return (
    <div class="rlc-status">
      <label class="rlc-status-avail" data-avail={availability}>
        <i aria-hidden="true" />
        <select aria-label={t('statusOnline')} value={availability} onChange={(e) => saveAvailability.run({ availability: e.currentTarget.value })}>
          <option value="chat">{t('statusOnline')}</option>
          <option value="away">{t('statusAway')}</option>
          <option value="offline">{t('statusInvisible')}</option>
        </select>
      </label>
      <input
        class="rlc-status-msg"
        aria-label={t('statusMessage')}
        placeholder={t('statusMessage')}
        value={message}
        maxLength={100}
        onInput={(e) => setMessage(e.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit();
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            // Desiste: a saída do campo logo abaixo ainda vê o texto digitado, então ele conta como já resolvido.
            sent.current = message.trim();
            setMessage(me?.statusMessage ?? '');
            e.currentTarget.blur();
          }
        }}
      />
    </div>
  );
}
