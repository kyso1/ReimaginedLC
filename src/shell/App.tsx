import type { Signal } from '@preact/signals';
import { h, type JSX } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t, type TextKey } from '../i18n';
import type { Lcu } from '../lcu';
import { request } from '../lcu/request';
import { Honor } from '../screens/honor/Honor';
import { Home } from '../screens/home/Home';
import { InGame } from '../screens/ingame/InGame';
import { Lobby } from '../screens/lobby/Lobby';
import { Unknown } from '../screens/unknown/Unknown';
import { CustomBrowser } from '../screens/modes/CustomBrowser';
import { LAST_QUEUE_KEY, Modes } from '../screens/modes/Modes';
import { queueGroup } from '../screens/modes/queues';
import { applyTheme, mediaUrl } from '../theme/apply';
import type { ThemeEngine } from '../theme/engine';
import { MediaBackground } from '../ui/MediaBackground';
import { Rail } from '../ui/Rail';
import { Boundary } from './Boundary';
import { enabled, hideRiot, setEnabled } from './layer';
import { Confirm } from './overlays/Confirm';
import { InvitationCards } from './overlays/Invitations';
import { QueuePill } from './QueuePill';
import { ReadyCheckOverlay, showReadyCheck } from './overlays/ReadyCheck';
import { screenFor, type Screen } from './router';
import { readSetting } from './storage';
import { prefs } from './prefs';
import { freezeRiot, isLite, liteAuto } from './perf';
import { ChatDock } from '../screens/social/Chat';
import { ContextChat, type RoomJoin } from '../screens/social/ContextChat';
import { MemberMenu } from '../screens/lobby/MemberMenu';
import type { LolChatFriendResource } from '../lcu/types';
import { background, loadBg } from '../theme/background';
import { RightColumn } from './RightColumn';
import { SpotifyWidget } from '../plugins/SpotifyWidget';
import { pendingClaims } from '../screens/events/data';
import { idle, lazyView } from './lazy';
import { useBackground } from './useBackground';
import { useSound } from './sound';
import { WindowBar } from './WindowBar';

/** Item do trilho para as telas do fluxo da partida. */
// Telas fora da abertura: chunks sob demanda, resolvidos relativos ao index.js (import.meta.url).
const ChampSelect = lazyView(() => import('../screens/champselect/ChampSelect').then((m) => m.ChampSelect));
const PostGame = lazyView(() => import('../screens/postgame/PostGame').then((m) => m.PostGame));
const Collection = lazyView(() => import('../screens/collection/Collection').then((m) => m.Collection));
const Loot = lazyView(() => import('../screens/collection/Loot').then((m) => m.Loot));
const Settings = lazyView(() => import('../screens/settings/Settings').then((m) => m.Settings));
const Profile = lazyView(() => import('../screens/profile/Profile').then((m) => m.Profile));
const Store = lazyView(() => import('../screens/store/Store').then((m) => m.Store));
const Events = lazyView(() => import('../screens/events/Events').then((m) => m.Events));
// Fase -> tela provável seguinte, baixada no ocioso para não haver atraso ao chegar nela.
const NEXT: Partial<Record<string, { preload: () => Promise<void> }>> = { Lobby: ChampSelect, Matchmaking: ChampSelect, ReadyCheck: ChampSelect, InProgress: PostGame, WaitingForStats: PostGame, PreEndOfGame: PostGame };

const RAIL: Partial<Record<Screen, TextKey>> = { champselect: 'railChampSelect', ingame: 'railGame', honor: 'railHonor', postgame: 'railPostGame' };

