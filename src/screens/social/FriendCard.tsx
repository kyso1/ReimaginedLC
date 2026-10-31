import { useEffect, useState } from 'preact/hooks';
import type { Champion } from '../../data/gamedata';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import type { LolChatFriendResource } from '../../lcu/types';
import { Rank, rankedQueueOf } from '../../ui/Rank';
import { formatClock } from '../lobby/format';
import { tierLabel } from '../profile/data';
import { useDecoded } from '../../ui/useDecoded';
import { queueLabel } from '../modes/queues';

export const profileIcon = (id: number | undefined) => (id ? `/lol-game-data/assets/v1/profile-icons/${id}.jpg` : '');

export type Friend = LolChatFriendResource & { discordOnlineStatus?: string };
/** Situação do amigo, na ordem em que aparece na pasta. */
export type Presence = 'playing' | 'online' | 'away' | 'mobile' | 'discord' | 'offline';
export const PRESENCE_ORDER: Presence[] = ['playing', 'online', 'away', 'mobile', 'discord', 'offline'];
export const PRESENCE_KEY: Record<Presence, TextKey> = { playing: 'groupPlaying', online: 'statusOnline', away: 'statusAway', mobile: 'statusMobile', discord: 'statusDiscord', offline: 'groupOffline' };

/** `dnd` é "em jogo / em fila" no chat da Riot. Offline no jogo mas online no Discord conta como Discord. */
export function presenceOf(f: Pick<Friend, 'availability' | 'discordOnlineStatus'>): Presence {
  if (f.availability === 'dnd') return 'playing';
  if (f.availability === 'chat') return 'online';
  if (f.availability === 'away') return 'away';
  if (f.availability === 'mobile') return 'mobile';
  if (f.discordOnlineStatus === 'online') return 'discord';
  return 'offline';
}
/** Quem pode jogar agora: aparece na faixa recolhida e conta como online na pasta. */
export const isActive = (p: Presence) => p === 'playing' || p === 'online' || p === 'away';
export const friendName = (f: Pick<Friend, 'gameName' | 'name'>) => f.gameName || f.name || '';

/** Nome localizado da fila da presença; sem fila conhecida, o nome do modo quando há tradução. Nunca o id. */
export function queueName(lcu: Lcu, lol: Record<string, string> | undefined): string {
  const id = Number(lol?.queueId);
  const q = id > 0 ? lcu.queues.value.data?.find((x) => x.id === id) : undefined;
  return queueLabel(q) || (lol?.gameMode ? t(`colMode_${lol.gameMode}` as TextKey) || '' : '');
}

/**
 * Festa do amigo em que dá para entrar: aberta, com vaga e que não é a minha (`mine`). A presença traz a festa em `lol.pty` (JSON).
 * ponytail: regra tirada do swagger e da presença, sem sessão do client original entrando numa festa; conferir quando houver uma.
 */
export function openParty(f: Pick<Friend, 'lol'>, mine?: string): string | null {
  let pty: { partyId?: string; isPartyOpen?: boolean; maxPlayers?: number; summonerPuuids?: string[] };
  try {
    pty = JSON.parse(f.lol?.pty ?? '');
  } catch {
    return null;
  }
  const full = (pty.summonerPuuids?.length ?? 0) >= (pty.maxPlayers ?? Infinity);
  return pty.isPartyOpen && pty.partyId && pty.partyId !== mine && !full ? pty.partyId : null;
}

/** O que o amigo está fazendo, como o client escreve abaixo do nome. */
export function activityKey(f: Friend): TextKey | null {
  const s = f.lol?.gameStatus ?? '';
  if (s === 'inGame') return 'inGame';
  if (s === 'championSelect') return 'socChampSelect';
  if (s === 'inQueue') return 'socInQueue';
  if (s === 'spectating') return 'socSpectating';
  if (s.startsWith('hosting_')) return 'socInLobby';
  return null;
}

/** Linha curta abaixo do nome na lista. */
export function activityLine(lcu: Lcu, f: Friend): string {
  const p = presenceOf(f);
  const key = p === 'playing' || p === 'online' ? activityKey(f) : null;
  if (key) {
    const q = queueName(lcu, f.lol);
    return q ? `${t(key)} · ${q}` : t(key);
  }
  if (p === 'online' || p === 'away') return f.statusMessage || t(PRESENCE_KEY[p]);
  return t(PRESENCE_KEY[p]);
}

