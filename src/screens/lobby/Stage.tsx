import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import type { LolLobbyLobbyParticipantDto } from '../../lcu/types';
import { useDecoded } from '../../ui/useDecoded';
import { positionKey } from './format';

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
  /** Nome no lugar do nome do invocador (bots). */
  label?: string;
  /** Clique na própria coluna (escolha de posições). */
  onSelf?: () => void;
  /** Menu ⋯ do líder. */
  menu?: ComponentChildren;
  /** Conteúdo da vaga vazia (convidar, trocar de time, bot). */
  empty?: ComponentChildren;
  /** TFT: Pequenas Lendas por contentId; a coluna mostra a do membro no lugar da splash. */
  companions?: Lcu['game']['companions'];
}

export function Column({ member, profile, name, splash: splashOf, isLocal = false, showPositions = false, label, onSelf, menu, empty, companions }: ColumnProps) {
  const legend = useLegend(companions ? member : null, companions);
  const splash = useDecoded(useSplash(companions ? null : member, profile, splashOf));
  const resolved = useName(member, name);
  if (!member) {
    return (
      <div class="rlc-col" data-empty="true">
        <div class="rlc-col-empty">{empty}</div>
      </div>
    );
  }
  const positions = showPositions ? [member.firstPositionPreference, member.secondPositionPreference].map(positionKey).filter((k) => k !== null) : [];
  const body = (
    <>
      <span class="rlc-col-name">
        {label ?? resolved}
        {member.isLeader ? <span class="rlc-col-leader" title={t('leaderMark')} aria-label={t('leaderMark')}> ★</span> : null}
      </span>
      {positions.length ? <span class="rlc-col-pos">{positions.map((k) => t(k)).join(' · ')}</span> : null}
    </>
  );
  return (
    <div class="rlc-col" data-local={isLocal ? 'true' : undefined}>
      {splash ? <div class="rlc-col-splash" style={{ backgroundImage: `url("${splash}")` }} /> : null}
      {legend ? (
        <div class="rlc-col-legend" title={legend.name}>
          <img src={legend.icon} alt={legend.name} />
        </div>
      ) : null}
      {onSelf ? (
        <button type="button" class="rlc-col-main" aria-label={t('positions')} onClick={onSelf}>
          {body}
        </button>
      ) : (
        <div class="rlc-col-info">{body}</div>
      )}
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

/** Pequena Lenda equipada do membro, pelo contentId que o lobby de TFT manda. */
function useLegend(member: Participant | null, companions: Lcu['game']['companions'] | undefined) {
  const [legend, setLegend] = useState<{ name: string; icon: string } | null>(null);
  const contentId = (member as { memberData?: Record<string, string> } | null)?.memberData?.['TFT.Tactician'] ?? null;
  useEffect(() => {
    setLegend(null);
    if (!contentId || !companions) return;
    let live = true;
    void companions().then((m) => {
      const c = m.get(contentId);
      if (live && c?.icon) setLegend(c);
    });
    return () => void (live = false);
  }, [contentId, companions]);
  return legend;
}
