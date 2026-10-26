import { useEffect, useState } from 'preact/hooks';
import { locale, t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { clashDates, getJson, type ClashPlayer, type ClashTournament } from '../events/data';

interface Data {
  player: ClashPlayer | null;
  /** Pontos da temporada; a LCU manda -1 sem temporada. */
  points: number | null;
  dates: number[];
}

async function load(now = Date.now()): Promise<Data> {
  const [player, rewards, tournaments] = await Promise.all([
    getJson<ClashPlayer>('/lol-clash/v1/player'),
    getJson<{ seasonVp?: number }>('/lol-clash/v1/rewards'),
    getJson<ClashTournament[]>('/lol-clash/v1/all-tournaments'),
  ]);
  const vp = rewards?.seasonVp ?? -1;
  return { player, points: vp >= 0 ? vp : null, dates: clashDates(tournaments ?? [], now) };
}

const ROMAN = ['', 'I', 'II', 'III', 'IV'];

/** Clash: troféu desenhado no topo, patamar, pontos e ingressos, e os próximos dias de torneio. */
export function Clash({ lcu }: { lcu: Lcu }) {
  void lcu;
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => void load().then(setData), []);
  const n = new Intl.NumberFormat(locale());
  const date = new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const player = data?.player;
  const tickets = player?.tickets ?? {};
  // Patamar 1 a 4; fora disso (-1, sem patamar ainda) mostra traço.
  const tier = player && player.tier >= 1 ? (ROMAN[player.tier] ?? String(player.tier)) : '—';
  return (
    <section class="rlc-clash">
      <header class="rlc-clash-hero">
        <Trophy />
        <div>
          <h1>{t('evClash')}</h1>
          <p class="rlc-muted">{data ? (data.dates.length ? `${t('evClashNext')} ${date.format(data.dates[0]!)}` : t('evClashNone')) : t('evLoading')}</p>
        </div>
      </header>
      {player?.isClashBanned ? <p class="rlc-ev-note">{t('evClashBanned')}</p> : null}
      {data ? (
        <>
          <div class="rlc-ev-stats">
            <div>
              <span class="rlc-ev-muted">{t('evClashTier')}</span>
              <b>{tier}</b>
            </div>
            <div>
              <span class="rlc-ev-muted">{t('evClashPoints')}</span>
              <b>{data.points !== null ? n.format(data.points) : '—'}</b>
            </div>
            <div>
              <span class="rlc-ev-muted">{t('evClashTickets')}</span>
              <b>
                {n.format(tickets.BASIC ?? 0)} <small>{t('evClashBasic')}</small> · {n.format(tickets.PREMIUM ?? 0)} <small>{t('evClashPremium')}</small>
              </b>
            </div>
          </div>
          <h3>{t('evClashSchedule')}</h3>
          {data.dates.length ? (
            <ul class="rlc-ev-dates">
              {data.dates.map((d) => (
                <li key={d}>{date.format(d)}</li>
              ))}
            </ul>
          ) : (
            <p class="rlc-muted">{t('evClashNone')}</p>
          )}
        </>
      ) : null}
    </section>
  );
}

/** Troféu do Clash em traço: taça com alças, haste, base em degraus e uma estrela gravada. */
function Trophy() {
  return (
    <svg class="rlc-clash-trophy" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id="rlc-clash-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--rlc-color-highlight, #e7c25a)' }} />
          <stop offset="1" style={{ stopColor: 'var(--rlc-color-accent, #b8862f)' }} />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#rlc-clash-gold)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
        <path d="M34 16h52v26c0 16-11.6 28-26 28S34 58 34 42z" />
        <path d="M34 24H18v6c0 12 8 20 18 21M86 24h16v6c0 12-8 20-18 21" />
        <path d="M60 70v14M48 84h24l4 10H44z" />
        <path d="M36 94h48v10H36z" />
      </g>
      <path d="M60 28l3.5 7.2 7.9 1.1-5.7 5.6 1.4 7.9L60 46.1l-7.1 3.7 1.4-7.9-5.7-5.6 7.9-1.1z" fill="url(#rlc-clash-gold)" />
    </svg>
  );
}
