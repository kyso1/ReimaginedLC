import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { t, type TextKey } from '../i18n';
import type { Lcu } from '../lcu';
import type { LolChatGroupResource } from '../lcu/types';
import { activityLine, FriendCard, friendName, isActive, PRESENCE_ORDER, presenceOf, profileIcon, type Friend } from '../screens/social/FriendCard';
import { AddFriend, Folder, FriendRequests, StatusEditor } from '../screens/social/FriendTools';
import { getJson } from '../screens/profile/data';
import { useDecoded } from '../ui/useDecoded';
import { prefs, setPrefs } from './prefs';

export { friendName, presenceOf, profileIcon, type Presence } from '../screens/social/FriendCard';

const byPresence = (a: Friend, b: Friend) => PRESENCE_ORDER.indexOf(presenceOf(a)) - PRESENCE_ORDER.indexOf(presenceOf(b)) || friendName(a).localeCompare(friendName(b));
/** A pasta padrão vem como `**Default`. */
const groupLabel = (g: Pick<LolChatGroupResource, 'name'>) => (g.name === '**Default' ? t('groupGeneral') : g.name);
const availabilityKey = (a: string | undefined): TextKey => (a === 'away' ? 'statusAway' : a === 'offline' ? 'statusInvisible' : a === 'dnd' ? 'groupPlaying' : 'statusOnline');
/** Altura reservada ao cartão para não sair por baixo da janela. */
const CARD_ROOM = 240;

const MY_PROFILE = '/lol-summoner/v1/current-summoner/summoner-profile';

/**
 * Splash do fundo do meu perfil (a mesma do Perfil), para o cabeçalho da gaveta. Lê de novo a cada vez que a gaveta abre
 * e pelo evento do perfil, porque `lcu.profile` guarda o perfil da sessão e não vê a troca de fundo.
 */
function useMySplash(lcu: Lcu, open: boolean): string | null {
  const [skin, setSkin] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    let live = true;
    void getJson<{ backgroundSkinId?: number }>(MY_PROFILE).then((p) => live && p && setSkin(p.backgroundSkinId ?? 0));
    const off = lcu.events.onPrefix(MY_PROFILE, (_u, _t, data) => {
      const id = (data as { backgroundSkinId?: unknown } | null)?.backgroundSkinId;
      if (typeof id === 'number') setSkin(id);
    });
    return () => {
      live = false;
      off();
    };
  }, [lcu, open]);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (skin === null) return;
    let live = true;
    void lcu.game.splash(skin || undefined).then((u) => live && setUrl(u));
    return () => void (live = false);
  }, [lcu, skin]);
  return useDecoded(url);
}

interface Props {
  lcu: Lcu;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  /** Conversa com o amigo. */
  onFriend?: (f: Friend) => void;
  /** Meu ícone ou nome: abre o meu perfil. */
  onProfile?: () => void;
  /** Menu ⋯ por amigo. */
  menuFor?: (f: Friend) => ComponentChildren;
  /** Botão de chat no pé da faixa: abre as conversas recentes. Com o chat aberto, passar o mouse não abre a gaveta. */
  chatOpen?: boolean;
  chatUnread?: number;
  onChat?: () => void;
}

/**
 * Coluna da direita no estilo do client: fina e fixa com o meu ícone e os amigos que podem jogar;
 * ao passar o mouse expande para a esquerda com perfil, status e todos os amigos nas pastas do client.
 * Cada linha é [rótulos | célula de 56 px]: a célula fica no mesmo lugar aberta ou fechada, a gaveta só revela os rótulos.
 * O alfinete no cabeçalho fixa a gaveta aberta (pref `socialPinned`); o App então reserva a largura dela.
 */