/** "há 3 horas", no idioma da camada. */
export function sinceText(ms: number, now = Date.now()): string {
  const s = Math.round((ms - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' });
  for (const [unit, size] of [['day', 86400], ['hour', 3600], ['minute', 60]] as const) if (Math.abs(s) >= size) return rtf.format(Math.round(s / size), unit);
  return rtf.format(0, 'minute');
}

function useChampion(lcu: Lcu, id: number): Champion | null {
  const [c, setC] = useState<Champion | null>(null);
  useEffect(() => {
    setC(null);
    if (!id) return;
    let live = true;
    void lcu.game.champions().then((m) => live && setC(m.get(id) ?? null));
    return () => {
      live = false;
    };
  }, [id]);
  return c;
}

/** Splash do fundo de perfil do amigo, como no client (mesma do Perfil dele). */
export function useBanner(lcu: Lcu, puuid: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(null);
    if (!puuid) return;
    let live = true;
    void lcu
      .profile(puuid)
      .then((pr) => (pr?.backgroundSkinId ? lcu.game.splash(pr.backgroundSkinId) : null))
      .then((u) => live && setUrl(u))
      .catch(() => {});
    return () => void (live = false);
  }, [puuid]);
  return useDecoded(url);
}

/** Relógio da partida desde `lol.timeStamp` (início do jogo, em ms). */
function useElapsed(start: number): string {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!start) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [start]);
  return start ? formatClock((now - start) / 1000) : '';
}

/** Cartão ao passar o mouse num amigo: o mesmo que o client mostra (ícone, Riot ID, mensagem, o que está fazendo, elo). */
export function FriendCard({ lcu, friend: f, top }: { lcu: Lcu; friend: Friend; top: number }) {
  const p = presenceOf(f);
  const lol = f.lol ?? {};
  const key = p === 'playing' || p === 'online' ? activityKey(f) : null;
  const inGame = lol.gameStatus === 'inGame';
  const champ = useChampion(lcu, inGame ? Number(lol.championId) : 0);
  const elapsed = useElapsed(inGame ? Number(lol.timeStamp) || 0 : 0);
  const queue = key ? queueName(lcu, lol) : '';
  const ranked = rankedQueueOf(Number(lol.queueId));
  const soloLabel = tierLabel(lol.rankedLeagueTier, lol.rankedLeagueDivision);
  const lastSeen = p === 'offline' ? Number(f.lastSeenOnlineTimestamp) : 0;
  const banner = useBanner(lcu, f.puuid);
  return (
    <div class="rlc-fcard" role="tooltip" style={{ top: `${top}px` }} data-group={p}>
      {banner ? <div class="rlc-fcard-banner" aria-hidden="true" style={{ backgroundImage: `url("${banner}")` }} /> : null}
      <div class="rlc-fcard-head">
        <span class="rlc-fcard-icon">{f.icon ? <img src={profileIcon(f.icon)} alt="" /> : null}</span>
        <span class="rlc-fcard-id">
          <strong>
            {friendName(f)}
            {f.gameTag ? <small>#{f.gameTag}</small> : null}
          </strong>
          {lol.level ? <small>{`${t('level')} ${lol.level}`}</small> : null}
        </span>
      </div>
      {f.statusMessage ? <p class="rlc-fcard-msg">{f.statusMessage}</p> : null}
      <div class="rlc-fcard-state">
        <i class="rlc-fcard-dot" />
        <span>{key ? t(key) : t(PRESENCE_KEY[p])}</span>
        {queue ? <span class="rlc-fcard-queue">{queue}</span> : null}
      </div>
      {inGame && (champ || elapsed) ? (
        <div class="rlc-fcard-game">
          {champ?.icon ? <img src={champ.icon} alt="" /> : null}
          <span>{champ?.name ?? ''}</span>
          {elapsed ? <time>{elapsed}</time> : null}
        </div>
      ) : null}
      {lastSeen > 0 ? <p class="rlc-fcard-seen">{`${t('socLastSeen')} ${sinceText(lastSeen)}`}</p> : null}
      {ranked ? (
        <Rank puuid={f.puuid} queue={ranked} />
      ) : soloLabel ? (
        <span class="rlc-rank">
          <img src={`/fe/lol-static-assets/images/ranked-mini-crests/${lol.rankedLeagueTier!.toLowerCase()}.svg`} alt="" />
          <span>{`${t('rankedSolo')} • ${soloLabel}`}</span>
        </span>
      ) : null}
    </div>
  );
}
