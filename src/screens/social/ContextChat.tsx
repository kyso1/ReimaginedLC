import { useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { ChatBody } from './Chat';

/**
 * Chat da sala (lobby, seleção de campeões, pós-jogo): painel recolhível no canto inferior esquerdo.
 * A conversa é a que começa com o `multiUserChatId` da sala.
 */
export function ContextChat({ lcu, roomId, defaultOpen }: { lcu: Lcu; roomId: string | null | undefined; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const conversation = roomId ? lcu.conversations.value.data?.find((c) => c.id.startsWith(roomId)) : undefined;
  if (!conversation) return null;
  const unread = conversation.unreadMessageCount ?? 0;
  return (
    <section class="rlc-ctx" data-open={open ? 'true' : undefined}>
      <button type="button" class="rlc-ctx-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        {t('roomChat')}
        {!open && unread > 0 ? <span class="rlc-ctx-count">{unread}</span> : null}
      </button>
      {open ? <ChatBody lcu={lcu} conversationId={conversation.id} /> : null}
    </section>
  );
}
