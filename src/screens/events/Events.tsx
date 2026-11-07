import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { ChoicePicker } from '../../shell/overlays/Rewards';
import { Confirm } from '../../shell/overlays/Confirm';
import { mountKiwiHub } from './kiwiHub';
import {
  claimAll, isKiwiHub, loadMenuEvents, daysLeft, eventPass, getJson, missionCards, openPassPurchase, pendingChoices, rewardState, selectChoice,
  type Choice, type Grant, type HubEvent, type Level, type MissionCard, type ObjectiveCategory, type Pass,
  type Reward, type TrackItem, type TrackProgress,
} from './data';

export { pendingClaims, openPassPurchase } from './data';

interface Loaded {
  lol: Array<{ pass: Pass; missions: MissionCard[]; kiwi: boolean }>;
}

const base = (id: string) => `/lol-event-hub/v1/events/${encodeURIComponent(id)}`;

async function loadLolEvent(e: HubEvent, categories: ObjectiveCategory[], choices: Map<string, Choice>) {
  const [items, bonus, progress, details, chapters, unclaimed, info] = await Promise.all([
    getJson<TrackItem[]>(`${base(e.eventId)}/reward-track/items`),
    getJson<TrackItem[]>(`${base(e.eventId)}/reward-track/bonus-items`),
    getJson<TrackProgress>(`${base(e.eventId)}/reward-track/progress`),
    getJson<{ actBackgroundImage?: string }>(`${base(e.eventId)}/event-details-data`),
    getJson<{ chapters?: Array<{ backgroundImage?: string; chapterStart: number; chapterEnd: number }> }>(`${base(e.eventId)}/chapters`),
    getJson<{ rewardsCount?: number }>(`${base(e.eventId)}/reward-track/unclaimed-rewards`),
    getJson<{ battleExpIcon?: string }>(`${base(e.eventId)}/info`),
  ]);
  const level = progress?.level ?? 0;
  // Arte do capítulo em que o jogador está; sem capítulo, a do ato; sem nenhuma, fica o fundo do tema.
  const chapter = chapters?.chapters?.find((c) => c.chapterStart <= Math.max(1, level) && Math.max(1, level) <= c.chapterEnd);
  const background = chapter?.backgroundImage || details?.actBackgroundImage || null;
  const pass = eventPass(e, [...(items ?? []), ...(bonus ?? [])], progress, background, choices, { unclaimed: unclaimed?.rewardsCount, xpIcon: info?.battleExpIcon });
  return { pass, missions: missionCards(categories, e.eventId, Date.now(), e.eventInfo.eventName), kiwi: isKiwiHub(e) };
}

async function loadAll(): Promise<Loaded> {
  const [events, objectives, grants] = await Promise.all([
    loadMenuEvents(),
    getJson<Array<{ objectivesCategories?: ObjectiveCategory[] }>>('/lol-objectives/v1/objectives/lol'),
    getJson<Grant[]>('/lol-rewards/v1/grants'),
  ]);
  const categories = objectives?.[0]?.objectivesCategories ?? [];
  const choices = pendingChoices(grants ?? []);
  const lol = (await Promise.all(events.map((e) => loadLolEvent(e, categories, choices)))).filter((x) => x.kiwi || x.pass.levels.length);
  return { lol };
}

/** Eventos: uma aba por evento do LoL ativo (o Clash tem tela própria). Só aparecem abas com dados. */
export function Events({ lcu }: { lcu: Lcu }) {
  void lcu;
  const [data, setData] = useState<Loaded | null>(null);
  const [tab, setTab] = useState<string | null>(null);
  const reload = () => loadAll().then(setData);
  useEffect(() => void reload(), []);

  if (!data) return <section class="rlc-events"><p class="rlc-ev-empty">{t('evLoading')}</p></section>;

  const tabs: Array<{ key: string; label: string; body: () => ComponentChildren }> = [
    ...data.lol.map(({ pass, missions, kiwi }) => {
      const track = () => <PassView key={pass.id} pass={pass} missions={missions} onChanged={reload} />;
      return { key: pass.id, label: pass.name, body: kiwi ? () => <KiwiHub key={pass.id} fallback={track} /> : track };
    }),
  ];
  if (!tabs.length) return <section class="rlc-events"><p class="rlc-ev-empty">{t('evNone')}</p></section>;
  const current = tabs.find((x) => x.key === tab) ?? tabs[0]!;

  return (
    <section class="rlc-events">
      <nav class="rlc-tabs-text rlc-ev-tabs">
        {tabs.map((x) => (
          <button type="button" key={x.key} aria-current={x.key === current.key ? 'page' : undefined} onClick={() => setTab(x.key)}>
            {x.label}
          </button>
        ))}
      </nav>
      {current.body()}
    </section>
  );
}

