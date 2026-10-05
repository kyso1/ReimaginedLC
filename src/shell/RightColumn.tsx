import type { ComponentChildren } from 'preact';
import { locale, t, type TextKey } from '../i18n';
import type { Lcu } from '../lcu';
import type { LolChatFriendResource } from '../lcu/types';

export const profileIcon = (id: number | undefined) => (id ? `/lol-game-data/assets/v1/profile-icons/${id}.jpg` : '');

type Friend = LolChatFriendResource;
type Group = 'playing' | 'online' | 'away' | 'offline';
const GROUP_KEY: Record<Group, TextKey> = { playing: 'groupPlaying', online: 'groupOnline', away: 'groupAway', offline: 'groupOffline' };
const ORDER: Group[] = ['playing', 'online', 'away', 'offline'];

/** `dnd` é "em jogo / em fila" no chat da Riot; `mobile` conta como offline (não pode jogar). */
export function groupOf(f: Friend): Group {
  if (f.availability === 'dnd') return 'playing';
  if (f.availability === 'chat') return 'online';
  if (f.availability === 'away') return 'away';
  return 'offline';
}

export const friendName = (f: Pick<Friend, 'gameName' | 'name'>) => f.gameName || f.name || '';

interface Props {
  lcu: Lcu;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** Conteúdo extra por amigo (menu, conversa) da fase social. */
  onFriend?: (f: Friend) => void;
  /** Bloco acima da lista (pedidos de amizade, adicionar amigo). */
  header?: ComponentChildren;
}

/**
 * Coluna da direita no estilo do client atual: fina e fixa com o meu ícone e os amigos online;
 * ao passar o mouse (ou ao abrir uma conversa) expande por cima da tela com perfil e a lista completa.
 */
export function RightColumn({ lcu, open, onOpen, onClose, onFriend, header }: Props) {
  const me = lcu.chatMe.value.data;
  const friends = [...(lcu.friends.value.data ?? [])].sort((a, b) => ORDER.indexOf(groupOf(a)) - ORDER.indexOf(groupOf(b)) || friendName(a).localeCompare(friendName(b)));
  const visible = friends.filter((f) => groupOf(f) !== 'offline');
  return (
    <aside class="rlc-rc" data-open={open ? 'true' : undefined} onMouseEnter={onOpen} onMouseLeave={onClose}>
      <div class="rlc-rc-strip">
        <div class="rlc-rc-me">{me?.icon ? <img src={profileIcon(me.icon)} alt="" /> : null}</div>
        <div class="rlc-rc-sep" />
        {visible.map((f) => (
          <button type="button" key={f.puuid || f.id} class="rlc-rc-avatar" data-group={groupOf(f)} aria-label={friendName(f)} title={friendName(f)} onClick={() => onFriend?.(f)}>
            {f.icon ? <img src={profileIcon(f.icon)} alt="" /> : null}
          </button>
        ))}
      </div>
      {open ? (
        <div class="rlc-rc-panel">
          <div class="rlc-rc-profile">
            <div class="rlc-rc-me">{me?.icon ? <img src={profileIcon(me.icon)} alt="" /> : null}</div>
            <div class="rlc-rc-who">
              <strong>{me?.gameName ?? ''}</strong>
              <small>
                {t(availabilityKey(me?.availability))}
                {me?.lol?.level ? ` · ${t('level')} ${me.lol.level}` : ''}
              </small>
            </div>
          </div>
          {header}
          {ORDER.map((g) => {
            const list = friends.filter((f) => groupOf(f) === g);
            if (!list.length) return null;
            return (
              <details key={g} class="rlc-rc-group" open={g !== 'offline'}>
                <summary class="rlc-rc-group-title">{`${t(GROUP_KEY[g])} (${list.length})`}</summary>
                {g === 'offline'
                  ? null
                  : list.map((f) => (
                      <button type="button" key={f.puuid || f.id} class="rlc-rc-friend" data-group={g} onClick={() => onFriend?.(f)}>
                        <span class="rlc-rc-avatar" data-group={g}>
                          {f.icon ? <img src={profileIcon(f.icon)} alt="" /> : null}
                        </span>
                        <span class="rlc-rc-fname">{friendName(f)}</span>
                        <small>{g === 'playing' ? queueLabel(f) : f.statusMessage}</small>
                      </button>
                    ))}
              </details>
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}

const availabilityKey = (a: string | undefined): TextKey => (a === 'away' ? 'statusAway' : a === 'offline' ? 'statusInvisible' : 'statusOnline');
const queueLabel = (f: Friend) => {
  const q = f.lol?.gameQueueType ?? '';
  if (/RANKED/.test(q)) return t('inRanked');
  if (/ARAM/.test(q)) return 'ARAM';
  if (/TFT/.test(q) || /TFT/.test(f.lol?.gameMode ?? '')) return 'TFT';
  return t('inGame');
};

/** Chip de moedas no topo, à esquerda da coluna da direita. */
export function CurrencyChip({ lcu }: { lcu: Lcu }) {
  const wallet = lcu.wallet.value.data ?? {};
  const orange = lcu.orangeEssence.value.data?.count;
  const num = new Intl.NumberFormat(locale());
  const items: Array<[string, number | undefined, TextKey]> = [
    ['be', wallet.lol_blue_essence, 'blueEssence'],
    ['rp', wallet.RP, 'riotPoints'],
    ['oe', orange, 'orangeEssence'],
  ];
  const shown = items.filter(([, v]) => typeof v === 'number');
  if (!shown.length) return null;
  return (
    <div class="rlc-currency">
      {shown.map(([id, v, key]) => (
        <span key={id} class="rlc-cur" data-cur={id} title={t(key)}>
          {num.format(v!)}
        </span>
      ))}
    </div>
  );
}
