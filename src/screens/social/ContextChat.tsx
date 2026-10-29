import { signal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import { ChatBody } from './Chat';

/** Credenciais da sala, como lobby, seleção e pós-jogo as mandam. */
export interface RoomJoin {
  type: 'customGame' | 'championSelect' | 'postGame';
  password: string;
  mucJwtDto: { targetRegion?: string } & Record<string, unknown>;
}

/** Salas que o usuário recolheu à mão: continuam recolhidas se o chat sair e voltar (ir ao perfil e voltar). */
const collapsed = new Set<string>();
/** Chat da sala aberto e à vista: o lobby sobe o nome da primeira vaga só enquanto ele ocupa o canto (lobby.css). */
export const roomChatOpen = signal(false);
/** Duração da animação de fechar (a mesma do CSS de `.rlc-ctx`). */
const CLOSE_MS = 340;

/**
 * Chat da sala (lobby, seleção de campeões, pós-jogo): painel no canto inferior esquerdo, aberto em cada sala nova.
 * A conversa é a que começa com o `multiUserChatId` da sala. Quem entra na sala é a tela da Riot; escondida,
 * às vezes ela não entra (lobby aberto por nós), então com `join` entramos uma vez.
 */
export function ContextChat({ lcu, roomId, join, hidden = false }: { lcu: Lcu; roomId: string | null | undefined; join?: RoomJoin; hidden?: boolean }) {
  const [open, setOpen] = useState(() => !roomId || !collapsed.has(roomId));
  // A conversa continua montada enquanto o painel encolhe, para a animação de fechar não esvaziar de uma vez.
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (!closing) return;
    const id = setTimeout(() => setClosing(false), CLOSE_MS);
    return () => clearTimeout(id);
  }, [closing]);
  const toggle = () => {
    if (roomId && open) collapsed.add(roomId);
    else if (roomId) collapsed.delete(roomId);
    setClosing(open);
    setOpen(!open);
  };
  const conversation = roomId ? lcu.conversations.value.data?.find((c) => c.id.startsWith(roomId)) : undefined;
  const missing = !!roomId && !!join?.password && lcu.conversations.value.status === 'ready' && !conversation;
  useEffect(() => {
    if (!missing) return;
    void request('POST', '/lol-chat/v1/conversations', { id: roomId, type: join!.type, password: join!.password, mucJwtDto: join!.mucJwtDto, targetRegion: join!.mucJwtDto.targetRegion })
      .then(() => lcu.conversations.refresh())
      .catch(() => {});
  }, [missing, roomId]);
  const shown = !!conversation && open && !hidden;
  useEffect(() => {
    roomChatOpen.value = shown;
    return () => void (roomChatOpen.value = false);
  }, [shown]);
  if (!conversation) return null;
  const unread = conversation.unreadMessageCount ?? 0;
  return (
    <section class="rlc-ctx" data-open={open ? 'true' : undefined} data-hidden={hidden ? 'true' : undefined} aria-hidden={hidden ? 'true' : undefined}>
      <button type="button" class="rlc-ctx-toggle" aria-expanded={open} onClick={toggle}>
        {t('roomChat')}
        {!open && unread > 0 ? <span class="rlc-ctx-count">{unread}</span> : null}
        <span class="rlc-ctx-caret" aria-hidden="true" />
      </button>
      {open || closing ? <ChatBody lcu={lcu} conversationId={conversation.id} /> : null}
    </section>
  );
}