/** Hub do passe Mayhem, o do client; sem a API ou se ele falhar, a trilha comum (o `fallbackToBuiltIn` do client). */
function KiwiHub({ fallback }: { fallback: () => ComponentChildren }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const stop = mountKiwiHub(ref.current!, () => setFailed(true));
    if (!stop) setFailed(true);
    return stop ?? undefined;
  }, []);
  return failed ? <>{fallback()}</> : <div class="rlc-ev-kiwi" ref={ref} />;
}

const PAGE = 10;

const endsIn = (end: number | null) => {
  if (!end) return '';
  const d = daysLeft(end);
  return `${t('evEndsIn')} ${d} ${t(d === 1 ? 'evDay' : 'evDays')}`;
};

type Row = 'free' | 'premium';
type Sel = { level: number; row: Row };

/** Texto do estado do bloco (selo do detalhe e balão do bloco). */
function status(r: Reward, level: number): string {
  const s = rewardState(r);
  if (s === 'claimed') return t('evClaimed');
  if (s === 'ready') return t('evReady');
  if (s === 'pass') return t('evNeedsPass');
  return `${t('evReachLevel')} ${level}`;
}

/** Ícone largo (splash) cobre o bloco; ícone quadrado fica inteiro com respiro. */
const fitImage = (e: Event) => {
  const img = e.currentTarget as HTMLImageElement;
  if (img.naturalHeight && img.naturalWidth / img.naturalHeight > 1.3) img.dataset.fit = 'cover';
};

