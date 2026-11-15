import { t, type TextKey } from '../../i18n';
import type { Champion } from '../../data/gamedata';
import { request } from '../../lcu/request';
import type { TeamBuilderDirect_ChampSelectSwapContract } from '../../lcu/types';
import { MemberMenu } from '../lobby/MemberMenu';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useAction } from '../../ui/useAction';
import type { Cell, Session } from './logic';
import { reducedMotion } from './scene/stage';

const BASE = '/lol-champ-select/v1/session';

/** Campo da sessão, rota das ações e textos de cada tipo de troca. A sessão e as rotas usam nomes diferentes. */
const KINDS = [
  { field: 'trades', route: 'champion-swaps', offer: 'swapChampion', incoming: 'swapChampionIncoming' },
  { field: 'pickOrderSwaps', route: 'pick-order-swaps', offer: 'swapOrder', incoming: 'swapOrderIncoming' },
  { field: 'positionSwaps', route: 'position-swaps', offer: 'swapPosition', incoming: 'swapPositionIncoming' },
] as const satisfies ReadonlyArray<{ field: keyof Session; route: string; offer: TextKey; incoming: TextKey }>;

type Contract = TeamBuilderDirect_ChampSelectSwapContract;
const contracts = (session: Session, field: (typeof KINDS)[number]['field']): Contract[] => (session[field] as Contract[] | undefined) ?? [];
const nameOf = (session: Session, cellId: number) => session.myTeam.find((c) => c.cellId === cellId)?.gameName || '—';
const send = (route: string, id: number, verb: 'request' | 'accept' | 'decline' | 'cancel') => request('POST', `${BASE}/${route}/${id}/${verb}`);

/** Menu ⋯ na vaga de um aliado com as trocas que a LCU marca como disponíveis com ele. */
export function swapMenu(session: Session, cell: Cell) {
  const items = KINDS.flatMap((k) =>
    contracts(session, k.field)
      .filter((c) => c.cellId === cell.cellId && c.state === 'AVAILABLE')
      .map((c) => ({ label: t(k.offer), run: () => void send(k.route, c.id, 'request').catch(() => {}) })),
  );
  // Solto na tela: dentro do cartão, a lista entrava no fluxo dele e esticava o banner do campeão.
  return items.length ? <MemberMenu floating items={items} /> : null;
}

/**
 * Cartões de trocas recebidas (Aceitar, Recusar) e enviadas (aguardando, Cancelar), ao lado da coluna dos aliados, na
 * altura de quem pediu (`--at`: a posição dele no time, de 0 a 1). Na troca de campeão, mostra os dois campeões.
 */
export function SwapCards({ session, champions }: { session: Session; champions?: Map<number, Champion> }) {
  const open = KINDS.flatMap((k) => contracts(session, k.field).filter((c) => c.state === 'RECEIVED' || c.state === 'SENT').map((c) => ({ k, c })));
  if (!open.length) return null;
  const champOf = (cellId: number) => champions?.get(session.myTeam.find((c) => c.cellId === cellId)?.championId ?? 0);
  const row = Math.max(0, session.myTeam.findIndex((c) => c.cellId === open[0]!.c.cellId));
  return (
    <aside class="rlc-cs-swaps" style={{ '--at': String(row / Math.max(1, session.myTeam.length)) }}>
      {open.map(({ k, c }) => (
        <SwapCard key={`${k.route}-${c.id}`} route={k.route} incoming={k.incoming} contract={c} who={nameOf(session, c.cellId)} mine={k.field === 'trades' ? champOf(session.localPlayerCellId) : undefined} theirs={k.field === 'trades' ? champOf(c.cellId) : undefined} />
      ))}
    </aside>
  );
}

