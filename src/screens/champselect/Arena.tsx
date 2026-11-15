import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Champion } from '../../data/gamedata';
import type { ArenaRound } from './logic';
import { Badge, BRAVERY_ICON, subteamLabel } from './Teams';

// Peças da seleção da Arena que não existem nos outros modos: a ordem de escolha, os favoritos da torcida (faixa do
// cabeçalho e apresentação) e a roleta da Ousadia. Tudo segue o que a LCU confirma; nada aqui envia nada.

/**
 * Ordem de escolha: uma linha por rodada (das ações da sessão), com os times de cada uma na cor deles. A rodada em
 * andamento fica acesa e as concluídas, apagadas. Sem ações de escolha na sessão, não aparece.
 */
export function ArenaOrder({ rounds, mine }: { rounds: ArenaRound[]; mine: number }) {
  if (!rounds.length) return null;
  return (
    <ol class="rlc-cs-rounds" aria-label={t('csPickOrder')}>
      <li class="rlc-cs-rounds-title" aria-hidden="true">
        {t('csPickOrder')}
      </li>
      {rounds.map((r, i) => (
        <li key={i} class="rlc-cs-rd" data-state={r.state} aria-current={r.state === 'now' ? 'step' : undefined}>
          <b aria-hidden="true">{i + 1}</b>
          <span>
            {r.teams.map((team) => (
              <i key={team} data-team={team % 8}>
                {subteamLabel(team)}
                {team === mine ? ` (${t('socYou').toLowerCase()})` : ''}
              </i>
            ))}
          </span>
        </li>
      ))}
    </ol>
  );
}

interface CrowdProps {
  ids: number[];
  champions: Map<number, Champion>;
  /** Campeões que já saíram (banidos ou escolhidos): ficam apagados. */
  taken: Map<number, unknown>;
}

/** Favoritos da torcida no cabeçalho: quem escolher um deles começa com bônus. */
export function CrowdFavs({ ids, champions, taken }: CrowdProps) {
  if (!ids.length) return null;
  return (
    <div class="rlc-cs-favs" role="group" aria-label={t('csCrowdFavs')}>
      <span>
        <Badge kind="crowd" /> {t('csCrowdFavs')}
      </span>
      {ids.map((id) => {
        const champ = champions.get(id);
        return (
          <i key={id} class="rlc-cs-fv" data-fav={id} data-taken={taken.has(id) ? 'true' : undefined} role="img" aria-label={champ?.name} title={champ?.name}>
            {champ?.icon ? <img src={champ.icon} alt="" /> : null}
          </i>
        );
      })}
    </div>
  );
}

/** Tempo da apresentação dos favoritos: entram no centro e, em `FAV_HOME_MS`, sobem para o cabeçalho. */
export const FAV_MS = 3000;
const FAV_HOME_MS = 2200;

/**
 * Apresentação dos favoritos da torcida quando a lista chega: os retratos entram grandes no centro e depois voam para
 * a faixa do cabeçalho (FLIP: mede o destino e anima só o `transform`). Só decoração: a faixa já tem os mesmos nomes.
 */
export function CrowdIntro({ ids, champions }: Omit<CrowdProps, 'taken'>) {
  const [home, setHome] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => setHome(true), FAV_HOME_MS);
    return () => clearTimeout(timer);
  }, []);
  useLayoutEffect(() => {
    if (!home) return;
    const screen = box.current?.closest('.rlc-champselect');
    for (const el of box.current?.querySelectorAll<HTMLElement>('.rlc-cs-fvb > i') ?? []) {
      const to = screen?.querySelector(`.rlc-cs-favs [data-fav="${el.dataset.fav}"]`)?.getBoundingClientRect();
      const from = el.getBoundingClientRect();
      if (to?.width && from.width) el.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})`;
    }
  }, [home]);
  return (
    <div ref={box} class="rlc-cs-favshow" aria-hidden="true" data-home={home ? 'true' : undefined}>
      <small>{t('csCrowdChose')}</small>
      <strong>{t('csCrowdFavs')}</strong>
      <div>
        {ids.map((id, i) => {
          const champ = champions.get(id);
          return (
            <span key={id} class="rlc-cs-fvb" style={{ '--i': String(i) }}>
              <i data-fav={id}>{champ?.icon ? <img src={champ.icon} alt="" /> : null}</i>
              <b>{champ?.name ?? ''}</b>
            </span>
          );
        })}
      </div>
      <em>{t('csCrowdBonus')}</em>
    </div>
  );
}

/** Quantos retratos passam na roleta antes de ela parar. */
const REEL_FACES = 10;

/**
 * Roleta da Ousadia: retratos de campeões passam no centro e ela para na Ousadia, com um clarão (o campeão sorteado
 * só aparece no carregamento da partida, então não há o que revelar aqui). `seed` varia os retratos de uma vez para
 * a outra. Só decoração: quem foi de Ousadia está escrito no palco e marcado com o selo.
 */
export function BraveReel({ champions, seed }: { champions: Map<number, Champion>; seed: number }) {
  const [spin, setSpin] = useState(false);
  // No quadro seguinte ao de montar, para a transição ter de onde partir.
  useEffect(() => {
    const id = requestAnimationFrame(() => setSpin(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const all = [...champions.values()].filter((c) => c.id > 0 && c.icon);
  const step = Math.max(1, Math.floor(all.length / REEL_FACES));
  const faces = all.length ? Array.from({ length: Math.min(REEL_FACES, all.length) }, (_, i) => all[(Math.abs(seed) * 7 + i * step) % all.length]!.icon) : [];
  return (
    <div class="rlc-cs-reel" aria-hidden="true" data-spin={spin ? 'true' : undefined}>
      <span>
        <div style={{ transform: spin ? `translateY(-${(faces.length / (faces.length + 1)) * 100}%)` : undefined }}>
          {[...faces, BRAVERY_ICON].map((src, i) => (
            <i key={i} style={{ backgroundImage: `url("${src}")` }} />
          ))}
        </div>
      </span>
      <i class="rlc-cs-reel-flash" />
    </div>
  );
}
