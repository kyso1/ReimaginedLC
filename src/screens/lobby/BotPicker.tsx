import { useEffect, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import { request } from '../../lcu/request';
import type { GameData } from '../../data/gamedata';
import type { LolLobbyLobbyBotChampion } from '../../lcu/types';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { matchesName } from '../../ui/champSearch';

const DIFFICULTY: Record<string, TextKey> = {
  INTRO: 'botINTRO', RSINTRO: 'botINTRO', EASY: 'botEASY', RSBEGINNER: 'botEASY', MEDIUM: 'botMEDIUM', RSINTERMEDIATE: 'botMEDIUM', HARD: 'botHARD',
};

const getJson = <T,>(url: string): Promise<T | null> => fetch(url).then((r) => (r.ok ? (r.json() as Promise<T>) : null));

/**
 * Campeões disponíveis para bot, com o nome tirado do champion-summary (a LCU manda o id no campo `name`).
 * Leitura silenciosa: sem lista, o bot aparece como "Bot".
 */
export type Bot = LolLobbyLobbyBotChampion & { icon?: string };

export function useBots(enabled: boolean, game: GameData): Bot[] {
  const [bots, setBots] = useState<Bot[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    Promise.all([getJson<LolLobbyLobbyBotChampion[]>('/lol-lobby/v2/lobby/custom/available-bots'), game.champions()])
      .then(([list, champions]) => {
        if (!live || !Array.isArray(list)) return;
        setBots(list.filter((b) => b.active !== false).map((b) => ({ ...b, name: champions.get(b.id)?.name ?? b.name, icon: champions.get(b.id)?.icon })));
      })
      .catch(() => {});
    return () => void (live = false);
  }, [enabled, game]);
  return bots;
}

export function BotPicker({ bots, teamId, onClose }: { bots: Bot[]; teamId: number; onClose: () => void }) {
  const [champion, setChampion] = useState<Bot | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  useEscape(onClose);
  const add = useAction(async () => {
    // A LCU exige os cinco campos, `teamId` como texto e uma posição válida (testado no client: '' e 'UNSELECTED' são recusados).
    await request('POST', '/lol-lobby/v1/lobby/custom/bots', { championId: champion!.id, botDifficulty: difficulty, teamId: String(teamId), position: 'MIDDLE', botUuid: '' });
    onClose();
  });
  const list = bots.filter((b) => matchesName(query, b.name)).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div class="rlc-veil" role="dialog" aria-modal="true" aria-label={t('botTitle')}>
      <div class="rlc-dialog rlc-bot-picker">
        <header>
          <h2>{t('botTitle')}</h2>
          <input class="rlc-input" aria-label={t('searchChampion')} placeholder={t('searchChampion')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
        </header>
        <div class="rlc-bot-grid">
          {list.map((b) => (
            <button
              type="button"
              key={b.id}
              class="rlc-bot-champ"
              aria-pressed={champion?.id === b.id}
              onClick={() => {
                setChampion(b);
                // Mantém a dificuldade se o campeão a tiver; senão já marca a primeira, para o Adicionar não ficar travado.
                if (!difficulty || !b.botDifficulties.includes(difficulty as never)) setDifficulty(b.botDifficulties[0] ?? null);
              }}
            >
              {b.icon ? <img src={b.icon} alt="" loading="lazy" decoding="async" /> : <i aria-hidden="true" />}
              <span>{b.name}</span>
            </button>
          ))}
        </div>
        <div class="rlc-dialog-actions">
          <div class="rlc-bot-diff" role="group" aria-label={t('difficulty')}>
            {(champion?.botDifficulties ?? []).map((d) => (
              <button type="button" key={d} aria-pressed={difficulty === d} onClick={() => setDifficulty(d)}>
                {DIFFICULTY[d] ? t(DIFFICULTY[d]) : d}
              </button>
            ))}
          </div>
          <button type="button" class="rlc-button" onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="button" class="rlc-button" data-variant="primary" disabled={!champion || !difficulty || add.pending} onClick={() => add.run()}>
            {t('add')}
          </button>
        </div>
      </div>
    </div>
  );
}
