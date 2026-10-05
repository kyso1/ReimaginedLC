import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import type { LolLobbyLobbyParticipantDto } from '../../lcu/types';
import { positionKey, splashUrl } from './format';

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
}

export function Column({ member, profile, isLocal = false, showPositions = false, label, onSelf, menu, empty }: ColumnProps) {
  const splash = useSplash(member, profile);
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
        {label ?? member.summonerName}
        {member.isLeader ? <span class="rlc-col-leader" title={t('leaderMark')} aria-label={t('leaderMark')}> ★</span> : null}
      </span>
      {positions.length ? <span class="rlc-col-pos">{positions.map((k) => t(k)).join(' · ')}</span> : null}
    </>
  );
  return (
    <div class="rlc-col" data-local={isLocal ? 'true' : undefined} style={splash ? { backgroundImage: `url("${splash}"), var(--rlc-col-base)` } : undefined}>
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

/** Splash do fundo de perfil do membro. Imagem que falha deixa só o gradiente da camada de baixo. */
function useSplash(member: Participant | null, profile: Lcu['profile']): string | null {
  const [url, setUrl] = useState<string | null>(null);
  const puuid = member && !member.isBot ? member.puuid : null;
  useEffect(() => {
    setUrl(null);
    if (!puuid) return;
    let live = true;
    void profile(puuid).then((p) => live && setUrl(splashUrl(p?.backgroundSkinId)));
    return () => void (live = false);
  }, [puuid, profile]);
  return url;
}
