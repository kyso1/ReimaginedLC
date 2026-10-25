import { t, type TextKey } from '../../i18n';
import type { Champion } from '../../data/gamedata';
import { request } from '../../lcu/request';
import type { TeamBuilderDirect_ChampSelectSwapContract } from '../../lcu/types';
import { MemberMenu } from '../lobby/MemberMenu';
import { useEffect, useState } from 'preact/hooks';
import { useAction } from '../../ui/useAction';
import type { Cell, Session } from './logic';

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
  return items.length ? <MemberMenu items={items} /> : null;
}

/** Cartões de trocas recebidas (Aceitar, Recusar) e enviadas (aguardando, Cancelar). */
export function SwapCards({ session }: { session: Session }) {
  const cards = KINDS.flatMap((k) =>
    contracts(session, k.field)
      .filter((c) => c.state === 'RECEIVED' || c.state === 'SENT')
      .map((c) => <SwapCard key={`${k.route}-${c.id}`} route={k.route} incoming={k.incoming} contract={c} who={nameOf(session, c.cellId)} />),
  );
  return cards.length ? <aside class="rlc-cs-swaps">{cards}</aside> : null;
}

function SwapCard({ route, incoming, contract, who }: { route: string; incoming: TextKey; contract: Contract; who: string }) {
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
export function Bench({ session, champions, subset }: { session: Session; champions: Map<number, Champion>; subset: number[] }) {
  const swap = useAction((id: number) => request('POST', `${BASE}/bench/swap/${id}`));
  const reroll = useAction(() => request('POST', `${BASE}/my-selection/reroll`));
  const cards = session.allowSubsetChampionPicks === true;
  const phase = session.timer?.phase;
  const show = cards ? session.benchEnabled && (phase === 'BAN_PICK' || phase === 'FINALIZATION') : session.benchEnabled || session.allowRerolling;
  if (!show) return null;
  const bench = (session.benchChampions ?? []) as Array<{ championId: number }>;
  return (
    <div class="rlc-cs-bench" role="group" aria-label={t('csBench')}>
      {session.benchEnabled ? <span class="rlc-cs-bench-label">{t('csBench')}</span> : null}
      {bench.map(({ championId }) => {
        const champ = champions.get(championId);
        const name = champ?.name ?? String(championId);
        const wait = cards && phase === 'BAN_PICK' && !subset.includes(championId);
        const label = wait ? `${name} · ${t('csBenchWait')}` : name;
        return (
          <button type="button" key={championId} class="rlc-cs-champ" aria-label={label} title={label} disabled={swap.pending || wait} onClick={() => swap.run(championId)}>
            {champ?.icon ? <img src={champ.icon} alt="" /> : <span>{name}</span>}
          </button>
        );
      })}
      {session.allowRerolling && !cards ? (
        <button type="button" class="rlc-button" data-variant="pill" disabled={reroll.pending || session.rerollsRemaining <= 0} onClick={() => reroll.run()}>
          {t('reroll')} ({session.rerollsRemaining})
        </button>
      ) : null}
    </div>
  );
}

/**
 * Cartões do ARAM: 2 campeões aleatórios (3 com a carta da sorte, sempre a terceira). Clicar escolhe na hora, como no
 * client; o que sobra vai para o banco do time. O mouse no cartão troca a prévia do palco.
 */
export function SubsetCards({ ids, champions, splash, disabled, onPick, onHover }: { ids: number[]; champions: Map<number, Champion>; splash: (skinId: number) => Promise<string | null>; disabled: boolean; onPick: (id: number) => void; onHover: (id: number | null) => void }) {
  return (
    <div class="rlc-cs-cards">
      <h2 class="rlc-cs-cards-title">{t('csCardsTitle')}</h2>
      <div class="rlc-cs-cards-row" onMouseLeave={() => onHover(null)}>
        {ids.map((id, i) => (
          <SubsetCard key={id} id={id} lucky={ids.length === 3 && i === 2} champ={champions.get(id)} splash={splash} disabled={disabled} onPick={onPick} onHover={onHover} />
        ))}
      </div>
    </div>
  );
}

function SubsetCard({ id, lucky, champ, splash, disabled, onPick, onHover }: { id: number; lucky: boolean; champ?: Champion; splash: (skinId: number) => Promise<string | null>; disabled: boolean; onPick: (id: number) => void; onHover: (id: number | null) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void splash(id * 1000).then((u) => live && setUrl(u)).catch(() => {});
    return () => void (live = false);
  }, [id, splash]);
  const name = champ?.name ?? String(id);
  return (
    <button type="button" class="rlc-cs-card" data-lucky={lucky ? 'true' : undefined} aria-label={lucky ? `${name} · ${t('csLuckyCard')}` : name} disabled={disabled} onMouseEnter={() => onHover(id)} onFocus={() => onHover(id)} onClick={() => onPick(id)}>
      {url ? <span class="rlc-cs-card-art" style={{ backgroundImage: `url("${url}")` }} aria-hidden="true" /> : null}
      {lucky ? <span class="rlc-cs-card-lucky">{t('csLuckyCard')}</span> : null}
      <span class="rlc-cs-card-name">{name}</span>
    </button>
  );
}
