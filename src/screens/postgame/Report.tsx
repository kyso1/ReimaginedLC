import { createPortal } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import { MemberMenu } from '../lobby/MemberMenu';
import { openProfile } from '../../shell/nav';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { getJson } from '../profile/data';

/** Jogador da partida que pode receber ações no fim de jogo. */
export interface EogTarget {
  puuid: string;
  summonerId: number;
  name: string;
}

/** Seções e categorias de denúncia, as mesmas do client (rcp-fe-lol-shared-components: DEFAULT/TFT_CATEGORY_SECTIONS). */
const SECTIONS: Record<'lol' | 'tft', Array<[TextKey, string[]]>> = {
  lol: [
    ['rpPlayToWin', ['LEAVING_AFK', 'ASSISTING_ENEMY_TEAM']],
    ['rpPlayFair', ['THIRD_PARTY_TOOLS', 'RANK_MANIPULATION', 'BOTTING']],
    ['rpRespect', ['VERBAL_ABUSE', 'INAPPROPRIATE_NAME']],
  ],
  tft: [
    ['rpPlayFair', ['THIRD_PARTY_TOOLS', 'RANK_MANIPULATION', 'BOTTING']],
    ['rpRespect', ['VERBAL_ABUSE', 'INAPPROPRIATE_NAME']],
  ],
};
const CATEGORY: Record<string, TextKey> = {
  LEAVING_AFK: 'rpAfk',
  ASSISTING_ENEMY_TEAM: 'rpAssisting',
  THIRD_PARTY_TOOLS: 'rpTools',
  RANK_MANIPULATION: 'rpRank',
  BOTTING: 'rpBotting',
  VERBAL_ABUSE: 'rpVerbal',
  INAPPROPRIATE_NAME: 'rpName',
};
const COMMENT_MAX = 500;

/** Onde a denúncia é feita: o client usa o mesmo corpo e muda só o caminho. */
export const REPORT_PATHS = {
  endOfGame: '/lol-player-report-sender/v1/end-of-game-reports',
  history: '/lol-player-report-sender/v1/match-history-reports',
} as const;
/** Pelo histórico, só até 5 dias depois da partida (a mesma janela do client). */
export const HISTORY_REPORT_WINDOW_MS = 432e6;
export const canReportFromHistory = (gameCreation: number, now = Date.now()) => gameCreation > 0 && now - gameCreation <= HISTORY_REPORT_WINDOW_MS;

/** Corpo da denúncia, como o client manda (`reportPlayer` do modal da Riot). */
export const reportBody = (gameId: number, target: EogTarget, categories: string[], comment: string) => ({
  comment: comment.trim(),
  gameId,
  categories,
  offenderSummonerId: target.summonerId,
  offenderPuuid: target.puuid,
});

/** Quem já foi denunciado nesta partida (a LCU guarda por partida). A lista pode vir com puuids ou objetos. */
export function useReported(gameId: number | undefined): [Set<string>, (puuid: string) => void] {
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!gameId) return;
    let live = true;
    void getJson<unknown[]>(`/lol-player-report-sender/v1/reported-players/gameId/${gameId}`).then((list) => {
      const ids = (list ?? []).map((x) => (typeof x === 'string' ? x : ((x as { puuid?: string; offenderPuuid?: string })?.puuid ?? (x as { offenderPuuid?: string })?.offenderPuuid ?? ''))).filter(Boolean);
      if (live) setDone(new Set(ids));
    });
    return () => void (live = false);
  }, [gameId]);
  return [done, (puuid) => setDone((s) => new Set(s).add(puuid))];
}

