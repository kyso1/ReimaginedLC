import { useEffect, useRef, useState } from 'preact/hooks';
import { locale, t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolChatConversationMessageResource } from '../../lcu/types';
import { useAction } from '../../ui/useAction';

type Message = Pick<LolChatConversationMessageResource, 'id' | 'body' | 'fromPuuid' | 'timestamp' | 'type'>;
const base = (id: string) => `/lol-chat/v1/conversations/${encodeURIComponent(id)}/messages`;

/** Histórico da conversa e mensagens novas por evento (a URI do evento traz o id da mensagem). */
export function useConversation(lcu: Lcu, id: string | null): Message[] {
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    setMessages([]);
    if (!id) return;
    let live = true;
    const add = (m: Message) => setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    void request<Message[]>('GET', base(id))
      .then((list) => live && setMessages((prev) => [...(list ?? []), ...prev.filter((p) => !(list ?? []).some((l) => l.id === p.id))]))
      .catch(() => {});
    // A LCU pode mandar a URI com o id cru ou codificado; escuta as duas formas.
    const prefixes = [`/lol-chat/v1/conversations/${id}/messages/`, `${base(id)}/`];
    const offs = [...new Set(prefixes)].map((p) =>
      lcu.events.onPrefix(p, (_uri, eventType, data) => {
        if (live && eventType === 'Create' && data && typeof data === 'object') add(data as Message);
      }),
    );
    return () => {
      live = false;
      offs.forEach((off) => off());
    };
  }, [id, lcu]);
  return messages;
}

const time = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
};

/** Mensagens e campo de envio. Mensagens de sistema em cinza; texto sempre como texto (links não abrem). */
export function ChatBody({ lcu, conversationId }: { lcu: Lcu; conversationId: string }) {
  const messages = useConversation(lcu, conversationId);
  const me = lcu.chatMe.value.data?.puuid;
  const [draft, setDraft] = useState('');
  const list = useRef<HTMLDivElement>(null);
  const send = useAction(async (body: string) => {
    await request('POST', base(conversationId), { body, type: 'chat' });
    setDraft('');
  });
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);
  return (
    <div class="rlc-chat-body">
      <div class="rlc-chat-msgs" ref={list}>
        {messages.map((m) => (
          <div key={m.id} class="rlc-chat-msg" data-mine={m.fromPuuid === me ? 'true' : undefined} data-system={m.type !== 'chat' && m.type !== 'groupchat' ? 'true' : undefined}>
            <span class="rlc-chat-text">{m.body}</span>
            <small>{time(m.timestamp)}</small>
          </div>
        ))}
      </div>
      <input
        class="rlc-input rlc-chat-input"
        placeholder={t('typeMessage')}
        aria-label={t('typeMessage')}
        value={draft}
        maxLength={500}
        onInput={(e) => setDraft(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && draft.trim() && !send.pending) send.run(draft.trim());
          if (e.key === 'Escape') e.currentTarget.blur();
        }}
      />
    </div>
  );
}

/** Janela de uma conversa 1:1, aberta acima da aba dela. */
export function ChatWindow({ lcu, conversationId, title, onClose }: { lcu: Lcu; conversationId: string; title: string; onClose: () => void }) {
  return (
    <section class="rlc-chat-window" aria-label={title}>
      <header>
        <strong>{title}</strong>
        <button type="button" class="rlc-winbtn" aria-label={t('closeChat')} onClick={onClose}>
          ✕
        </button>
      </header>
      <ChatBody lcu={lcu} conversationId={conversationId} />
    </section>
  );
}

export const conversationTitle = (lcu: Lcu, id: string) => {
  const c = lcu.conversations.value.data?.find((x) => x.id === id);
  const f = lcu.friends.value.data?.find((x) => x.id === id);
  return c?.gameName || f?.gameName || c?.name || id.split('@')[0] || '';
};

/** Abas das conversas abertas na base da tela; uma janela à vista por vez. */
export function ChatTabs({ lcu, open, active, onActivate, onClose }: { lcu: Lcu; open: string[]; active: string | null; onActivate: (id: string) => void; onClose: (id: string) => void }) {
  if (!open.length) return null;
  const unread = (id: string) => (lcu.conversations.value.data?.find((c) => c.id === id)?.unreadMessageCount ?? 0) > 0;
  return (
    <div class="rlc-chat-tabs" role="tablist">
      {open.map((id) => (
        <div key={id} class="rlc-chat-tab" role="tab" aria-selected={id === active} data-unread={id !== active && unread(id) ? 'true' : undefined}>
          <button type="button" class="rlc-chat-tab-name" onClick={() => onActivate(id)}>
            {conversationTitle(lcu, id)}
          </button>
          <button type="button" class="rlc-chat-tab-close" aria-label={t('closeChat')} title={t('closeChat')} onClick={() => onClose(id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
