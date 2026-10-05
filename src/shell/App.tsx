import type { Signal } from '@preact/signals';
import { h, type JSX } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t, type TextKey } from '../i18n';
import type { Lcu } from '../lcu';
import { request } from '../lcu/request';
import { ChampSelect } from '../screens/champselect/ChampSelect';
import { Honor } from '../screens/honor/Honor';
import { Home } from '../screens/home/Home';
import { InGame } from '../screens/ingame/InGame';
import { PostGame } from '../screens/postgame/PostGame';
import { Lobby } from '../screens/lobby/Lobby';
import { Unknown } from '../screens/unknown/Unknown';
import { CustomBrowser } from '../screens/modes/CustomBrowser';
import { LAST_QUEUE_KEY, Modes } from '../screens/modes/Modes';
import { applyTheme, mediaUrl } from '../theme/apply';
import type { ThemeEngine } from '../theme/engine';
import { MediaBackground } from '../ui/MediaBackground';
import { Rail } from '../ui/Rail';
import { Boundary } from './Boundary';
import { enabled, hideRiot, setEnabled } from './layer';
import { Confirm } from './overlays/Confirm';
import { InvitationCards } from './overlays/Invitations';
import { ReadyCheckOverlay, showReadyCheck } from './overlays/ReadyCheck';
import { screenFor, type Screen } from './router';
import { readSetting } from './storage';
import { Collection } from '../screens/collection/Collection';
import { Profile } from '../screens/profile/Profile';
import { ChatTabs, ChatWindow, conversationTitle } from '../screens/social/Chat';
import { ContextChat } from '../screens/social/ContextChat';
import { AddFriend, FriendRequests, StatusEditor } from '../screens/social/FriendTools';
import { MemberMenu } from '../screens/lobby/MemberMenu';
import type { LolChatFriendResource } from '../lcu/types';
import { background, loadBg } from '../theme/background';
import { CurrencyChip, RightColumn } from './RightColumn';
import { useBackground } from './useBackground';
import { WindowBar } from './WindowBar';

/** Item do trilho para as telas do fluxo da partida. */
const RAIL: Partial<Record<Screen, TextKey>> = { champselect: 'railChampSelect', ingame: 'railGame', honor: 'railHonor', postgame: 'railPostGame' };

/** Elemento raiz da interface da Riot. */
export const RIOT_ROOT_ID = 'rcp-fe-viewport-root';

type HomeProps = Parameters<typeof Home>[0];
type LobbyProps = Parameters<typeof Lobby>[0];
interface Screens {
  home?: (props: HomeProps) => JSX.Element;
  lobby?: (props: LobbyProps) => JSX.Element;
  champselect?: (props: { lcu: Lcu }) => JSX.Element;
  ingame?: (props: { lcu: Lcu }) => JSX.Element;
  honor?: (props: { lcu: Lcu }) => JSX.Element;
  postgame?: (props: { lcu: Lcu }) => JSX.Element;
}

/** Telas livres do trilho, abertas fora do fluxo de partida. */
export type View = 'profile' | 'collection' | 'settings';
type Views = Partial<Record<View, (props: { lcu: Lcu }) => JSX.Element>>;
const VIEW_LABEL: Record<View, TextKey> = { profile: 'navProfile', collection: 'navCollection', settings: 'navSettings' };

interface Props {
  root: HTMLElement;
  lcu: Lcu;
  themes: ThemeEngine;
  base: string;
  focused: Signal<boolean>;
  /** Muda quando a raiz da Riot aparece ou é trocada. */
  dom: Signal<number>;
  screens?: Screens;
  /** Ponto de troca para testes. */
  readyCheckOverlay?: typeof ReadyCheckOverlay;
  views?: Views;
}

