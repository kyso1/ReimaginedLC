import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { Loader } from '../../ui/Loader';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { formatClock } from '../lobby/format';
import { byDay, getJson, ordinal, relativeDay } from './data';
import {
  activeTraits, art, band, costOf, inTftFilter, meIn, pairs, placeOf, queueOf, sortedUnits, tftAssets, tftMatches, tftStats, tftUrl, TFT_GROUPS,
  type TftArt, type TftAssets, type TftFilter, type TftMatch, type TftPlayer, type TftTrait, type TftUnit,
} from './tft';

const FILTERS: Record<TftFilter, TextKey> = { all: 'filterAll', ranked: 'filterRanked', normal: 'filterNormal', doubleup: 'pfTftDoubleUp', hyperroll: 'pfTftHyperRoll' };

export type Art = TftAssets & { companions: Map<string, TftArt> };

/** Catálogos de TFT e Pequenas Lendas; mapas vazios até chegar (e se a LCU falhar, os nomes saem do id). */
export function useTftArt(lcu: Lcu): Art {
  const [a, setA] = useState<Art>({ units: new Map(), items: new Map(), traits: new Map(), companions: new Map() });
  useEffect(() => {
    let live = true;
    void Promise.all([tftAssets(), lcu.game.companions()]).then(([x, companions]) => live && setA({ ...x, companions }));
    return () => void (live = false);
  }, [lcu]);
  return a;
}

export const pic = (x: TftArt | undefined, cls: string) => (x?.icon ? <img class={cls} src={x.icon} alt={x.name} title={x.name || undefined} /> : <span class={cls} title={x?.name || undefined} />);

export function Unit({ u, a, items }: { u: TftUnit; a: Art; items?: boolean }) {
  const x = art(a.units, u.character_id);
  const stars = Math.min(4, Math.max(1, u.tier ?? 1));
  return (
    <span class="rlc-tft-unit" data-cost={costOf(u)} data-stars={stars} title={x.name}>
      <span class="rlc-tft-stars" aria-label={`${stars}★`}>
        {'★'.repeat(stars)}
      </span>
      {x.icon ? <img src={x.icon} alt={x.name} /> : <span class="rlc-tft-noart">{x.name.slice(0, 3)}</span>}
      {items ? (
        <span class="rlc-tft-items">
          {(u.itemNames ?? []).map((id, i) => {
            const it = art(a.items, id);
            return it.icon ? <img key={i} src={it.icon} alt={it.name} title={it.name} /> : null;
          })}
        </span>
      ) : null}
    </span>
  );
}

export function Trait({ tr, a, named }: { tr: TftTrait; a: Art; named?: boolean }) {
  const x = art(a.traits, tr.name);
  return (
    <span class="rlc-tft-trait" data-style={Math.min(4, tr.style)} title={`${x.name} (${tr.num_units})`}>
      {x.icon ? <img src={x.icon} alt={x.name} /> : <i>{x.name}</i>}
      <b>{tr.num_units}</b>
      {named && x.icon ? <span>{x.name}</span> : null}
    </span>
  );
}

// O fim de jogo traz a arte direto; o nome completo ("Chibi Janna Previsão") sai do catálogo pela mesma arte.
const companionOf = (a: Art, p: TftPlayer | undefined): TftArt | undefined => {
  const c = p?.companion;
  if (!c?.icon) return a.companions.get(c?.content_ID ?? '');
  return [...a.companions.values()].find((x) => x.icon === c.icon) ?? { name: c.name ?? '', icon: c.icon };
};

/**
 * Histórico de TFT no quadro do perfil: feed por dia (colocação, Pequena Lenda, composição, traços, fila e duração),
 * filtro pelas filas que aparecem nas partidas e coluna com elo e médias; o clique abre a classificação dos oito.
 */