/** Trilha horizontal (decisão A): arte ao fundo, recompensa escolhida grande à esquerda, níveis embaixo, XP no pé. */
export function PassView({ pass, missions, onChanged }: { pass: Pass; missions: MissionCard[]; onChanged: () => void }) {
  // Abre no primeiro bloco resgatável; sem nenhum, no nível atual (passou do último, fica no último).
  const readyIndex = pass.levels.findIndex((l) => l.free?.ready || l.premium?.ready);
  const found = pass.levels.findIndex((l) => l.level >= pass.level);
  const focus = readyIndex >= 0 ? readyIndex : found < 0 ? pass.levels.length - 1 : found;
  const [sel, setSel] = useState<Sel>(() => {
    const l = pass.levels[focus];
    const row: Row = readyIndex >= 0 ? (l?.free?.ready ? 'free' : 'premium') : l?.premium ? 'premium' : 'free';
    return { level: l?.level ?? 0, row };
  });
  const [start, setStart] = useState(() => Math.max(0, Math.min(focus - 2, pass.levels.length - PAGE)));
  const [picking, setPicking] = useState<Choice | null>(null);
  const [buyNote, setBuyNote] = useState(false);
  const claim = useAction(async () => {
    await claimAll(pass);
    onChanged();
  });
  const choose = useAction(async (c: Choice, ids: string[]) => {
    await selectChoice(c, ids);
    setPicking(null);
    onChanged();
  });
  // Resgatar um bloco: escolha abre o seletor; o resto vai pelo claim-all, como no client oficial.
  const claimReward = (r: Reward) => (r.choice ? setPicking(r.choice) : claim.run());
  const chosenLevel = pass.levels.find((l) => l.level === sel.level);
  const chosen = chosenLevel?.[sel.row] ?? chosenLevel?.free ?? chosenLevel?.premium;
  const visible = pass.levels.slice(start, start + PAGE);
  const n = new Intl.NumberFormat(locale());
  const pct = pass.xpTotal ? Math.min(100, (pass.xp / pass.xpTotal) * 100) : 0;
  const readyCount = pass.levels.reduce((a, l) => a + Number(!!l.free?.ready) + Number(!!l.premium?.ready), 0);
  const toClaim = Math.max(pass.unclaimed, readyCount);

  return (
    <div class="rlc-ev-pass">
      <div class="rlc-ev-bg" style={pass.background ? { backgroundImage: `url("${pass.background}")` } : undefined} />
      <header class="rlc-ev-head">
        <div>
          <span class="rlc-ev-muted">{endsIn(pass.endsAt)}</span>
          <h2>{pass.name}</h2>
        </div>
        {toClaim > 0 ? (
          <div class="rlc-ev-claimbar">
            <span><b>{n.format(toClaim)}</b> {t('evToClaim')}</span>
            <button type="button" class="rlc-button" data-variant="primary" disabled={claim.pending} onClick={() => claim.run()}>
              {t('evClaimAll')}
            </button>
          </div>
        ) : null}
      </header>

      {chosen ? (
        <div class="rlc-ev-sel">
          <span class="rlc-ev-muted">
            {t('evReward')} · {t('evLevel')} {sel.level}
            {chosen.kind ? ` · ${t(chosen.kind)}` : ''}
          </span>
          <div class="rlc-ev-sel-main">
            {chosen.icon ? <img src={chosen.icon} alt="" /> : null}
            <div>
              <h3>{chosen.name}</h3>
              {chosen.description ? <p>{chosen.description}</p> : null}
              <span class="rlc-ev-state" data-state={rewardState(chosen)} data-premium={chosen.premium}>{status(chosen, sel.level)}</span>
            </div>
          </div>
          {chosen.ready || pass.buyable ? (
            <div class="rlc-ev-buy">
              {chosen.ready ? (
                <button type="button" class="rlc-button" data-variant="primary" disabled={claim.pending} onClick={() => claimReward(chosen)}>
                  {t(chosen.choice ? 'evChoose' : 'evClaim')}
                </button>
              ) : null}
              {pass.buyable ? (
                <button type="button" class="rlc-button" data-variant={chosen.ready ? undefined : 'primary'} onClick={() => setBuyNote(!openPassPurchase(pass.id))}>
                  {t('evBuy')}
                </button>
              ) : null}
              {buyNote ? <small class="rlc-ev-muted">{t('evBuyNote')}</small> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {missions.length ? <Missions missions={missions} /> : null}

      <div class="rlc-ev-track">
        <button type="button" class="rlc-ev-page" aria-label={t('evPrev')} disabled={start === 0} onClick={() => setStart(Math.max(0, start - PAGE))}>‹</button>
        <div class="rlc-ev-rows" aria-hidden="true">
          <span />
          <span>{t('evFree')}</span>
          <span>{t('evPremium')}</span>
        </div>
        {visible.map((l) => (
          <div key={l.level} class="rlc-ev-lvl" data-current={l.level === pass.level}>
            <i>{l.level}</i>
            <Cell level={l} row="free" sel={sel} busy={claim.pending} onSelect={setSel} onClaim={claimReward} />
            <Cell level={l} row="premium" sel={sel} busy={claim.pending} onSelect={setSel} onClaim={claimReward} />
          </div>
        ))}
        <button type="button" class="rlc-ev-page" aria-label={t('evNext')} disabled={start + PAGE >= pass.levels.length} onClick={() => setStart(Math.min(pass.levels.length - PAGE, start + PAGE))}>›</button>
      </div>

      <footer class="rlc-ev-foot">
        <b>{t('evLevel')} {pass.level}</b>
        <div class="rlc-ev-xp" role="progressbar" aria-valuemin={0} aria-valuemax={pass.xpTotal} aria-valuenow={pass.xp}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <span class="rlc-ev-muted rlc-ev-xpnum">
          {n.format(pass.xp)}/{n.format(pass.xpTotal)}
          {pass.xpIcon ? <img src={pass.xpIcon} alt="" /> : ' XP'}
        </span>
      </footer>

      {picking ? <ChoicePicker choice={picking} pending={choose.pending} onPick={(ids) => choose.run(picking, ids)} onCancel={() => setPicking(null)} /> : null}
    </div>
  );
}

function Cell({ level, row, sel, busy, onSelect, onClaim }: { level: Level; row: Row; sel: Sel; busy: boolean; onSelect: (s: Sel) => void; onClaim: (r: Reward) => void }) {
  const r = level[row];
  if (!r) return <div class="rlc-ev-rw" data-row={row} data-empty="true" />;
  const state = rewardState(r);
  return (
    <button
      type="button"
      class="rlc-ev-rw"
      data-row={row}
      data-state={state}
      aria-pressed={sel.level === level.level && sel.row === row}
      aria-label={`${t('evLevel')} ${level.level}: ${r.name}. ${status(r, level.level)}`}
      title={`${r.name}\n${status(r, level.level)}`}
      onClick={() => {
        onSelect({ level: level.level, row });
        if (state === 'ready' && !busy) onClaim(r);
      }}
    >
      {r.icon ? <img src={r.icon} alt="" onLoad={fitImage} /> : <span>{r.name}</span>}
      {state === 'claimed' ? <b class="rlc-ev-check" aria-hidden="true">✓</b> : null}
      {state === 'pass' || state === 'level' ? <LockIcon /> : null}
      {state === 'ready' ? <span class="rlc-ev-tag">{t(r.choice ? 'evChoose' : 'evClaim')}</span> : null}
    </button>
  );
}


const LockIcon = () => (
  <svg class="rlc-ev-lock" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

function Missions({ missions }: { missions: MissionCard[] }) {
  return (
    <aside class="rlc-ev-missions">
      <h3>{t('evMissions')}</h3>
      <div class="rlc-ev-mlist">
        {missions.map((m, i) => (
          <div key={i} class="rlc-ev-mission" data-done={m.done}>
            {m.group ? <span class="rlc-ev-muted">{m.group}{m.done ? ` · ${t('evDone')}` : ''}</span> : null}
            {m.title ? <b>{m.title}</b> : null}
            {m.lines.map((l, j) => (
              <div key={j} class="rlc-ev-mline">
                <span>{l.text}</span>
                <small>{l.current}/{l.total}</small>
              </div>
            ))}
            {m.reward ? <small class="rlc-ev-mreward">{m.reward}</small> : null}
          </div>
        ))}
      </div>
    </aside>
  );
}