/** Escurecer o fundo nunca chega ao preto total: a tela sumia atrás dos painéis. */
const MAX_DIM = 0.85;
const RIGHT_CLOSE_MS = 1200;

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
export type View = 'profile' | 'collection' | 'loot' | 'events' | 'store' | 'settings';
type Views = Partial<Record<View, (props: { lcu: Lcu }) => JSX.Element>>;
const VIEW_LABEL: Record<View, TextKey> = { profile: 'navProfile', collection: 'navCollection', loot: 'colLoot', events: 'navEvents', store: 'navStore', settings: 'navSettings' };

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
  // A gaveta de amigos fica 1,2 s depois de o mouse sair, para não fechar num esbarrão.
  const rightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdRight = (open: boolean) => {
    if (rightTimer.current) clearTimeout(rightTimer.current);
    rightTimer.current = null;
    if (open) setRightOpen(true);
    else rightTimer.current = setTimeout(() => setRightOpen(false), RIGHT_CLOSE_MS);
  };
  useEffect(() => () => void (rightTimer.current && clearTimeout(rightTimer.current)), []);
  /** Conversas 1:1 abertas como abas e a que está à vista. */
  const [chat, setChat] = useState<{ open: boolean; active: string | null }>({ open: false, active: null });
  const [removing, setRemoving] = useState<LolChatFriendResource | null>(null);
  /** Perfil aberto: null é o próprio. */
  const [profilePuuid, setProfilePuuid] = useState<string | null>(null);
  // Telas livres só fora do fluxo de partida; ao entrar na seleção (ou depois), a fase manda.
  const free = screen === 'home' || screen === 'lobby';
  useEffect(() => {
    if (!free) setView(null);
  }, [free]);
  const shownView = free ? view : null;
  useEffect(() => {
    const next = NEXT[phaseName];
    if (visible && next) idle(next.preload);
  }, [phaseName, visible]);
  // Início é tela livre também com lobby aberto ou em fila: a fase põe no lobby, o trilho leva à tela inicial.
  const [atHome, setAtHome] = useState(false);
  useEffect(() => setAtHome(false), [screen]);
  const page: Screen | null = screen === 'lobby' && atHome ? 'home' : screen;
  // Recompensas de passe para resgatar: ponto dourado em Eventos. Relido ao voltar às telas livres e a cada 10 min.
  const [claims, setClaims] = useState(0);
  useEffect(() => {
    if (!visible || !free) return;
    let live = true;
    const read = () => void pendingClaims(lcu).then((n) => live && setClaims(n)).catch(() => {});
    read();
    const id = setInterval(read, 600_000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [visible, free, shownView === 'events']);
  // Fundo personalizado: lido do DataStore uma vez; a tela de configurações troca o signal ao vivo.
  useEffect(() => {
    background.value = loadBg();
  }, []);
  const custom = useBackground(lcu, shownView ?? page ?? '');
  // Música ambiente fora da partida e toque de clique nos botões (sons do próprio client).
  useSound(root, shownView ?? page ?? '', visible, focused.value);
  useEffect(() => {
    if (phaseName === 'TerminatedInError') window.Toast?.error(t('gameError'));
  }, [phaseName]);
  /** Painel aberto sobre a tela: tela de modos ou lista de salas. */
  const [panel, setPanel] = useState<null | 'modes' | 'custom'>(null);
  // Fecha ao trocar de tela (convite aceito leva da tela inicial ao lobby) ou quando a camada some.
  useEffect(() => setPanel(null), [screen, visible]);
  const readyVisible = visible && showReadyCheck(lcu.readyCheck.value);
  // Fila do lobby (ou da partida) para o emblema e o nome no aceite.
  const queueId = lcu.lobby.value.data?.gameConfig.queueId ?? lcu.gameflowSession.value.data?.gameData?.queue?.id;
  const currentQueue = (lcu.queues.value.data ?? []).find((q) => q.id === queueId) ?? null;

  // Aceite com a janela minimizada ou sem foco: traz a janela para frente, uma vez por aceite.
  useEffect(() => {
    if (!readyVisible || focused.peek()) return;
    void request('POST', '/riotclient/ux-show').catch(() => {});
    void request('POST', '/riotclient/ux-flash').catch(() => {});
  }, [readyVisible]);

  // Layout effects: rodam logo após o commit do DOM, antes de qualquer pintura. Se a camada
  // não mostra tela, a Riot precisa estar visível já, não no próximo frame.
  useLayoutEffect(() => applyTheme(root, theme), [root, theme]);
  // Modo leve: atributo para o CSS (sem desfoque), transições completas viram reduzidas, vídeo de fundo parado.
  const lite = isLite(prefs.value.lite, liteAuto.value);
  useLayoutEffect(() => void (lite ? (root.dataset.lite = '') : delete root.dataset.lite), [root, lite]);
  const motion = lite && prefs.value.motion === 'full' ? 'reduced' : prefs.value.motion;
  useLayoutEffect(() => void (root.dataset.motion = motion), [root, motion]);

  /** Elemento da Riot que escondemos e o `visibility` inline que ele tinha; null quando não escondemos nada. */
  const hidden = useRef<{ el: HTMLElement; prev: string } | null>(null);
  /** Congelamento (vídeos pausados, árvore fora da renderização) da raiz da Riot escondida; só com a camada visível. */
  const frozen = useRef<{ el: HTMLElement; stop: () => void } | null>(null);
  const sync = (show: boolean, hideIt: boolean) => {
    root.dataset.visible = String(show);
    const riot = document.getElementById(RIOT_ROOT_ID);
    const mine = hidden.current;
    if (frozen.current && (frozen.current.el !== riot || !hideIt)) {
      frozen.current.stop();
      frozen.current = null;
    }
    if (riot && hideIt && !frozen.current) frozen.current = { el: riot, stop: freezeRiot(riot, root) };
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
  const withPanelClose = (items: Array<{ id: string; label: string; active?: boolean; onSelect: () => void }>) =>
    items.map((i) => ({ ...i, onSelect: () => (setPanel(null), i.onSelect()) }));
  const openChat = async (f: LolChatFriendResource) => {
    // A conversa 1:1 tem o id do amigo; criada na LCU na primeira vez.
    if (!lcu.conversations.value.data?.some((c) => c.id === f.id)) await request('POST', '/lol-chat/v1/conversations', { id: f.id, type: 'chat' }).catch(() => {});
    setChat({ open: true, active: f.id });
  };
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
  // Sala de chat da tela: id e credenciais para entrar nela quando a Riot (escondida) não entrou.
  const room: { id?: string; password?: string; mucJwtDto?: unknown; type: RoomJoin['type'] } | null | undefined =
    page === 'lobby'
      ? lcu.lobby.value.data && { id: lcu.lobby.value.data.multiUserChatId, password: lcu.lobby.value.data.multiUserChatPassword, mucJwtDto: lcu.lobby.value.data.mucJwtDto, type: 'customGame' }
      : screen === 'champselect'
        ? lcu.champSelect.value.data?.chatDetails && { ...lcu.champSelect.value.data.chatDetails, id: lcu.champSelect.value.data.chatDetails.multiUserChatId, password: lcu.champSelect.value.data.chatDetails.multiUserChatPassword, type: 'championSelect' }
        : screen === 'postgame'
          ? lcu.endOfGame.value.data && { id: lcu.endOfGame.value.data.multiUserChatId, password: lcu.endOfGame.value.data.multiUserChatPassword, mucJwtDto: lcu.endOfGame.value.data.mucJwtDto, type: 'postGame' }
          : null;
  const roomId = room?.id;
  const join: RoomJoin | undefined = room?.password && room.mucJwtDto ? { type: room.type, password: room.password, mucJwtDto: room.mucJwtDto as RoomJoin['mucJwtDto'] } : undefined;
  const onError = (error: unknown) => {
    console.error('[rlc]', error);
    enabled.value = false;
    window.Toast?.error(t('screenFailed'));
  };

  return (
    <div
      class="rlc-app"
      key={theme.name}
      data-screen={shownView ?? page ?? undefined}
      // Com fundo do usuário, as telas tiram a arte própria de tela cheia (styles.css) para ele aparecer.
      data-custom-bg={custom ? 'true' : undefined}
      // Gaveta de amigos fixa: as telas encolhem pela largura dela (social.css); na seleção ela recolhe.
      data-social={prefs.value.socialPinned && phaseName !== 'ChampSelect' ? 'pinned' : undefined}
      style={{ '--rlc-bg-dim': String(Math.min(background.value.dim, MAX_DIM)), '--rlc-bg-blur': `${background.value.blur}px`, '--rlc-bg-pos': `${background.value.posX}% ${background.value.posY}%` }}
    >
      <Boundary onError={onError}>
        <MediaBackground src={custom?.src ?? mediaUrl(theme, page ?? '', base)} video={custom?.video} playing={focused.value && prefs.value.video && !lite} />
        <div class="rlc-bg-dim" />
        <Rail
          // Qualquer item do trilho fecha o painel aberto por cima (modos, salas).
          items={withPanelClose([
            // Início e Lobby seguem a fase do gameflow; Perfil, Coleção e Configurações abrem por cima dela, fora da partida.
            { id: 'home', label: t('home'), active: page === 'home' && !shownView, onSelect: () => (setView(null), setAtHome(true)) },
            ...(lcu.lobby.value.data ? [{ id: 'lobby', label: t('lobby'), active: page === 'lobby' && !shownView, onSelect: () => (setView(null), setAtHome(false)) }] : []),
            ...(RAIL[screen] ? [{ id: screen, label: t(RAIL[screen]!), active: true, onSelect: () => {} }] : []),
            ...(free
              ? (Object.keys(VIEW_LABEL) as View[]).map((v) => ({
                  id: v,
                  label: t(VIEW_LABEL[v]),
                  active: shownView === v,
                  // Ponto = algo novo para pegar: recompensa de passe em Eventos, item novo (isNew) em Espólios.
                  dot: (v === 'events' && claims > 0) || (v === 'loot' && (lcu.loot.value.data ?? []).some((l) => l.isNew && l.count > 0 && l.type !== 'CURRENCY')),
                  onSelect: () => {
                    if (v === 'profile') setProfilePuuid(null);
                    setView(v);
                  },
                }))
              : []),
            { id: 'original', label: t('originalClient'), onSelect: turnOff },
          ])}
        />
        <main class="rlc-screen">
          {shownView
            ? views[shownView]
              ? h(views[shownView]!, { lcu })
              : shownView === 'profile' && (profilePuuid ?? lcu.chatMe.value.data?.puuid)
                ? <Profile key={profilePuuid ?? 'me'} lcu={lcu} puuid={(profilePuuid ?? lcu.chatMe.value.data?.puuid)!} />
                : shownView === 'collection'
                  ? <Collection lcu={lcu} />
                : shownView === 'loot'
                  ? <section class="rlc-loot-view"><Loot lcu={lcu} /></section>
                : shownView === 'events'
                  ? <Events lcu={lcu} />
                : shownView === 'store'
                  ? <Store lcu={lcu} />
                : shownView === 'settings'
                  ? <Settings lcu={lcu} themes={themes} />
                : <section class="rlc-unknown"><h2>{t(VIEW_LABEL[shownView])}</h2></section>
            : page === 'home' && screens.home
            ? h(screens.home, { version: lcu.build.value.data?.version ?? null, locale: lcu.regionLocale.value.data?.locale ?? null, onPlay: () => setPanel('modes'), onStore: () => setView('store'), onEvents: () => setView('events') })
            : page === 'lobby' && screens.lobby
              ? h(screens.lobby, { lcu, onModes: () => setPanel('modes') })
              : screen !== 'home' && screen !== 'lobby' && screen !== 'unknown' && screens[screen]
                ? h(screens[screen]!, { lcu })
                : // Fase desconhecida ou tela não fornecida (testes): tela de fase desconhecida, nunca o client original.
                  <Unknown phase={phaseName} onOriginal={turnOff} />}
        </main>
        <RightColumn
          lcu={lcu}
          open={rightOpen}
          onOpen={() => holdRight(true)}
          onClose={() => holdRight(false)}
          chatOpen={chat.open}
          chatUnread={(lcu.conversations.value.data ?? []).filter((c) => c.type === 'chat').reduce((n, c) => n + (c.unreadMessageCount ?? 0), 0)}
          onChat={() => setChat((c) => ({ ...c, open: !c.open }))}
          onFriend={(f) => void openChat(f)}
          menuFor={friendMenu}
          onProfile={() => {
            setProfilePuuid(null);
            setView('profile');
          }}
        />
        {/* O chat é da sala da tela de fase; com perfil, coleção ou loja por cima, sai do caminho. */}
        {roomId && !shownView ? <ContextChat key={roomId} lcu={lcu} roomId={roomId} join={join} /> : null}
        <ChatDock lcu={lcu} open={chat.open} active={chat.active} onActivate={(id) => setChat({ open: true, active: id })} onClose={() => setChat((c) => ({ ...c, open: false }))} />
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
        {panel === 'modes' ? (
          <Modes
            queues={lcu.queues.value.data ?? []}
            current={lcu.lobby.value.data?.gameConfig.queueId ?? readSetting<number | null>(LAST_QUEUE_KEY, null)}
            onClose={() => setPanel(null)}
            onCustom={() => setPanel('custom')}
          />
        ) : null}
        {panel === 'custom' ? <CustomBrowser lcu={lcu} onClose={() => setPanel(null)} /> : null}
        {/* Em fila fora do lobby: pílula no canto; ao voltar ao lobby ela estica até a barra de busca. */}
        <QueuePill lcu={lcu} onLobby={page === 'lobby' && !shownView} onOpen={() => (setPanel(null), setView(null), setAtHome(false))} />
        <InvitationCards invitations={lcu.invitations.value.data ?? []} queues={lcu.queues.value.data ?? []} name={lcu.name} />
        {readyVisible ? <ReadyCheck rc={lcu.readyCheck.value.data!} mode={currentQueue ? queueGroup(currentQueue) : 'sr'} queueName={currentQueue?.name} /> : null}
        <SpotifyWidget />
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