export function TftHistory({ lcu, puuid, head, elo }: { lcu: Lcu; puuid: string; head: ComponentChildren; elo: ComponentChildren }) {
  const [matches, setMatches] = useState<TftMatch[] | null>(null);
  const [filter, setFilter] = useState<TftFilter>('all');
  const [open, setOpen] = useState<{ gameId: number; originY: number } | null>(null);
  const a = useTftArt(lcu);
  useEffect(() => {
    let live = true;
    setMatches(null);
    void getJson<Parameters<typeof tftMatches>[0]>(tftUrl(puuid)).then((r) => live && setMatches(tftMatches(r)));
    return () => void (live = false);
  }, [puuid]);
  // A descrição é o nome curto da fila ("Ranqueada", "Double Up"); o nome longo repete "Teamfight Tactics".
  const queueName = (id: number) => {
    const q = lcu.queues.value.data?.find((x) => x.id === id);
    return q?.description || q?.name || '';
  };

  const list = matches ?? [];
  const opened = open ? list.find((m) => m.gameId === open.gameId) : undefined;
  if (opened) return <TftDetail m={opened} puuid={puuid} a={a} queue={queueName(queueOf(opened))} originY={open!.originY} onBack={() => setOpen(null)} />;
  // Só os chips das filas que existem nas partidas carregadas.
  const chips = (['all', ...Object.keys(TFT_GROUPS)] as TftFilter[]).filter((f) => f === 'all' || list.some((m) => inTftFilter(queueOf(m), f)));
  const days = byDay(list.filter((m) => inTftFilter(queueOf(m), filter)));
  return (
    <div class="rlc-pf-feedwrap">
      <div class="rlc-mh">
        {head}
        {chips.length > 2 ? (
          <div class="rlc-chip-row">
            {chips.map((f) => (
              <button type="button" key={f} class="rlc-queue-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {t(FILTERS[f])}
              </button>
            ))}
          </div>
        ) : null}
        <div class="rlc-mh-list">
          {days.map((d) => (
            <section key={d.label} class="rlc-pf-day">
              <h3>{d.label}</h3>
              <div>
                {d.games.map((m) => {
                  const p = meIn(m, puuid);
                  if (!p) return null;
                  return (
                    <button
                      type="button"
                      key={m.gameId}
                      class="rlc-mh-row rlc-tft-row"
                      data-band={band(m, p)}
                      onClick={(e) => setOpen({ gameId: m.gameId, originY: (e.currentTarget as HTMLElement).offsetTop })}
                    >
                      <b class="rlc-tft-place">{ordinal(placeOf(m, p))}</b>
                      {pic(companionOf(a, p), 'rlc-tft-legend')}
                      <span class="rlc-tft-body">
                        <span class="rlc-tft-units">
                          {sortedUnits(p)
                            .slice(0, 9)
                            .map((u, i) => (
                              <Unit key={i} u={u} a={a} />
                            ))}
                        </span>
                        <span class="rlc-tft-sub">
                          <span class="rlc-tft-traits">
                            {activeTraits(p)
                              .slice(0, 4)
                              .map((tr) => (
                                <Trait key={tr.name} tr={tr} a={a} />
                              ))}
                          </span>
                          <span class="rlc-mh-meta">{queueName(queueOf(m))}</span>
                        </span>
                      </span>
                      <small>{formatClock(m.game_length ?? 0)}</small>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          {matches ? null : <Loader small label={t('mhLoading')} />}
          {matches && !days.length ? <p class="rlc-muted">{t('pfTftNoGames')}</p> : null}
        </div>
      </div>
      <aside class="rlc-pf-aside">
        {elo}
        <TftSummary matches={list} puuid={puuid} a={a} />
      </aside>
    </div>
  );
}

const pct = (a: number, b: number) => `${Math.round((a / Math.max(1, b)) * 100)}%`;

/** Coluna: colocação média, % top 4 e % de 1º; colocações em fila (a mais recente à esquerda); traços e unidades mais usados. */
function TftSummary({ matches, puuid, a }: { matches: TftMatch[]; puuid: string; a: Art }) {
  const s = tftStats(matches, puuid);
  if (!s.games) return null;
  const dec = new Intl.NumberFormat(locale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  return (
    <>
      <div class="rlc-pf-panel">
        <h4>
          <span>{t('pfTftPlacements')}</span>
          <span>{`${t('profLast')} ${s.games}`}</span>
        </h4>
        <dl class="rlc-tft-numbers">
          <div>
            <dt>{t('pfTftAvgPlace')}</dt>
            <dd>{dec.format(s.avg)}</dd>
          </div>
          <div>
            <dt>{t('pfTftTop4')}</dt>
            <dd>{pct(s.top4, s.games)}</dd>
          </div>
          <div>
            <dt>{t('pfTftFirst')}</dt>
            <dd>{pct(s.wins, s.games)}</dd>
          </div>
        </dl>
        <ol class="rlc-tft-strip" aria-label={t('pfTftPlacements')}>
          {matches.map((m) => {
            const p = meIn(m, puuid);
            return p ? (
              <li key={m.gameId} data-band={band(m, p)}>
                {placeOf(m, p)}
              </li>
            ) : null;
          })}
        </ol>
      </div>
      {s.traits.length ? (
        <div class="rlc-pf-panel">
          <h4>{t('pfTftTopTraits')}</h4>
          <ul class="rlc-tft-top">
            {s.traits.map(([id, n]) => {
              const x = art(a.traits, id);
              return (
                <li key={id}>
                  {pic(x, 'rlc-tft-topicon')}
                  <span>{x.name}</span>
                  <span class="rlc-pf-bar">
                    <i style={{ width: pct(n, s.games) }} />
                  </span>
                  <small>{n}</small>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {s.units.length ? (
        <div class="rlc-pf-panel">
          <h4>{t('pfTftTopUnits')}</h4>
          <ul class="rlc-tft-topunits">
            {s.units.map(([id, n]) => {
              const x = art(a.units, id);
              return (
                <li key={id} title={x.name}>
                  {pic(x, 'rlc-tft-topunit')}
                  <span>{x.name}</span>
                  <small>{`${n}×`}</small>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </>
  );
}

/** Detalhe: a classificação dos oito, cada um com Pequena Lenda, nível, composição com itens e traços ativos. */
function TftDetail({ m, puuid, a, queue, originY, onBack }: { m: TftMatch; puuid: string; a: Art; queue: string; originY: number; onBack: () => void }) {
  const me = meIn(m, puuid);
  return (
    <div class="rlc-md rlc-tft-md" style={{ '--rlc-origin-y': `${originY}px` }}>
      <button type="button" class="rlc-button" data-variant="pill" onClick={onBack}>
        {t('backToHistory')}
      </button>
      <h2 class="rlc-md-result" data-band={me ? band(m, me) : undefined}>
        {me ? ordinal(placeOf(m, me)) : '—'}
      </h2>
      <p class="rlc-muted">{[queue, formatClock(m.game_length ?? 0), m.gameCreation ? relativeDay(m.gameCreation) : ''].filter(Boolean).join(' · ')}</p>
      <TftStandings m={m} me={me} a={a} />
    </div>
  );
}

/** A classificação dos oito: Pequena Lenda, nome, composição com itens e traços ativos; a sua realçada. Serve ao fim de jogo também. */
export function TftStandings({ m, me, a }: { m: TftMatch; me: TftPlayer | undefined; a: Art }) {
  const rows = [...m.participants].sort((x, y) => x.placement - y.placement);
  return (
    <ol class="rlc-tft-standings">
      {rows.map((p, i) => (
        <li key={p.puuid ?? i} data-me={p === me ? 'true' : undefined} data-band={band(m, p)} data-pair={pairs(m) ? p.partner_group_id : undefined}>
          <b class="rlc-tft-place">{ordinal(placeOf(m, p))}</b>
          {pic(companionOf(a, p), 'rlc-tft-legend')}
          <span class="rlc-tft-who" title={p.riotIdTagline ? `${p.riotIdGameName ?? ''}#${p.riotIdTagline}` : undefined}>
            <span>{p.riotIdGameName || '—'}</span>
            {p.level ? <small>{`${t('level')} ${p.level}`}</small> : null}
          </span>
          <span class="rlc-tft-units" data-size="lg">
            {sortedUnits(p).map((u, k) => (
              <Unit key={k} u={u} a={a} items />
            ))}
          </span>
          <span class="rlc-tft-traits">
            {activeTraits(p).map((tr) => (
              <Trait key={tr.name} tr={tr} a={a} />
            ))}
            {/* Aumentos (só o fim de jogo traz) no fim da linha dos traços, para não abrir coluna nova. */}
            {(p.augs ?? []).map((x, k) => (
              <span key={`a${k}`}>{pic(x, 'rlc-tft-aug')}</span>
            ))}
          </span>
        </li>
      ))}
    </ol>
  );
}