export function App({ root, lcu, themes, base, focused, dom, screens = { home: Home, lobby: Lobby, champselect: ChampSelect, ingame: InGame, honor: Honor, postgame: PostGame }, readyCheckOverlay: ReadyCheck = ReadyCheckOverlay, views = {} }: Props) {
  const domVersion = dom.value;
  const route = screenFor(lcu.gameflowPhase.value);
  // Sem a sessão de seleção não há como escolher: única fase que volta ao client original.
  const screen = route === 'champselect' && lcu.champSelect.value.status === 'unavailable' ? null : route;
  const phaseName = lcu.gameflowPhase.value.data ?? '';
  const visible = enabled.value && screen !== null;
  // Tema por jogo: lobby ou partida de TFT usa o tema do TFT.
  const isTft = lcu.lobby.value.data?.gameConfig.gameMode === 'TFT' || lcu.gameflowSession.value.data?.gameData?.queue?.gameMode === 'TFT';
  const theme = isTft ? themes.forGame.tft.value : themes.active.value;
  const hide = visible && hideRiot.value;
  const [confirmClose, setConfirmClose] = useState(false);
  const [view, setView] = useState<View | null>(null);
  const [rightOpen, setRightOpen] = useState(false);
  /** Conversas 1:1 abertas como abas e a que está à vista. */
  const [chats, setChats] = useState<{ open: string[]; active: string | null }>({ open: [], active: null });
  const [removing, setRemoving] = useState<LolChatFriendResource | null>(null);
  /** Perfil aberto: null é o próprio. */
  const [profilePuuid, setProfilePuuid] = useState<string | null>(null);
  // Telas livres só fora do fluxo de partida; ao entrar na seleção (ou depois), a fase manda.
  const free = screen === 'home' || screen === 'lobby';
  useEffect(() => {
    if (!free) setView(null);
  }, [free]);
  const shownView = free ? view : null;
  // Fundo personalizado: lido do DataStore uma vez; a tela de configurações troca o signal ao vivo.
  useEffect(() => {
    background.value = loadBg();
  }, []);
  const custom = useBackground(lcu, shownView ?? screen ?? '');
  // A carteira não tem evento para a URI com consulta: relê ao voltar à tela inicial (depois de partida, loja, espólio).
  useEffect(() => {
    if (phaseName !== 'None') return;
    void lcu.wallet.refresh();
    void lcu.orangeEssence.refresh();
  }, [phaseName]);
  useEffect(() => {
    if (phaseName === 'TerminatedInError') window.Toast?.error(t('gameError'));
  }, [phaseName]);
  /** Painel aberto sobre a tela: tela de modos ou lista de salas. */
  const [panel, setPanel] = useState<null | 'modes' | 'custom'>(null);
  // Fecha ao trocar de tela (convite aceito leva da tela inicial ao lobby) ou quando a camada some.
  useEffect(() => setPanel(null), [screen, visible]);
  const readyVisible = visible && showReadyCheck(lcu.readyCheck.value);

  // Aceite com a janela minimizada ou sem foco: traz a janela para frente, uma vez por aceite.
  useEffect(() => {
    if (!readyVisible || focused.peek()) return;
    void request('POST', '/riotclient/ux-show').catch(() => {});
    void request('POST', '/riotclient/ux-flash').catch(() => {});
  }, [readyVisible]);

  // Layout effects: rodam logo após o commit do DOM, antes de qualquer pintura. Se a camada
  // não mostra tela, a Riot precisa estar visível já, não no próximo frame.
  useLayoutEffect(() => applyTheme(root, theme), [root, theme]);

  /** Elemento da Riot que escondemos e o `visibility` inline que ele tinha; null quando não escondemos nada. */
  const hidden = useRef<{ el: HTMLElement; prev: string } | null>(null);
  const sync = (show: boolean, hideIt: boolean) => {
    root.dataset.visible = String(show);
    const riot = document.getElementById(RIOT_ROOT_ID);
    const mine = hidden.current;
    // O valor lembrado pertence ao elemento antigo: nunca é escrito num elemento novo.
    if (mine && mine.el !== riot) {
      if (mine.el.isConnected) mine.el.style.visibility = mine.prev;
      hidden.current = null;
    }
    if (!riot) return;
    if (hideIt) {
      hidden.current ??= { el: riot, prev: riot.style.visibility };
      riot.style.visibility = 'hidden';
    } else if (hidden.current) {
      riot.style.visibility = hidden.current.prev;
      hidden.current = null;
    }
  };
  useLayoutEffect(() => sync(visible, hide), [root, visible, hide, domVersion]);
  useLayoutEffect(() => () => sync(false, false), [root]);

  if (!visible || screen === null) return null;

  const turnOff = () => setEnabled(false);
  const openChat = async (f: LolChatFriendResource) => {
    // A conversa 1:1 tem o id do amigo; criada na LCU na primeira vez.
    if (!lcu.conversations.value.data?.some((c) => c.id === f.id)) await request('POST', '/lol-chat/v1/conversations', { id: f.id, type: 'chat' }).catch(() => {});
    setChats((c) => ({ open: c.open.includes(f.id) ? c.open : [...c.open, f.id], active: f.id }));
  };
  const closeChat = (id: string) => setChats((c) => ({ open: c.open.filter((x) => x !== id), active: c.active === id ? null : c.active }));
  const friendMenu = (f: LolChatFriendResource) => (
    <MemberMenu
      items={[
        { label: t('chatWith'), run: () => void openChat(f) },
        {
          label: t('viewProfile'),
          run: () => {
            setProfilePuuid(f.puuid);
            setView('profile');
          },
        },
        ...(lcu.lobby.value.data ? [{ label: t('inviteToLobby'), run: () => void request('POST', '/lol-lobby/v2/lobby/invitations', [{ toSummonerId: f.summonerId }]).catch(() => {}) }] : []),
        { label: t('removeFriend'), run: () => setRemoving(f) },
      ]}
    />
  );
  const roomId =
    screen === 'lobby' ? lcu.lobby.value.data?.multiUserChatId : screen === 'champselect' ? lcu.champSelect.value.data?.chatDetails?.multiUserChatId : screen === 'postgame' ? lcu.endOfGame.value.data?.multiUserChatId : null;
  const onError = (error: unknown) => {
    console.error('[rlc]', error);
    enabled.value = false;
    window.Toast?.error(t('screenFailed'));
  };

  return (
    <div
      class="rlc-app"
      key={theme.name}
      style={{ '--rlc-bg-dim': String(background.value.dim), '--rlc-bg-blur': `${background.value.blur}px`, '--rlc-bg-pos': `${background.value.posX}% ${background.value.posY}%` }}
    >
      <Boundary onError={onError}>
        <MediaBackground src={custom?.src ?? mediaUrl(theme, screen, base)} video={custom?.video} playing={focused.value} />
        <div class="rlc-bg-dim" />
        <Rail
          items={[
            // Início e Lobby seguem a fase do gameflow; Perfil, Coleção e Configurações abrem por cima dela, fora da partida.
            { id: 'home', label: t('home'), active: screen === 'home' && !shownView, onSelect: () => setView(null) },
            ...(lcu.lobby.value.data ? [{ id: 'lobby', label: t('lobby'), active: screen === 'lobby' && !shownView, onSelect: () => setView(null) }] : []),
            ...(RAIL[screen] ? [{ id: screen, label: t(RAIL[screen]!), active: true, onSelect: () => {} }] : []),
            ...(free
              ? (Object.keys(VIEW_LABEL) as View[]).map((v) => ({
                  id: v,
                  label: t(VIEW_LABEL[v]),
                  active: shownView === v,
                  onSelect: () => {
                    if (v === 'profile') setProfilePuuid(null);
                    setView(v);
                  },
                }))
              : []),
            { id: 'original', label: t('originalClient'), onSelect: turnOff },
          ]}
        />
        <main class="rlc-screen">
          {shownView
            ? views[shownView]
              ? h(views[shownView]!, { lcu })
              : shownView === 'profile' && (profilePuuid ?? lcu.chatMe.value.data?.puuid)
                ? <Profile key={profilePuuid ?? 'me'} lcu={lcu} puuid={(profilePuuid ?? lcu.chatMe.value.data?.puuid)!} />
                : shownView === 'collection'
                  ? <Collection lcu={lcu} />
                : <section class="rlc-unknown"><h2>{t(VIEW_LABEL[shownView])}</h2></section>
            : screen === 'home' && screens.home
            ? h(screens.home, { version: lcu.build.value.data?.version ?? null, locale: lcu.regionLocale.value.data?.locale ?? null, onPlay: () => setPanel('modes') })
            : screen === 'lobby' && screens.lobby
              ? h(screens.lobby, { lcu, onModes: () => setPanel('modes') })
              : screen !== 'home' && screen !== 'lobby' && screen !== 'unknown' && screens[screen]
                ? h(screens[screen]!, { lcu })
                : // Fase desconhecida ou tela não fornecida (testes): tela de fase desconhecida, nunca o client original.
                  <Unknown phase={phaseName} onOriginal={turnOff} />}
        </main>
        <RightColumn
          lcu={lcu}
          open={rightOpen || chats.active !== null}
          onOpen={() => setRightOpen(true)}
          onClose={() => setRightOpen(false)}
          onFriend={(f) => void openChat(f)}
          menuFor={friendMenu}
          header={
            <>
              <StatusEditor lcu={lcu} />
              <AddFriend />
              <FriendRequests lcu={lcu} />
            </>
          }
        />
        {roomId ? <ContextChat key={roomId} lcu={lcu} roomId={roomId} defaultOpen={screen === 'champselect'} /> : null}
        <ChatTabs lcu={lcu} open={chats.open} active={chats.active} onActivate={(id) => setChats((c) => ({ ...c, active: c.active === id ? null : id }))} onClose={closeChat} />
        {chats.active ? <ChatWindow key={chats.active} lcu={lcu} conversationId={chats.active} title={conversationTitle(lcu, chats.active)} onClose={() => setChats((c) => ({ ...c, active: null }))} /> : null}
        {removing ? (
          <Confirm
            message={`${t('removeFriendConfirm')} ${removing.gameName}`}
            confirmLabel={t('removeFriend')}
            onConfirm={() => {
              void request('DELETE', `/lol-chat/v1/friends/${encodeURIComponent(removing.id)}`).catch(() => {});
              setRemoving(null);
            }}
            onCancel={() => setRemoving(null)}
          />
        ) : null}
        <CurrencyChip lcu={lcu} />
        {panel === 'modes' ? (
          <Modes
            queues={lcu.queues.value.data ?? []}
            current={lcu.lobby.value.data?.gameConfig.queueId ?? readSetting<number | null>(LAST_QUEUE_KEY, null)}
            onClose={() => setPanel(null)}
            onCustom={() => setPanel('custom')}
          />
        ) : null}
        {panel === 'custom' ? <CustomBrowser lcu={lcu} onClose={() => setPanel(null)} /> : null}
        <InvitationCards invitations={lcu.invitations.value.data ?? []} queues={lcu.queues.value.data ?? []} name={lcu.name} />
        {readyVisible ? <ReadyCheck rc={lcu.readyCheck.value.data!} /> : null}
        <WindowBar onClose={() => setConfirmClose(true)} />
        {confirmClose ? (
          <Confirm
            message={t('quitConfirm')}
            confirmLabel={t('quit')}
            onConfirm={() => {
              setConfirmClose(false);
              void request('POST', '/process-control/v1/process/quit').catch(() => {});
            }}
            onCancel={() => setConfirmClose(false)}
          />
        ) : null}
      </Boundary>
    </div>
  );
}
