import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Champion } from '../../data/gamedata';
import type { Revealed } from './fx';
import type { BanSlot } from './logic';

/**
 * Faixa de banimentos sob o cabeçalho: uma vaga por banimento de cada time (o meu à esquerda). A vaga do campeão que
 * está sendo revelado fica vazia até o cartão da revelação pousar nela.
 */
export function BanStrip({ slots, champions, flying }: { slots: { mine: BanSlot[]; theirs: BanSlot[] }; champions: Map<number, Champion>; flying: Revealed[] | null }) {
  if (!slots.mine.length && !slots.theirs.length) return null;
  const group = (list: BanSlot[], ally: boolean) => (
    <div class="rlc-cs-bans" data-side={ally ? 'mine' : 'theirs'}>
      {list.map((s, i) => {
        const champ = s.state === 'done' ? champions.get(s.id) : undefined;
        const hold = flying?.some((f) => f.ally === ally && f.slot === i) === true;
        if (s.state === 'none') return <span key={i} data-slot={i} class="rlc-cs-ban rlc-cs-ban-none" role="img" aria-label={t('csBanNone')} title={t('csBanNone')} />;
        if (s.state === 'hidden') return <span key={i} data-slot={i} class="rlc-cs-ban" data-state="hidden" role="img" aria-label={t('csBanHidden')} title={t('csBanHidden')} />;
        if (!champ) return <span key={i} data-slot={i} class="rlc-cs-ban" data-state="empty" />;
        return (
          <span key={i} data-slot={i} class="rlc-cs-ban" data-state={hold ? 'landing' : 'done'} role="img" aria-label={champ.name} title={champ.name}>
            {champ.icon && !hold ? <img src={champ.icon} alt="" /> : null}
          </span>
        );
      })}
    </div>
  );
  return (
    <div class="rlc-cs-banstrip" role="group" aria-label={t('bans')}>
      {group(slots.mine, true)}
      {group(slots.theirs, false)}
    </div>
  );
}

/** Passos da revelação (ms desde o começo): virar, riscar e voar. Cabem em `REVEAL_MS` (fx.ts). */
const UP_MS = 200;
const STRUCK_MS = 900;
const HOME_MS = 2150;

/** Grupo da revelação na Arena: os banimentos de um time, que voam para o retrato de quem baniu. */
export interface RevealGroup {
  /** Índice do subtime (cor e chave). */
  team: number;
  title: string;
  list: Revealed[];
}

/**
 * Revelação dos banimentos: os cartões entram de costas no centro, viram um a um, levam o risco vermelho e a
 * rachadura, e voam para as vagas da faixa do topo (FLIP: mede a vaga de destino e anima só o `transform`).
 * Com `groups` (Arena: um grupo por time, de duplas ou trios), cada cartão voa para o banimento no retrato de quem
 * baniu (`data-ban-cell`). Só decoração: os mesmos campeões já estão na tela para leitores de tela.
 */
export function BanReveal({ bans, champions, groups }: { bans: Revealed[]; champions: Map<number, Champion>; groups?: RevealGroup[] }) {
  const [step, setStep] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timers = [UP_MS, STRUCK_MS, HOME_MS].map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);
  useLayoutEffect(() => {
    if (step < 3) return;
    const screen = box.current?.closest('.rlc-champselect');
    for (const el of box.current?.querySelectorAll<HTMLElement>('.rlc-cs-rv') ?? []) {
      const to = screen?.querySelector(groups ? `[data-ban-cell="${el.dataset.cell}"]` : `.rlc-cs-banstrip .rlc-cs-bans[data-side="${el.dataset.side}"] [data-slot="${el.dataset.slot}"]`)?.getBoundingClientRect();
      const from = el.getBoundingClientRect();
      // Sem medida (vaga fora da tela): o cartão só some com os outros.
      if (to?.width && from.width) el.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})`;
    }
  }, [step]);
  // `first`: atraso da virada do primeiro cartão da fileira (cada cartão seguinte vira 70 ms depois; na Arena o time vira junto).
  const row = (side: 'mine' | 'theirs', title: string, list: Revealed[], first: number, team?: number) => {
    if (!list.length) return null;
    return (
      <div key={team ?? side} class="rlc-cs-rv-row" data-side={side} data-team={team === undefined ? undefined : team % 8} style={{ '--n': String(list.length) }}>
        <span class="rlc-cs-rv-title">{title}</span>
        {list.map((b, i) => {
          const champ = champions.get(b.championId);
          return (
            <div key={team === undefined ? b.slot : b.cellId} class="rlc-cs-rv" data-side={side} data-slot={b.slot} data-cell={b.cellId} style={{ '--i': String(team === undefined ? i + first : first) }}>
              <div class="rlc-cs-rv-shake">
                <div class="rlc-cs-rv-in">
                  <div class="rlc-cs-rv-back">?</div>
                  <div class="rlc-cs-rv-front">
                    {champ?.icon ? <img src={champ.icon} alt="" /> : null}
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path pathLength={1} d="M8 4 L30 30 L22 44 L52 58 L44 74 L72 80 L94 98" />
                      <path pathLength={1} d="M52 58 L78 40 L96 44" />
                    </svg>
                  </div>
                </div>
              </div>
              <span class="rlc-cs-rv-name">{champ?.name ?? ''}</span>
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <div ref={box} class="rlc-cs-reveal" aria-hidden="true" data-arena={groups ? 'true' : undefined} style={groups ? { '--cols': String(Math.ceil(groups.length / 2)) } : undefined} data-up={step >= 1 ? 'true' : undefined} data-struck={step >= 2 ? 'true' : undefined} data-home={step >= 3 ? 'true' : undefined}>
      {groups
        ? groups.map((g, i) => row('theirs', g.title, g.list, i, g.team))
        : [row('mine', t('csBannedByAllies'), bans.filter((b) => b.ally), 0), row('theirs', t('csBannedByEnemies'), bans.filter((b) => !b.ally), 2)]}
    </div>
  );
}
