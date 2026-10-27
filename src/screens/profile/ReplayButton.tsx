import { useEffect, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import { request } from '../../lcu/request';
import type { LolReplaysMetadataState } from '../../lcu/types';
import { getJson } from './data';

/** O que o client usa para registrar a partida (o mesmo botão de replay da Riot). */
export interface ReplayGame {
  gameId: number;
  queueId: number;
  gameType: string;
  gameVersion?: string;
  gameCreation?: number;
  gameDuration?: number;
}
interface Config {
  gameVersion?: string;
  isReplaysEnabled?: boolean;
  isReplaysForEndOfGameEnabled?: boolean;
  isReplaysForMatchHistoryEnabled?: boolean;
  isPatching?: boolean;
  isInTournament?: boolean;
  isPlayingGame?: boolean;
  isPlayingReplay?: boolean;
}
interface Meta {
  state: LolReplaysMetadataState;
  downloadProgress?: number;
}

const BASE = '/lol-replays';
/** Enquanto baixa ou confere, relê o estado nesse intervalo (a LCU não avisa o progresso por evento que usemos). */
export const REPLAY_POLL_MS = 1000;
const BUSY: ReadonlyArray<LolReplaysMetadataState> = ['checking', 'found', 'downloading'];
const LABEL: Record<LolReplaysMetadataState, TextKey> = {
  checking: 'rpyChecking',
  found: 'rpyChecking',
  download: 'rpyDownload',
  retryDownload: 'rpyRetry',
  downloading: 'rpyDownloading',
  watch: 'rpyWatch',
  incompatible: 'rpyIncompatible',
  missingOrExpired: 'rpyExpired',
  lost: 'rpyLost',
  error: 'rpyError',
  unsupported: 'rpyUnsupported',
};

/**
 * Botão de replay, como o do client: registra a partida (`v2/metadata/{id}/create`), acompanha o estado e oferece
 * Baixar, o progresso, Assistir ou o motivo de não haver replay. Some quando os replays estão desligados para este lugar.
 */
export function ReplayButton({ game, where }: { game: ReplayGame; where: 'match-history' | 'end-of-game' }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [tick, setTick] = useState(0);
  const componentType = `replay-button_${where}`;

  useEffect(() => {
    let live = true;
    setMeta(null);
    void (async () => {
      const c = await getJson<Config>(`${BASE}/v1/configuration`);
      if (!live) return;
      setConfig(c);
      if (!c?.isReplaysEnabled) return;
      const body: Record<string, unknown> = { gameVersion: game.gameVersion || c.gameVersion || 'unknown_version', gameType: game.gameType, queueId: game.queueId };
      if (game.gameCreation && game.gameDuration) body.gameEnd = game.gameCreation + game.gameDuration;
      await request('POST', `${BASE}/v2/metadata/${game.gameId}/create`, body).catch(() => {});
      if (live) setTick((n) => n + 1);
    })();
    return () => void (live = false);
  }, [game.gameId]);

  // Lê o estado depois do registro e, enquanto confere ou baixa, de novo a cada segundo.
  useEffect(() => {
    if (!tick) return;
    let live = true;
    void getJson<Meta>(`${BASE}/v1/metadata/${game.gameId}`).then((m) => live && setMeta(m));
    return () => void (live = false);
  }, [tick, game.gameId]);
  useEffect(() => {
    if (!meta || !BUSY.includes(meta.state)) return;
    const timer = setTimeout(() => setTick((n) => n + 1), REPLAY_POLL_MS);
    return () => clearTimeout(timer);
  }, [meta]);

  if (!config?.isReplaysEnabled) return null;
  if (where === 'match-history' && config.isReplaysForMatchHistoryEnabled === false) return null;
  if (where === 'end-of-game' && config.isReplaysForEndOfGameEnabled === false) return null;

  const state = meta?.state ?? 'checking';
  const blockedWatch = config.isPatching || config.isInTournament || config.isPlayingGame || config.isPlayingReplay;
  const run = (path: string) => {
    void request('POST', `${BASE}/v1/rofls/${game.gameId}/${path}`, { componentType })
      .catch(() => {})
      .then(() => setTick((n) => n + 1));
  };
  const progress = state === 'downloading' && typeof meta?.downloadProgress === 'number' && meta.downloadProgress >= 0 && meta.downloadProgress <= 100 ? Math.round(meta.downloadProgress) : null;
  const label = progress !== null ? `${t('rpyDownloading')} ${progress}%` : t(LABEL[state]);
  const action = state === 'download' || state === 'retryDownload' ? (config.isPatching ? null : () => run('download')) : state === 'watch' && !blockedWatch ? () => run('watch') : null;
  return (
    <button type="button" class="rlc-button rlc-replay" data-variant="pill" data-state={state} disabled={!action} title={label} onClick={() => action?.()}>
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        {state === 'watch' ? <path fill="currentColor" d="M8 5v14l11-7z" /> : <path fill="currentColor" d="M12 3v10.6l3.3-3.3 1.4 1.4L12 16.4l-4.7-4.7 1.4-1.4 3.3 3.3V3zM5 19h14v2H5z" />}
      </svg>
      <span>{label}</span>
      {progress !== null ? <i class="rlc-replay-bar" style={{ width: `${progress}%` }} aria-hidden="true" /> : null}
    </button>
  );
}
