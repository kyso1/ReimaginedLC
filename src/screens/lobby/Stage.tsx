import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import type { LolLobbyLobbyParticipantDto } from '../../lcu/types';
import { Rank } from '../../ui/Rank';
import { useDecoded } from '../../ui/useDecoded';
import { PositionIcons } from './Positions';

export type Participant = LolLobbyLobbyParticipantDto;

/** Faixa de colunas do Palco. Uma no lobby comum; duas (azul e vermelha) na sala personalizada. */
export function Stage({ band, children }: { band?: 'blue' | 'red'; children: ComponentChildren }) {
  return (
    <div class="rlc-stage" data-band={band}>
      {children}
    </div>
  );
}

interface ColumnProps {
  member: Participant | null;
  profile: Lcu['profile'];
  name: Lcu['name'];
  splash: Lcu['game']['splash'];
  isLocal?: boolean;
  showPositions?: boolean;
  /** Rotas em alta da fila e se a fila obriga a escolher uma delas (ranqueadas). */
  scarce?: readonly string[];
  forceScarce?: boolean;
  /** Nome no lugar do nome do invocador (bots). */
  label?: string;
  /** Própria coluna: os ícones de posição abrem o seletor. */
  editPositions?: boolean;
  /** Fila ranqueada (chave do `queueMap`) cujo elo a coluna mostra; null sem elo. */
  rankQueue?: string | null;
  /** Menu ⋯ do líder. */
  menu?: ComponentChildren;
  /** Conteúdo da vaga vazia (convidar, trocar de time, bot). */
  empty?: ComponentChildren;
  /** Jogo Rápido: as vagas (campeão e rota) do membro, abaixo do elo. */
  slots?: ComponentChildren;
}

export function Column({ member, profile, name, splash: splashOf, isLocal = false, showPositions = false, scarce, forceScarce, label, editPositions = false, rankQueue = null, menu, empty, slots }: ColumnProps) {
  const splash = useDecoded(useSplash(member, profile, splashOf));
  const resolved = useName(member, name);
  if (!member) {
    return (
      <div class="rlc-col" data-empty="true">
        <div class="rlc-col-empty">{empty}</div>
      </div>
    );
  }
  const body = (
    <>
      <span class="rlc-col-name">
        <span class="rlc-col-nick">{label ?? resolved}</span>
        {member.isLeader ? <span class="rlc-col-leader" title={t('leaderMark')} aria-label={t('leaderMark')}> ★</span> : null}
      </span>
      {showPositions ? <PositionIcons first={member.firstPositionPreference} second={member.secondPositionPreference} editable={editPositions} scarce={scarce} force={forceScarce} /> : null}
      {member.isBot ? null : <Rank puuid={member.puuid} queue={rankQueue} />}
      {slots}
    </>
  );
  // Quem ainda não pode entrar na fila (atualizando, com o client ocupado) fica apagado com reticências no meio.
  const waiting = member.ready === false && !member.isBot;
  return (
    <div class="rlc-col" data-local={isLocal ? 'true' : undefined} data-unready={waiting ? 'true' : undefined}>
      {waiting ? (
        <span class="rlc-col-wait" role="status" aria-label={t('socNotReady')} title={t('socNotReady')}>
          <i />
          <i />
          <i />
        </span>
      ) : null}
      {splash ? <div class="rlc-col-splash" style={{ backgroundImage: `url("${splash}")` }} /> : null}
      <div class="rlc-col-info">{body}</div>
      {menu}
    </div>
  );
}

/** Nome do membro: `summonerName` quando vier, senão o Riot ID buscado pelo puuid. */
function useName(member: Participant | null, name: Lcu['name']): string {
  const [found, setFound] = useState<string | null>(null);
  const direct = member?.summonerName || null;
  const puuid = member && !direct && !member.isBot ? member.puuid : null;
  useEffect(() => {
    setFound(null);
    if (!puuid) return;
    let live = true;
    void name(puuid).then((n) => live && setFound(n));
    return () => void (live = false);
  }, [puuid, name]);
  return direct ?? found ?? '';
}

/** Splash do fundo de perfil do membro. Imagem que falha deixa só o gradiente da camada de baixo. */
function useSplash(member: Participant | null, profile: Lcu['profile'], splashOf: Lcu['game']['splash']): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const puuid = member && !member.isBot ? member.puuid : null;
  useEffect(() => {
    setUrl(null);
    if (!puuid) return;
    let live = true;
    void profile(puuid)
      .then((p) => splashOf(p?.backgroundSkinId))
      .then((u) => live && setUrl(u));
    return () => void (live = false);
  }, [puuid, profile, splashOf]);
  return url;
}

/**
 * Arena: vagas por subtime e posição (1 em diante, como a LCU manda em `subteamIndex` e `intraSubteamPosition`).
 * Quem vier sem subtime, ou numa vaga já ocupada, fica na primeira vaga livre.
 */
export function arenaTeams(members: Participant[], slots: number, size: number): (Participant | null)[][] {
  const teams = Array.from({ length: Math.ceil(Math.max(slots, members.length) / size) }, () => Array<Participant | null>(size).fill(null));
  const loose: Participant[] = [];
  for (const m of members) {
    const row = teams[(m.subteamIndex ?? 0) - 1];
    const i = (m.intraSubteamPosition ?? 0) - 1;
    if (row && i >= 0 && i < size && !row[i]) row[i] = m;
    else loose.push(m);
  }
  for (const m of loose) {
    const row = teams.find((r) => r.includes(null))!;
    row[row.indexOf(null)] = m;
  }
  return teams;
}
