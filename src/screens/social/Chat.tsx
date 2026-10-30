import { useEffect, useRef, useState } from 'preact/hooks';
import { locale, t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolChatConversationMessageResource } from '../../lcu/types';
import { playChatSound } from '../../shell/sound';
import { useAction } from '../../ui/useAction';
import { getJson } from '../profile/data';
import { profileIcon } from './FriendCard';

type Message = Pick<LolChatConversationMessageResource, 'id' | 'body' | 'fromPuuid' | 'timestamp' | 'type'> & Partial<Pick<LolChatConversationMessageResource, 'fromId' | 'fromObfuscatedPuuid'>>;
const base = (id: string) => `/lol-chat/v1/conversations/${encodeURIComponent(id)}/messages`;

/** Histórico da conversa e mensagens novas por evento (a URI do evento traz o id da mensagem). */
export function useConversation(lcu: Lcu, id: string | null): Message[] {
  const [messages, setMessages] = useState<Message[]>([]);
  useEffect(() => {
    setMessages([]);
    if (!id) return;
    let live = true;
    const add = (m: Message) => setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    // Leitura silenciosa: conversa que sumiu fica vazia, sem aviso de erro.
    void getJson<Message[]>(base(id)).then((list) => live && setMessages((prev) => [...(list ?? []), ...prev.filter((p) => !(list ?? []).some((l) => l.id === p.id))]));
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

/** Hora da mensagem; de outro dia leva dia e mês na frente (o histórico cobre semanas). */
export function messageTime(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hour = d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  return d.toDateString() === now.toDateString() ? hour : `${d.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit' })} ${hour}`;
}

/** Quem mandou: o puuid quando vem; na seleção ele pode vir vazio e só o ofuscado ou o id do chat identifica. */
export const authorKey = (m: Message) => m.fromPuuid || m.fromObfuscatedPuuid || m.fromId || '';

/**
 * Nome de quem mandou cada mensagem: amigos, participantes da sala (`/participants`, por puuid e id do chat)
 * e, para quem faltar, o Riot ID pelo puuid. Sem nome (seleção com nomes ocultos), "Jogador".
 */
export function useAuthors(lcu: Lcu, conversationId: string, messages: Message[]): (m: Message) => string {
  const [names, setNames] = useState<Record<string, string>>({});
  const asked = useRef(new Set<string>());
  const put = (k: string | undefined, n: string | null | undefined) => k && n && setNames((prev) => (prev[k] ? prev : { ...prev, [k]: n }));
  useEffect(() => {
    let live = true;
    void getJson<Array<{ id?: string; puuid?: string; gameName?: string }>>(`/lol-chat/v1/conversations/${encodeURIComponent(conversationId)}/participants`).then((list) => {
      if (!live) return;
      for (const p of list ?? []) {
        put(p.puuid, p.gameName);
        put(p.id, p.gameName);
      }
    });
    return () => void (live = false);
  }, [conversationId]);
  const friends = lcu.friends.value.data ?? [];
  const known = (m: Message) => friends.find((f) => (m.fromPuuid && f.puuid === m.fromPuuid) || (m.fromId && f.id === m.fromId))?.gameName || names[authorKey(m)] || (m.fromId ? names[m.fromId] : '') || '';
  useEffect(() => {
    for (const m of messages) {
      const puuid = m.fromPuuid;
      if (!puuid || m.type === 'system' || asked.current.has(puuid) || known(m)) continue;
      asked.current.add(puuid);
      void lcu.name(puuid).then((n) => put(puuid, n));
    }
  }, [messages, names]);
  return (m) => known(m) || t('socPlayer');
}

/** O que mandei por último em cada conversa: na seleção a minha mensagem pode voltar só com o puuid ofuscado. */
const sent = new Map<string, { body: string; at: number }>();
const SENT_ECHO_MS = 5000;

/**
 * Som de mensagem nova de outra pessoa em qualquer conversa (1:1 e salas), pelo evento de criação da LCU:
 * o histórico carregado ao abrir não vem como evento e as mensagens antigas trazem `isHistorical`.
 * Sem som na conversa que está à vista (`visibleId`) com a janela em foco.
 */
export function useChatSound(lcu: Lcu, visibleId: string | null): void {
  const visible = useRef(visibleId);
  visible.current = visibleId;
  useEffect(() => {
    const prefix = '/lol-chat/v1/conversations/';
    const heard = new Set<string>();
    return lcu.events.onPrefix(prefix, (uri, eventType, data) => {
      const [rawId, msgId] = uri.slice(prefix.length).split('/messages/');
      if (eventType !== 'Create' || !rawId || !msgId || !data || typeof data !== 'object') return;
      const m = data as Partial<LolChatConversationMessageResource>;
      const id = decodeURIComponent(rawId);
      // A LCU pode mandar o mesmo evento com o id cru e codificado.
      if (heard.has(`${id}/${m.id ?? msgId}`)) return;
      heard.add(`${id}/${m.id ?? msgId}`);
      if ((m.type !== 'chat' && m.type !== 'groupchat') || m.isHistorical) return;
      const me = lcu.chatMe.peek().data;
      if (me && ((m.fromPuuid && m.fromPuuid === me.puuid) || (m.fromId && m.fromId === me.id) || (m.fromPid && m.fromPid === me.pid))) return;
      const echo = sent.get(id);
      if (echo && echo.body === m.body && Date.now() - echo.at < SENT_ECHO_MS) return;
      if (id === visible.current && document.hasFocus()) return;
      playChatSound();
    });
  }, [lcu]);
}

/**
 * Conversas abertas na tela, a última por cima. A ativa na LCU é a que o client marca como lida (zera
 * `unreadMessageCount` e tira o aviso); sem nenhuma aberta, nenhuma fica ativa e as novas voltam a contar.
 */
const opened: string[] = [];
const ACTIVE = '/lol-chat/v1/conversations/active';
// Silencioso: conversa que sumiu não vira aviso de erro.
const setActive = (id?: string) => void fetch(ACTIVE, id ? { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) } : { method: 'DELETE' }).catch(() => {});
function useActiveConversation(id: string): void {
  useEffect(() => {
    opened.push(id);
    setActive(id);
    return () => {
      opened.splice(opened.lastIndexOf(id), 1);
      setActive(opened[opened.length - 1]);
    };
  }, [id]);
}

/** Avisos de entrada e saída da sala que a LCU grava como mensagem de sistema. */
const ROOM_NOISE = new Set(['joined_room', 'left_room']);

/** Mensagens e campo de envio. Mensagens de sistema em cinza; texto sempre como texto (links não abrem). */
export function ChatBody({ lcu, conversationId }: { lcu: Lcu; conversationId: string }) {
  const messages = useConversation(lcu, conversationId);
  useActiveConversation(conversationId);
  const me = lcu.chatMe.value.data?.puuid;
  const author = useAuthors(lcu, conversationId, messages);
  const shown = messages.filter((m) => !(m.type === 'system' && ROOM_NOISE.has(m.body)));
  const isChat = (m: Message | undefined) => m?.type === 'chat' || m?.type === 'groupchat';
  const [draft, setDraft] = useState('');
  const list = useRef<HTMLDivElement>(null);
  const send = useAction(async (body: string) => {
    sent.set(conversationId, { body, at: Date.now() });
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
        {shown.map((m, i) => {
          const mine = !!me && m.fromPuuid === me;
          // Mensagens seguidas da mesma pessoa ficam num grupo: o nome só na primeira.
          const first = isChat(m) && !(isChat(shown[i - 1]) && authorKey(shown[i - 1]!) === authorKey(m));
          return (
            <div key={m.id} class="rlc-chat-msg" data-mine={mine ? 'true' : undefined} data-system={isChat(m) ? undefined : 'true'} data-first={first ? 'true' : undefined}>
              {first ? <span class="rlc-chat-author">{mine ? t('socYou') : author(m)}</span> : null}
              <span class="rlc-chat-text">{m.body}</span>
              <small>{messageTime(m.timestamp)}</small>
            </div>
          );
        })}
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

/** Conversas 1:1 mais recentes primeiro (pela última mensagem); salas de lobby e seleção ficam de fora. */
export function recentConversations(lcu: Lcu): Array<{ id: string; title: string; preview: string; unread: number; muted?: boolean; icon?: number }> {
  const friends = lcu.friends.value.data ?? [];
  return (lcu.conversations.value.data ?? [])
    .filter((c) => c.type === 'chat')
    .sort((a, b) => (b.lastMessage?.timestamp ?? '').localeCompare(a.lastMessage?.timestamp ?? ''))
    .map((c) => ({ id: c.id, title: conversationTitle(lcu, c.id), preview: c.lastMessage?.body ?? '', unread: c.unreadMessageCount ?? 0, muted: c.isMuted, icon: friends.find((f) => f.id === c.id)?.icon }));
}

/** Tira a conversa da lista, como o X do client (`closeConversation`): `DELETE /lol-chat/v1/conversations/{id}`. */
export const removeConversation = (id: string) => request('DELETE', `/lol-chat/v1/conversations/${encodeURIComponent(id)}`);

/**
 * Chat como no client: sobe do canto inferior direito com as conversas recentes à esquerda e a conversa aberta à direita.
 * Abre pelo botão de chat no pé da faixa de amigos ou ao clicar num amigo. Fechar a conversa fecha o chat todo.
 * Clicar na conversa aberta só a fecha (fica na lista); o X ao lado tira da lista. Como no client, o X não aparece
 * com mensagem não lida (a menos que a conversa esteja silenciada). O X do canto fica sempre, com ou sem conversa aberta,
 * e clicar fora do chat o esconde (a coluna de amigos não conta: dali se abre conversa e alterna o chat).
 */
export function ChatDock({ lcu, open, active, onActivate, onClose }: { lcu: Lcu; open: boolean; active: string | null; onActivate: (id: string | null) => void; onClose: () => void }) {
  const list = recentConversations(lcu);
  useChatSound(lcu, open ? active : null);
  // Conversa recém-criada ainda pode não ter chegado na lista da LCU: entra no topo para aparecer selecionada.
  if (active && !list.some((c) => c.id === active)) list.unshift({ id: active, title: conversationTitle(lcu, active), preview: '', unread: 0 });
  const dock = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (el && !dock.current?.contains(el) && !el.closest?.('.rlc-rc')) close.current();
    };
    document.addEventListener('pointerdown', outside, true);
    return () => document.removeEventListener('pointerdown', outside, true);
  }, [open]);
  return (
    <section ref={dock} class="rlc-chat-dock" data-open={open ? 'true' : undefined} aria-hidden={open ? undefined : 'true'} aria-label={t('chatRecent')}>
      <div class="rlc-chat-list">
        <header>
          <strong>{t('chatRecent')}</strong>
        </header>
        <div class="rlc-chat-items">
          {list.length ? (
            list.map((c) => (
              <div key={c.id} class="rlc-chat-row">
                <button type="button" class="rlc-chat-item" aria-pressed={c.id === active} data-unread={c.unread > 0 && c.id !== active ? 'true' : undefined} onClick={() => onActivate(c.id === active ? null : c.id)}>
                  <span class="rlc-rc-avatar" data-group="none">{c.icon ? <img src={profileIcon(c.icon)} alt="" /> : null}</span>
                  <span class="rlc-chat-item-text">
                    <b>{c.title}</b>
                    <small>{c.preview}</small>
                  </span>
                </button>
                {c.muted || !c.unread ? (
                  <button
                    type="button"
                    class="rlc-chat-remove"
                    aria-label={`${t('chatRemove')}: ${c.title}`}
                    title={t('chatRemove')}
                    onClick={() => {
                      if (c.id === active) onActivate(null);
                      void removeConversation(c.id).catch((e) => console.error('[rlc]', e));
                    }}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <p class="rlc-muted rlc-chat-empty">{t('chatNoConversations')}</p>
          )}
        </div>
      </div>
      {open && active ? (
        <ChatWindow key={active} lcu={lcu} conversationId={active} title={conversationTitle(lcu, active)} onClose={onClose} />
      ) : (
        <section class="rlc-chat-window" aria-label={t('chatPick')}>
          <header>
            <strong />
            <button type="button" class="rlc-winbtn" aria-label={t('closeChat')} onClick={onClose}>
              ✕
            </button>
          </header>
          <p class="rlc-muted rlc-chat-pick">{t('chatPick')}</p>
        </section>
      )}
    </section>
  );
}
