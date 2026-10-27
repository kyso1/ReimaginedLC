import { createPortal, type ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { statsOf, type Entry } from '../../ui/Rank';
import { profileIcon, useBanner } from '../social/FriendCard';
import { tierLabel } from './data';

export interface CardPlayer {
  puuid: string;
  name: string;
  tag?: string;
  icon?: number;
}

/** Espera com o mouse parado no nome antes do cartão (passar pela tabela não pisca cartões). */
export const HOVER_DELAY_MS = 350;
const CARD_W = 264;
const CARD_H = 250;
const RANK_ROWS: Array<[string, TextKey]> = [
  ['RANKED_SOLO_5x5', 'rankedSolo'],
  ['RANKED_FLEX_SR', 'rankedFlex'],
];

/**
 * Nome de um jogador da partida: com o mouse parado em cima, um cartão com o fundo de perfil, o ícone, o Riot ID e o
 * elo (Solo/Duo e Flex), sem abrir o perfil. O cartão vai solto na tela, ao lado do nome.
 */
export function PlayerHover({ lcu, player, children }: { lcu: Lcu; player: CardPlayer; children: ComponentChildren }) {
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (el: HTMLElement) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const r = el.getBoundingClientRect();
      // À direita do nome; sem espaço, à esquerda. Na altura do nome, sem sair da tela.
      const left = r.right + 12 + CARD_W <= window.innerWidth ? r.right + 12 : Math.max(8, r.left - CARD_W - 12);
      const top = Math.min(Math.max(8, r.top - 24), window.innerHeight - CARD_H - 8);
      setAt({ left, top });
    }, HOVER_DELAY_MS);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setAt(null);
  };
  const root = document.getElementById('rlc-root');
  return (
    <span class="rlc-phover" onMouseEnter={(e) => show(e.currentTarget)} onMouseLeave={hide}>
      {children}
      {at && root ? createPortal(<PlayerCard lcu={lcu} player={player} at={at} />, root) : null}
    </span>
  );
}

function PlayerCard({ lcu, player, at }: { lcu: Lcu; player: CardPlayer; at: { left: number; top: number } }) {
  const banner = useBanner(lcu, player.puuid);
  const [ranks, setRanks] = useState<Record<string, Entry> | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void statsOf(player.puuid).then((m) => live && setRanks(m));
    return () => void (live = false);
  }, [player.puuid]);
  const rows = RANK_ROWS.map(([q, label]) => ({ label, e: ranks?.[q], text: tierLabel(ranks?.[q]?.tier, ranks?.[q]?.division) })).filter((r) => r.text);
  return (
    <div class="rlc-fcard rlc-pcard" role="tooltip" style={{ left: `${at.left}px`, top: `${at.top}px` }}>
      {banner ? <div class="rlc-fcard-banner" aria-hidden="true" style={{ backgroundImage: `url("${banner}")` }} /> : null}
      <div class="rlc-fcard-head">
        <span class="rlc-fcard-icon">{player.icon ? <img src={profileIcon(player.icon)} alt="" /> : null}</span>
        <span class="rlc-fcard-id">
          <strong>
            {player.name}
            {player.tag ? <small>#{player.tag}</small> : null}
          </strong>
        </span>
      </div>
      {ranks === undefined ? null : rows.length ? (
        <ul class="rlc-pcard-ranks">
          {rows.map((r) => (
            <li key={r.label}>
              <img src={`/fe/lol-static-assets/images/ranked-mini-crests/${r.e!.tier!.toLowerCase()}.svg`} alt="" />
              <span>{t(r.label)}</span>
              <b>{`${r.text} · ${r.e!.leaguePoints ?? 0} ${t('lp')}`}</b>
            </li>
          ))}
        </ul>
      ) : (
        <p class="rlc-pcard-unranked">{t('unranked')}</p>
      )}
    </div>
  );
}
