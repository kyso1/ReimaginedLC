import { useEffect, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import { MemberMenu } from '../lobby/MemberMenu';
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
export function ReportDialog({ gameId, target, game, onSent, onClose }: { gameId: number; target: EogTarget; game: 'lol' | 'tft'; onSent: () => void; onClose: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  useEscape(onClose);
  const send = useAction(async () => {
    await request('POST', '/lol-player-report-sender/v1/end-of-game-reports', reportBody(gameId, target, picked, comment));
    window.Toast?.success(t('rpSent'));
    onSent();
  });
  const toggle = (c: string) => setPicked(picked.includes(c) ? picked.filter((x) => x !== c) : [...picked, c]);
  return (
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
}

/** Menu ⋯ de um jogador no fim de jogo: convidar para a próxima, adicionar como amigo e denunciar. */
export function EogPlayerMenu({ lcu, target, reported, onReport }: { lcu: Lcu; target: EogTarget; reported: boolean; onReport: () => void }) {
  const friend = (lcu.friends.value.data ?? []).some((f) => f.puuid === target.puuid);
  const invite = useAction(() => request('POST', '/lol-lobby/v2/eog-invitations', [{ toSummonerId: target.summonerId }]).then(() => window.Toast?.success(t('pgInvited'))));
  const add = useAction(() => request('POST', '/lol-chat/v2/friend-requests', { direction: 'out', puuid: target.puuid }).then(() => window.Toast?.success(t('pgFriendSent'))));
  return (
    <MemberMenu
      items={[
        ...(target.summonerId ? [{ label: t('pgInvite'), run: () => invite.run() }] : []),
        ...(friend ? [] : [{ label: t('addFriend'), run: () => add.run() }]),
        // Já denunciado nesta partida: a LCU recusa outra denúncia, então a opção some.
        ...(reported ? [] : [{ label: t('rpTitle'), run: onReport }]),
      ]}
    />
  );
}