export function RightColumn({ lcu, open: wanted, onOpen, onClose, onFriend, onProfile, menuFor, chatOpen = false, chatUnread = 0, onChat }: Props) {
  // Na seleção de campeões a faixa não abre (nem fixa): o mouse passa por ela a caminho do chat e dos campeões.
  const champ = lcu.gameflowPhase.value.data === 'ChampSelect';
  // Fixa: aberta sempre, ao lado das telas; o chat abre à esquerda dela.
  const pinned = prefs.value.socialPinned && !champ;
  // Solta, com o chat aberto a gaveta fica fechada: as duas disputariam o mesmo canto.
  const locked = champ || (chatOpen && !pinned);
  const open = pinned || (wanted && !locked);
  const me = lcu.chatMe.value.data;
  const friends = [...((lcu.friends.value.data ?? []) as Friend[])].sort(byPresence);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [hover, setHover] = useState<{ friend: Friend; top: number } | null>(null);
  const aside = useRef<HTMLElement>(null);
  const showCard = (f: Friend, row: HTMLElement) => {
    const box = aside.current!.getBoundingClientRect();
    const top = row.getBoundingClientRect().top - box.top;
    setHover({ friend: f, top: Math.max(8, Math.min(top, box.height - CARD_ROOM)) });
  };
  const hovered = hover && open ? friends.find((f) => f.id === hover.friend.id) : undefined;
  const banner = useMySplash(lcu, open);
  const avatar = (f: Friend) => (f.icon ? <img src={profileIcon(f.icon)} alt="" /> : null);
  return (
    <aside
      ref={aside}
      class="rlc-rc"
      data-open={open ? 'true' : undefined}
      data-pinned={pinned ? 'true' : undefined}
      onMouseEnter={() => !locked && !pinned && onOpen()}
      onMouseLeave={() => {
        setHover(null);
        onClose();
      }}
    >
      <div class="rlc-rc-drawer">
        <div class="rlc-rc-inner">
          <div class="rlc-rc-row rlc-rc-me-row">
            {banner ? <div class="rlc-rc-banner" aria-hidden="true" style={{ backgroundImage: `url("${banner}")` }} /> : null}
            <div class="rlc-rc-label">
              <div class="rlc-rc-head">
                <button type="button" class="rlc-rc-name" onClick={onProfile}>
                  {me?.gameName ?? ''}
                  {me?.gameTag ? <small>#{me.gameTag}</small> : null}
                </button>
                <button type="button" class="rlc-rc-pin" aria-label={t('socialPin')} title={t('socialPin')} aria-pressed={prefs.value.socialPinned} onClick={() => setPrefs({ socialPinned: !prefs.value.socialPinned })}>
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path d="M9 3.5h6M10 3.5v5.2L6.8 12v1.8h10.4V12L14 8.7V3.5M12 13.8v6.7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
              <StatusEditor lcu={lcu} />
            </div>
            <button type="button" class="rlc-rc-cell rlc-rc-me" data-avail={me?.availability} aria-label={t('viewProfile')} title={`${me?.gameName ?? ''} · ${t(availabilityKey(me?.availability))}`} onClick={onProfile}>
              {me?.icon ? <img src={profileIcon(me.icon)} alt="" /> : null}
            </button>
          </div>
          <div class="rlc-rc-row rlc-rc-tools">
            <div class="rlc-rc-label">
              {adding ? (
                <AddFriend onDone={() => setAdding(false)} />
              ) : (
                <input type="search" class="rlc-input rlc-rc-search" placeholder={t('searchFriendsList')} aria-label={t('searchFriendsList')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
              )}
            </div>
            <button type="button" class="rlc-rc-cell rlc-rc-tool" aria-label={t('addFriend')} title={t('addFriend')} aria-pressed={adding} onClick={() => setAdding(!adding)}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <circle cx="10" cy="8" r="3.6" fill="none" stroke="currentColor" stroke-width="1.7" />
                <path d="M3.5 19.5c.8-3.4 3.4-5.2 6.5-5.2s5.7 1.8 6.5 5.2M18.5 6.5v6M15.5 9.5h6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="rlc-rc-list">
            {open ? (
              <>
                <FriendRequests lcu={lcu} />
                <FriendFolders lcu={lcu} friends={friends} groups={lcu.friendGroups.value.data ?? []} query={query} avatar={avatar} onFriend={onFriend} menuFor={menuFor} onHover={showCard} onLeave={() => setHover(null)} />
              </>
            ) : (
              // Recolhida: só quem pode jogar agora, na mesma coluna em que fica o avatar na gaveta aberta.
              friends
                .filter((f) => isActive(presenceOf(f)))
                .map((f) => (
                  <div key={f.puuid || f.id} class="rlc-rc-row">
                    <button type="button" class="rlc-rc-cell rlc-rc-avatar" data-group={presenceOf(f)} aria-label={friendName(f)} title={friendName(f)} onClick={() => onFriend?.(f)}>
                      {avatar(f)}
                    </button>
                  </div>
                ))
            )}
          </div>
          {onChat ? (
            <div class="rlc-rc-row rlc-rc-foot">
              <span class="rlc-rc-label">{t('chatRecent')}</span>
              <button type="button" class="rlc-rc-cell rlc-rc-chatbtn" aria-label={t('chatRecent')} title={t('chatRecent')} aria-pressed={chatOpen} onClick={onChat}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                </svg>
                {chatUnread > 0 ? <span class="rlc-rc-badge">{chatUnread > 99 ? '99+' : chatUnread}</span> : null}
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {hovered ? <FriendCard key={hovered.id} lcu={lcu} friend={hovered} top={hover!.top} /> : null}
    </aside>
  );
}

interface FolderProps {
  lcu: Lcu;
  friends: Friend[];
  groups: LolChatGroupResource[];
  query: string;
  avatar: (f: Friend) => ComponentChildren;
  onFriend?: (f: Friend) => void;
  menuFor?: (f: Friend) => ComponentChildren;
  onHover: (f: Friend, row: HTMLElement) => void;
  onLeave: () => void;
}

/**
 * Pastas do client em ordem de prioridade, com "online/total"; quem está offline vai para a pasta Offline no fim, como no client.
 * Aberta/fechada à mão fica guardada; sem escolha, abre a pasta que tem alguém para jogar. Busca por nome em todas.
 */
function FriendFolders({ lcu, friends, groups, query, avatar, onFriend, menuFor, onHover, onLeave }: FolderProps) {
  const q = query.trim().toLowerCase();
  const shown = q ? friends.filter((f) => friendName(f).toLowerCase().includes(q)) : friends;
  // Amigo numa pasta que a lista não trouxe ainda cai numa pasta com o nome que ele mesmo informa.
  const folders = [...groups];
  for (const f of friends) if (!folders.some((g) => g.id === f.groupId)) folders.push({ id: f.groupId, name: f.groupName, priority: -1, collapsed: false, isLocalized: false, isMetaGroup: false });
  folders.sort((a, b) => b.priority - a.priority);
  const offline = shown.filter((f) => presenceOf(f) === 'offline');
  const row = (f: Friend) => {
    const p = presenceOf(f);
    return (
      <div key={f.puuid || f.id} class="rlc-rc-row rlc-rc-friend" data-group={p} onMouseEnter={(e) => onHover(f, e.currentTarget)} onMouseLeave={onLeave}>
        <div class="rlc-rc-label">
          <button type="button" class="rlc-rc-friend-main" onClick={() => onFriend?.(f)}>
            <span class="rlc-rc-fname">{friendName(f)}</span>
            <small>{activityLine(lcu, f)}</small>
          </button>
          {menuFor?.(f)}
        </div>
        <button type="button" class="rlc-rc-cell rlc-rc-avatar" data-group={p} aria-label={friendName(f)} tabIndex={-1} onClick={() => onFriend?.(f)}>
          {avatar(f)}
        </button>
      </div>
    );
  };
  return (
    <>
      {folders.map((g) => {
        const list = shown.filter((f) => f.groupId === g.id && presenceOf(f) !== 'offline');
        const total = friends.filter((f) => f.groupId === g.id);
        if (!total.length || (q && !list.length)) return null;
        const on = total.filter((f) => isActive(presenceOf(f))).length;
        return (
          <Folder key={g.id} id={String(g.id)} title={groupLabel(g)} count={`${on}/${total.length}`} auto={on > 0} forceOpen={!!q}>
            {() => list.map(row)}
          </Folder>
        );
      })}
      {offline.length ? (
        <Folder id="offline" title={t('groupOffline')} count={String(offline.length)} auto={false} forceOpen={!!q}>
          {() => offline.map(row)}
        </Folder>
      ) : null}
    </>
  );
}