function SwapCard({ route, incoming, contract, who, mine, theirs }: { route: string; incoming: TextKey; contract: Contract; who: string; mine?: Champion; theirs?: Champion }) {
  const act = useAction((verb: 'accept' | 'decline' | 'cancel') => send(route, contract.id, verb));
  if (contract.state === 'SENT') {
    return (
      <div class="rlc-cs-swap rlc-invite">
        <span>
          {t('swapWaiting')} {who}
        </span>
        <div class="rlc-invite-actions">
          <button type="button" class="rlc-button" data-variant="pill" disabled={act.pending} onClick={() => act.run('cancel')}>
            {t('cancel')}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div class="rlc-cs-swap rlc-invite">
      <span>
        <strong>{who}</strong> {t(incoming)}
      </span>
      {mine?.icon && theirs?.icon ? (
        <div class="rlc-cs-swap-champs">
          <img src={mine.icon} alt={mine.name} />
          <span aria-hidden="true">⇄</span>
          <img src={theirs.icon} alt={theirs.name} />
          <small>
            {t('csSwapYouGet')} {theirs.name}
          </small>
        </div>
      ) : null}
      <div class="rlc-invite-actions">
        <button type="button" class="rlc-button" data-variant="pill" disabled={act.pending} onClick={() => act.run('accept')}>
          {t('accept')}
        </button>
        <button type="button" class="rlc-button" data-variant="pill" disabled={act.pending} onClick={() => act.run('decline')}>
          {t('decline')}
        </button>
      </div>
    </div>
  );
}

/**
 * Banco do ARAM. Com os cartões (ARAM atual) o banco aparece já na escolha, mas durante ela só os campeões dos meus
 * cartões podem ser pegos; os outros esperam a finalização, como no client. Sem cartões (ARAM antigo) há rolagem.
 */
/** Espera depois de uma troca, e num campeão que acabou de chegar ao banco (a mesma do client). */
export const BENCH_COOLDOWN_MS = 3000;

/** Campeões que chegaram ao banco há menos de `BENCH_COOLDOWN_MS` (um aliado acabou de trocar). */
function useArrivals(ids: number[]): Set<number> {
  const seen = useRef<Set<number> | null>(null);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const [fresh, setFresh] = useState<Set<number>>(new Set());
  const key = ids.join(',');
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    const before = seen.current;
    seen.current = new Set(ids);
    // O banco que já estava lá ao abrir não conta como chegada.
    const arrived = before ? ids.filter((id) => !before.has(id)) : [];
    if (!arrived.length) return;
    setFresh((f) => new Set([...f, ...arrived]));
    // Cada chegada tem a própria espera: outra troca logo depois não pode cancelar esta.
    timers.current.push(setTimeout(() => setFresh((f) => new Set([...f].filter((id) => !arrived.includes(id)))), BENCH_COOLDOWN_MS));
  }, [key]);
  return fresh;
}

/** Vagas do banco: as dez do ARAM aparecem sempre, vazias ou não (mais, se a LCU mandar mais). */
export const BENCH_SLOTS = 10;

/**
 * Banco do ARAM, no cabeçalho, com as regras do client: campeão fora dos que você pode jogar (`pickable`) fica em
 * cinza e não troca; depois de trocar, todos esperam um pouco (barra esvaziando); quem acabou de chegar também.
 * `readOnly`: na vez de escolher a carta o banco só mostra o que os aliados deixaram. Quem entra e sai segue a sessão
 * (`benchChampions`); os voos ficam em `aramFx.tsx`, que acha cada vaga pelo `data-fly`.
 */
export function Bench({ session, champions, subset, pickable, readOnly = false }: { session: Session; champions: Map<number, Champion>; subset: number[]; pickable: number[] | null; readOnly?: boolean }) {
  const [cooldown, setCooldown] = useState(false);
  const cooling = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(cooling.current), []);
  const swap = useAction(async (id: number) => {
    try {
      await request('POST', `${BASE}/bench/swap/${id}`);
    } finally {
      setCooldown(true);
      clearTimeout(cooling.current);
      cooling.current = setTimeout(() => setCooldown(false), BENCH_COOLDOWN_MS);
    }
  });
  const reroll = useAction(() => request('POST', `${BASE}/my-selection/reroll`));
  const cards = session.allowSubsetChampionPicks === true;
  const phase = session.timer?.phase;
  const show = cards ? session.benchEnabled && (phase === 'BAN_PICK' || phase === 'FINALIZATION') : session.benchEnabled || session.allowRerolling;
  if (!show) return null;
  const bench = (session.benchChampions ?? []) as Array<{ championId: number }>;
  const fresh = useArrivals(bench.map((b) => b.championId));
  // Lista ainda carregando: ninguém fica bloqueado antes da hora.
  const canPlay = (id: number) => !pickable || pickable.includes(id);
  return (
    <div class="rlc-cs-bench" role="group" aria-label={t('csBench')} style={{ '--cd': `${BENCH_COOLDOWN_MS}ms` }}>
      {session.benchEnabled ? <span class="rlc-cs-bench-label">{t('csBench')}</span> : null}
      {bench.map(({ championId }) => {
        const champ = champions.get(championId);
        const name = champ?.name ?? String(championId);
        const wait = cards && phase === 'BAN_PICK' && !subset.includes(championId);
        const locked = !canPlay(championId);
        const label = locked ? `${name} · ${t('csBenchLocked')}` : wait ? `${name} · ${t('csBenchWait')}` : name;
        return (
          <button
            type="button"
            key={championId}
            class="rlc-cs-champ"
            data-fly={`bench:${championId}`}
            data-locked={locked || wait ? 'true' : undefined}
            data-cooldown={!locked && !wait && (cooldown || fresh.has(championId)) ? 'true' : undefined}
            aria-label={label}
            title={label}
            disabled={readOnly || swap.pending || cooldown || fresh.has(championId) || wait || locked}
            onClick={() => swap.run(championId)}
          >
            {champ?.icon ? <img src={champ.icon} alt="" /> : <span>{name}</span>}
          </button>
        );
      })}
      {session.benchEnabled ? Array.from({ length: Math.max(0, BENCH_SLOTS - bench.length) }, (_, i) => <i key={`empty-${i}`} class="rlc-cs-bench-slot" aria-hidden="true" />) : null}
      {session.allowRerolling && !cards ? (
        <button type="button" class="rlc-button" data-variant="pill" disabled={reroll.pending || session.rerollsRemaining <= 0} onClick={() => reroll.run()}>
          {t('reroll')} ({session.rerollsRemaining})
        </button>
      ) : null}
      {cooldown ? (
        <em class="rlc-cs-bench-cd" role="status">
          <span>{t('csBenchCooldown')}</span>
          <u aria-hidden="true">
            <i />
          </u>
        </em>
      ) : null}
    </div>
  );
}

