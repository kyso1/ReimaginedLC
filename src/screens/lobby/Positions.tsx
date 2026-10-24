import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import { request } from '../../lcu/request';
import { RoleIcon } from '../../ui/RoleIcon';
import { useEscape } from '../../ui/useEscape';
import { POSITIONS, positionKey, type Position } from './format';

/** Nova dupla ao escolher `p` na vaga `slot`, como no client: repetir a outra vaga troca as duas; Preencher na principal dispensa a secundária. */
export function choose(first: string, second: string, slot: 0 | 1, p: Position): [string, string] {
  const valid = (x: string) => (positionKey(x) ? x : 'UNSELECTED');
  if (slot === 0) return [p, p === 'FILL' ? 'UNSELECTED' : second === p ? valid(first) : valid(second)];
  return [first === p ? valid(second) : valid(first), p];
}

/** Dois ícones de posição sob o nome. Na própria coluna são botões que abrem o seletor flutuante e salvam na hora. */
export function PositionIcons({ first, second, editable }: { first: string; second: string; editable: boolean }) {
  // Escolha mostrada já, até a LCU devolver o lobby novo.
  const [shown, setShown] = useState<[string, string] | null>(null);
  const [open, setOpen] = useState<0 | 1 | null>(null);
  useEffect(() => setShown(null), [first, second]);
  const [a, b] = shown ?? [first, second];
  const slots: Array<[0 | 1, string]> = a === 'FILL' ? [[0, a]] : [[0, a], [1, b]];
  const pick = (slot: 0 | 1, p: Position) => {
    setOpen(null);
    const next = choose(a, b, slot, p);
    setShown(next);
    void request('PUT', '/lol-lobby/v2/lobby/members/localMember/position-preferences', { firstPreference: next[0], secondPreference: next[1] }).catch(() => setShown(null));
  };
  return (
    <span class="rlc-pos">
      {slots.map(([slot, p]) => {
        const label = `${t(slot === 0 ? 'lobbyPosPrimary' : 'lobbyPosSecondary')}: ${t(positionKey(p) ?? 'lobbyPosNone')}`;
        return editable ? (
          <button type="button" key={slot} class="rlc-pos-slot" aria-label={label} title={label} aria-expanded={open === slot} onClick={() => setOpen(open === slot ? null : slot)}>
            <RoleIcon role={p} />
          </button>
        ) : (
          <span key={slot} class="rlc-pos-slot" title={label} role="img" aria-label={label}>
            <RoleIcon role={p} />
          </span>
        );
      })}
      {open !== null ? <Picker slot={open} current={open === 0 ? a : b} other={open === 0 ? b : a} onPick={(p) => pick(open, p)} onClose={() => setOpen(null)} /> : null}
    </span>
  );
}

/** Seletor flutuante: as 5 rotas e Preencher em linha. */
function Picker({ slot, current, other, onPick, onClose }: { slot: 0 | 1; current: string; other: string; onPick: (p: Position) => void; onClose: () => void }) {
  useEscape(onClose);
  return (
    <>
      <div class="rlc-menu-backdrop" onClick={onClose} />
      <div class="rlc-pos-picker" role="dialog" aria-label={t(slot === 0 ? 'lobbyPosPrimary' : 'lobbyPosSecondary')}>
        {POSITIONS.map((p) => (
          <button type="button" key={p} class="rlc-pos-option" aria-pressed={p === current} data-other={p === other ? 'true' : undefined} aria-label={t(positionKey(p)!)} title={t(positionKey(p)!)} onClick={() => onPick(p)}>
            <RoleIcon role={p} />
          </button>
        ))}
      </div>
    </>
  );
}
