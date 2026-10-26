import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import { Reveal, type RevealItem } from '../../ui/Reveal';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';

/** Escolha pendente de uma concessão: até `max` opções, ao menos `min`. */
export interface Choice {
  grantId: string;
  rewardGroupId: string;
  min: number;
  max: number;
  options: Array<{ id: string; name: string; icon: string }>;
}

/** Concessão de `/lol-rewards/v1/grants` (recompensas de missão, do passe, do ARAM Caos e de eventos). */
export interface RewardGrant {
  info: { id: string; rewardGroupId: string; status: string; viewed?: boolean; selectedIds?: string[]; grantElements?: Array<{ elementId: string }> };
  rewardGroup: {
    celebrationType?: string;
    rewardStrategy?: string;
    localizations?: { title?: string };
    selectionStrategyConfig?: { minSelectionsAllowed: number; maxSelectionsAllowed: number } | null;
    rewards: Array<{ id: string; localizations: { title?: string }; media: { iconUrl?: string; splashImage?: string } }>;
  };
}

/** Escolha que precisa do jogador. Grupo com tantas opções quanto escolhas não é escolha: o servidor resolve. */
export function choiceOf(g: RewardGrant): Choice | null {
  const cfg = g.rewardGroup.selectionStrategyConfig;
  const max = cfg?.maxSelectionsAllowed ?? 1;
  if (g.info.status !== 'PENDING_SELECTION' || g.rewardGroup.rewards.length <= max) return null;
  return {
    grantId: g.info.id, rewardGroupId: g.info.rewardGroupId, min: cfg?.minSelectionsAllowed ?? 1, max,
    options: g.rewardGroup.rewards.map((r) => ({ id: r.id, name: r.localizations.title ?? '', icon: r.media.iconUrl ?? '' })),
  };
}

/** O que a concessão deu: na seleção, só os escolhidos (elementos entregues); senão o grupo todo. */
export function grantItems(g: RewardGrant): RevealItem[] {
  const given = new Set([...(g.info.selectedIds ?? []), ...(g.info.grantElements ?? []).map((e) => e.elementId)]);
  const rewards = given.size ? g.rewardGroup.rewards.filter((r) => given.has(r.id)) : g.rewardGroup.rewards;
  return rewards.map((r) => ({ name: r.localizations.title ?? '', art: r.media.iconUrl || r.media.splashImage || undefined }));
}

/** Concessões a mostrar: não vistas, com celebração, e as escolhas pendentes (mesmo vistas, esperam o jogador). */
export function toCelebrate(grants: RewardGrant[]): RewardGrant[] {
  return grants.filter((g) => choiceOf(g) || (g.info.viewed === false && g.rewardGroup.celebrationType !== 'NONE' && g.info.status !== 'PENDING_SELECTION'));
}

/** Escolha de recompensa, como o client oficial (rcp-fe-lol-shared-components): POST na concessão pendente. */
export const selectChoice = (c: Choice, selections: string[]) =>
  request('POST', `/lol-rewards/v1/grants/${encodeURIComponent(c.grantId)}/select`, { grantId: c.grantId, rewardGroupId: c.rewardGroupId, selections });

const GRANTS = '/lol-rewards/v1/grants';
const markViewed = (ids: string[]) => fetch(`${GRANTS}/view`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ids) }).catch(() => {});

/**
 * Recompensas que chegam fora das telas de espólio (fim de partida, ARAM Caos, missões, eventos): uma por vez, como
 * a celebração do client. Escolha pendente abre o seletor; o resto é revelado e marcado como visto ao fechar.
 */
export function Rewards({ lcu }: { lcu: Lcu }) {
  const [queue, setQueue] = useState<RewardGrant[]>([]);
  // Fechadas nesta sessão: não voltam enquanto a LCU não confirma o "visto".
  const [done] = useState(() => new Set<string>());
  useEffect(() => {
    let live = true;
    const load = () =>
      void fetch(GRANTS)
        .then((r) => (r.ok ? r.json() : []))
        .then((list: unknown) => live && Array.isArray(list) && setQueue(toCelebrate(list as RewardGrant[]).filter((g) => !done.has(g.info.id))))
        .catch(() => {});
    load();
    const off = lcu.events.onPrefix(GRANTS, () => load());
    return () => {
      live = false;
      off();
    };
  }, [lcu]);
  const choose = useAction(async (c: Choice, ids: string[]) => {
    await selectChoice(c, ids);
    close(c.grantId);
  });
  const g = queue[0];
  if (!g) return null;
  function close(id: string) {
    done.add(id);
    void markViewed([id]);
    setQueue((q) => q.filter((x) => x.info.id !== id));
  }
  const choice = choiceOf(g);
  if (choice) return <ChoicePicker choice={choice} title={g.rewardGroup.localizations?.title} pending={choose.pending} onPick={(ids) => choose.run(choice, ids)} onCancel={() => setQueue((q) => (done.add(g.info.id), q.slice(1)))} />;
  return <Reveal key={g.info.id} title={g.rewardGroup.localizations?.title?.trim() || t('lootReceived')} items={grantItems(g)} onClose={() => close(g.info.id)} />;
}

/** Seletor da recompensa de escolha: marca até `max` opções e confirma. */
export function ChoicePicker({ choice, title, pending, onPick, onCancel }: { choice: Choice; title?: string; pending: boolean; onPick: (ids: string[]) => void; onCancel: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  useEscape(onCancel);
  const toggle = (id: string) =>
    setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : choice.max === 1 ? [id] : picked.length < choice.max ? [...picked, id] : picked);
  return (
    <div class="rlc-veil" role="dialog" aria-modal="true" aria-label={t('evChooseTitle')}>
      <div class="rlc-dialog rlc-ev-choice">
        {title?.trim() ? <h2>{title.trim()}</h2> : null}
        <p>{t('evChooseTitle')}{choice.max > 1 ? ` (${picked.length}/${choice.max})` : ''}</p>
        <div class="rlc-ev-options">
          {choice.options.map((o) => (
            <button type="button" key={o.id} class="rlc-ev-option" aria-pressed={picked.includes(o.id)} onClick={() => toggle(o.id)}>
              {o.icon ? <img src={o.icon} alt="" /> : null}
              <span>{o.name}</span>
            </button>
          ))}
        </div>
        <div class="rlc-dialog-actions">
          <button type="button" class="rlc-button" data-variant="primary" disabled={pending || picked.length < choice.min} onClick={() => onPick(picked)}>
            {t('evChooseConfirm')}
          </button>
          <button type="button" class="rlc-button" onClick={onCancel}>{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}