/** Tempos da distribuição: as cartas entram de costas, viram uma a uma e a da sorte vira por último, depois de uma pausa. */
export const DEAL_MS = 550;
export const FLIP_GAP_MS = 260;
export const LUCK_PAUSE_MS = 420;
/** Quando a carta `index` de `count` vira (ms desde que as cartas aparecem). */
export const flipAt = (index: number, count: number): number => DEAL_MS + index * FLIP_GAP_MS + (count === 3 && index === 2 ? LUCK_PAUSE_MS : 0);

// Cartas já viradas nesta sessão do client: reabrir a tela na mesma escolha não distribui de novo.
let dealtKey = '';
/** Só para testes: esquece que as cartas já foram distribuídas. */
export const forgetDeal = (): void => void (dealtKey = '');

/** Quantas cartas já estão viradas para cima. Com movimento reduzido, ou reaberta na mesma escolha, todas de uma vez. */
function useDeal(ids: number[]): number {
  const key = ids.join(',');
  const [up, setUp] = useState(0);
  useEffect(() => {
    if (!ids.length || key === dealtKey) return;
    if (reducedMotion()) {
      dealtKey = key;
      setUp(ids.length);
      return;
    }
    setUp(0);
    const timers = ids.map((_, i) =>
      setTimeout(() => {
        if (i === ids.length - 1) dealtKey = key;
        setUp(i + 1);
      }, flipAt(i, ids.length)),
    );
    return () => timers.forEach(clearTimeout);
  }, [key]);
  return key === dealtKey ? ids.length : up;
}

/**
 * Cartões do ARAM: 2 campeões aleatórios (3 com a carta da sorte, sempre a terceira, dourada). São distribuídos de
 * costas e viram um a um; só depois de virado o cartão responde ao mouse e ao clique. Clicar escolhe na hora, como no
 * client; o que sobra vai para o banco do time (o voo é de `aramFx.tsx`, quando a LCU confirma).
 */
export function SubsetCards({ ids, champions, splash, disabled, onPick, onHover }: { ids: number[]; champions: Map<number, Champion>; splash: (skinId: number) => Promise<string | null>; disabled: boolean; onPick: (id: number) => void; onHover: (id: number | null) => void }) {
  const up = useDeal(ids);
  return (
    <div class="rlc-cs-cards">
      <h2 class="rlc-cs-cards-title">{t('csCardsTitle')}</h2>
      <div class="rlc-cs-cards-row" onMouseLeave={() => onHover(null)}>
        {ids.map((id, i) => (
          <SubsetCard key={id} id={id} index={i} up={i < up} lucky={ids.length === 3 && i === 2} champ={champions.get(id)} splash={splash} disabled={disabled} onPick={onPick} onHover={onHover} />
        ))}
      </div>
    </div>
  );
}

function SubsetCard({ id, index, up, lucky, champ, splash, disabled, onPick, onHover }: { id: number; index: number; up: boolean; lucky: boolean; champ?: Champion; splash: (skinId: number) => Promise<string | null>; disabled: boolean; onPick: (id: number) => void; onHover: (id: number | null) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void splash(id * 1000).then((u) => live && setUrl(u)).catch(() => {});
    return () => void (live = false);
  }, [id, splash]);
  const name = champ?.name ?? String(id);
  const hover = () => void (up && onHover(id));
  return (
    <button type="button" class="rlc-cs-card" style={{ '--i': String(index) }} data-fly={`card:${id}`} data-fly-img={url ?? undefined} data-up={up ? 'true' : undefined} data-lucky={lucky ? 'true' : undefined} aria-label={lucky ? `${name} · ${t('csLuckyCard')}` : name} disabled={disabled || !up} onMouseEnter={hover} onFocus={hover} onClick={() => onPick(id)}>
      <span class="rlc-cs-card-in">
        <span class="rlc-cs-card-back" aria-hidden="true" />
        <span class="rlc-cs-card-front">
          {url ? <span class="rlc-cs-card-art" style={{ backgroundImage: `url("${url}")` }} aria-hidden="true" /> : null}
          {lucky ? <span class="rlc-cs-card-lucky">{t('csLuckyCard')}</span> : null}
          <span class="rlc-cs-card-name">{name}</span>
        </span>
      </span>
    </button>
  );
}