/** Janela de denúncia: categorias por seção (ao menos uma), comentário opcional e Enviar. */
export function ReportDialog({ gameId, target, game, from = 'endOfGame', onSent, onClose }: { gameId: number; target: EogTarget; game: 'lol' | 'tft'; from?: keyof typeof REPORT_PATHS; onSent: () => void; onClose: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  useEscape(onClose);
  const send = useAction(async () => {
    await request('POST', REPORT_PATHS[from], reportBody(gameId, target, picked, comment));
    window.Toast?.success(t('rpSent'));
    onSent();
  });
  const toggle = (c: string) => setPicked(picked.includes(c) ? picked.filter((x) => x !== c) : [...picked, c]);
  // Na raiz: dentro de uma tela com transform (o detalhe do histórico) o véu ficaria preso a ela.
  const root = document.getElementById('rlc-root');
  const body = (
    <div class="rlc-veil" role="dialog" aria-modal="true" aria-label={`${t('rpTitle')}: ${target.name}`}>
      <div class="rlc-dialog rlc-rp">
        <h2>
          {t('rpTitle')} <span>{target.name}</span>
        </h2>
        {SECTIONS[game].map(([head, ids]) => (
          <fieldset key={head} class="rlc-rp-section">
            <legend>{t(head)}</legend>
            {ids.map((c) => (
              <label key={c} class="rlc-rp-option">
                <input type="checkbox" checked={picked.includes(c)} onChange={() => toggle(c)} />
                <span>{t(CATEGORY[c]!)}</span>
              </label>
            ))}
          </fieldset>
        ))}
        <textarea class="rlc-input rlc-rp-comment" placeholder={t('rpComment')} aria-label={t('rpComment')} maxLength={COMMENT_MAX} value={comment} onInput={(e) => setComment(e.currentTarget.value)} />
        <div class="rlc-dialog-actions">
          <button type="button" class="rlc-button" data-variant="danger" disabled={!picked.length || send.pending} onClick={() => send.run()}>
            {t('rpSend')}
          </button>
          <button type="button" class="rlc-button" onClick={onClose}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
  return root ? createPortal(body, root) : body;
}

/**
 * Menu ⋯ de um jogador da partida (fim de jogo e histórico): ver perfil, convidar, adicionar como amigo e denunciar.
 * `invite`: no fim de jogo, o convite da próxima partida; no histórico, para o meu lobby (só com lobby aberto).
 * `onReport` ausente: a denúncia não vale mais (já feita, ou fora da janela do histórico).
 */
export function PlayerMenu({ lcu, target, invite, onReport }: { lcu: Lcu; target: EogTarget; invite: 'endOfGame' | 'lobby' | null; onReport?: () => void }) {
  const friend = (lcu.friends.value.data ?? []).some((f) => f.puuid === target.puuid);
  const inviteEog = useAction(() => request('POST', '/lol-lobby/v2/eog-invitations', [{ toSummonerId: target.summonerId }]).then(() => window.Toast?.success(t('pgInvited'))));
  const inviteLobby = useAction(() => request('POST', '/lol-lobby/v2/lobby/invitations', [{ toSummonerId: target.summonerId }]).then(() => window.Toast?.success(t('pgInvited'))));
  const add = useAction(() => request('POST', '/lol-chat/v2/friend-requests', { direction: 'out', puuid: target.puuid }).then(() => window.Toast?.success(t('pgFriendSent'))));
  const canInvite = !!target.summonerId && (invite === 'endOfGame' || (invite === 'lobby' && !!lcu.lobby.value.data));
  return (
    <MemberMenu
      floating
      items={[
        { label: t('viewProfile'), run: () => openProfile(target.puuid) },
        ...(canInvite ? [{ label: t(invite === 'lobby' ? 'inviteToLobby' : 'pgInvite'), run: () => (invite === 'lobby' ? inviteLobby : inviteEog).run() }] : []),
        ...(friend ? [] : [{ label: t('addFriend'), run: () => add.run() }]),
        // Já denunciado nesta partida (a LCU recusa outra) ou fora da janela: a opção some.
        ...(onReport ? [{ label: t('rpTitle'), run: onReport }] : []),
      ]}
    />
  );
}
