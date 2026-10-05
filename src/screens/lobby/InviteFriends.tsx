import { useState } from 'preact/hooks';
import { t } from '../../i18n';
import { request } from '../../lcu/request';
import type { LolChatFriendResource } from '../../lcu/types';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';

const UNAVAILABLE = new Set(['offline', 'mobile']);

/** Amigos online que não estão no lobby. Escolher um envia o convite e fecha. */
export function InviteFriends({ friends, exclude, onClose }: { friends: LolChatFriendResource[]; exclude: Set<string>; onClose: () => void }) {
  const [query, setQuery] = useState('');
  useEscape(onClose);
  const invite = useAction(async (summonerId: number) => {
    await request('POST', '/lol-lobby/v2/lobby/invitations', [{ toSummonerId: summonerId }]);
    onClose();
  });
  const q = query.trim().toLowerCase();
  const list = friends
    .filter((f) => !UNAVAILABLE.has(f.availability) && !exclude.has(f.puuid))
    .filter((f) => !q || f.gameName.toLowerCase().includes(q))
    .sort((a, b) => a.gameName.localeCompare(b.gameName));
  return (
    <div class="rlc-veil" role="dialog" aria-modal="true" aria-label={t('invite')}>
      <div class="rlc-dialog rlc-invite-friends">
        <input type="search" class="rlc-input" placeholder={t('searchFriends')} aria-label={t('searchFriends')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
        <div class="rlc-friend-list">
          {list.length === 0 ? <p class="rlc-muted">{t('noFriendsOnline')}</p> : null}
          {list.map((f) => (
            <button type="button" key={f.puuid} class="rlc-friend" disabled={invite.pending} onClick={() => invite.run(f.summonerId)}>
              {f.gameName}
            </button>
          ))}
        </div>
        <div class="rlc-dialog-actions">
          <button type="button" class="rlc-button" onClick={onClose}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
