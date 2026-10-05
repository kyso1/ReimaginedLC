import { t, type TextKey } from '../../i18n';
import type { Champion } from '../../data/gamedata';
import { request } from '../../lcu/request';
import type { TeamBuilderDirect_ChampSelectSwapContract } from '../../lcu/types';
import { MemberMenu } from '../lobby/MemberMenu';
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

/** Banco do ARAM e rolagem. */
export function Bench({ session, champions }: { session: Session; champions: Map<number, Champion> }) {
  const swap = useAction((id: number) => request('POST', `${BASE}/bench/swap/${id}`));
  const reroll = useAction(() => request('POST', `${BASE}/my-selection/reroll`));
  if (!session.benchEnabled && !session.allowRerolling) return null;
  const bench = (session.benchChampions ?? []) as Array<{ championId: number }>;
  return (
    <div class="rlc-cs-bench">
      {bench.map(({ championId }) => {
        const champ = champions.get(championId);
        const label = champ?.name ?? String(championId);
        return (
          <button type="button" key={championId} class="rlc-cs-champ" aria-label={label} title={label} disabled={swap.pending} onClick={() => swap.run(championId)}>
            {champ?.icon ? <img src={champ.icon} alt="" /> : <span>{label}</span>}
          </button>
        );
      })}
      {session.allowRerolling ? (
        <button type="button" class="rlc-button" data-variant="pill" disabled={reroll.pending || session.rerollsRemaining <= 0} onClick={() => reroll.run()}>
          {t('reroll')} ({session.rerollsRemaining})
        </button>
      ) : null}
    </div>
  );
}
