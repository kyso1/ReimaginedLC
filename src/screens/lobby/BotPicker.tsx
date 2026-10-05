import { useEffect, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import { request } from '../../lcu/request';
import type { LolLobbyLobbyBotChampion } from '../../lcu/types';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';

const DIFFICULTY: Record<string, TextKey> = { INTRO: 'botINTRO', EASY: 'botEASY', MEDIUM: 'botMEDIUM', HARD: 'botHARD' };

/** Campeões disponíveis para bot. Leitura silenciosa: sem lista, o bot aparece como "Bot". */
export function useBots(enabled: boolean): LolLobbyLobbyBotChampion[] {
  const [bots, setBots] = useState<LolLobbyLobbyBotChampion[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    fetch('/lol-lobby/v2/lobby/custom/available-bots')
      .then((r) => (r.ok ? (r.json() as Promise<LolLobbyLobbyBotChampion[]>) : []))
      .then((list) => live && setBots(Array.isArray(list) ? list.filter((b) => b.active !== false) : []))
      .catch(() => {});
    return () => void (live = false);
  }, [enabled]);
  return bots;
}

export function BotPicker({ bots, teamId, onClose }: { bots: LolLobbyLobbyBotChampion[]; teamId: number; onClose: () => void }) {
  const [champion, setChampion] = useState<LolLobbyLobbyBotChampion | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  useEscape(onClose);
  const add = useAction(async () => {
    await request('POST', '/lol-lobby/v1/lobby/custom/bots', { championId: champion!.id, botDifficulty: difficulty, teamId: String(teamId) });
    onClose();
  });
  return (
    <div class="rlc-veil" role="dialog" aria-modal="true" aria-label={t('addBot')}>
      <div class="rlc-dialog rlc-bot-picker">
        <p>{t('champion')}</p>
        <div class="rlc-chip-row rlc-bot-list">
          {[...bots]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((b) => (
              <button
                type="button"
                key={b.id}
                class="rlc-queue-chip"
                aria-pressed={champion?.id === b.id}
                onClick={() => {
                  setChampion(b);
                  if (difficulty && !b.botDifficulties.includes(difficulty as never)) setDifficulty(null);
                }}
              >
                {b.name}
              </button>
            ))}
        </div>
        <p>{t('difficulty')}</p>
        <div class="rlc-chip-row">
          {(champion?.botDifficulties ?? []).map((d) => (
            <button type="button" key={d} class="rlc-queue-chip" aria-pressed={difficulty === d} onClick={() => setDifficulty(d)}>
              {DIFFICULTY[d] ? t(DIFFICULTY[d]) : d}
            </button>
          ))}
        </div>
        <div class="rlc-dialog-actions">
          <button type="button" class="rlc-button" data-variant="primary" disabled={!champion || !difficulty || add.pending} onClick={() => add.run()}>
            {t('add')}
          </button>
          <button type="button" class="rlc-button" onClick={onClose}>
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
