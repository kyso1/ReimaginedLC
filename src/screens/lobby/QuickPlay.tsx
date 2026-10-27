import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolLobbyQuickPlayPresetSlotDto } from '../../lcu/types';
import type { Champion, Spell } from '../../data/gamedata';
import { RoleIcon } from '../../ui/RoleIcon';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { getJson } from '../profile/data';
import { POSITIONS, positionKey, type Position } from './format';

export type Slot = LolLobbyQuickPlayPresetSlotDto;

const SLOTS = '/lol-lobby/v1/lobby/members/localMember/player-slots';
const FLASH = 4;
const SMITE = 11;
/** Feitiço que o client põe ao sair da selva, por rota (o resto fica com Curar). */
const ROUTE_SPELL: Record<string, number> = { TOP: 12, MIDDLE: 14, BOTTOM: 7, UTILITY: 3 };
const HEAL = 7;

const emptySlot = (): Slot => ({ championId: 0, skinId: 0, positionPreference: 'UNSELECTED', perks: '', spell1: FLASH, spell2: 14 });

/** Duas vagas sempre (a secundária some no Preencher): a LCU pode mandar menos. */
export function normalizeSlots(slots: Slot[] | undefined): [Slot, Slot] {
  return [slots?.[0] ?? emptySlot(), slots?.[1] ?? emptySlot()];
}

/** A secundária não conta quando a principal é Preencher, como no client. */
export const secondaryHidden = (primary: string) => primary === 'FILL';

/**
 * Feitiços ao trocar de rota, como o client (`getSpellIdsWithSmiteAssignedIfAppropriate`): selva põe Golpear (no lugar
 * do que não é Flash); sair da selva troca Golpear pelo feitiço da rota.
 */
export function spellsFor(position: string, spell1: number, spell2: number): [number, number] {
  if (position === 'JUNGLE') {
    if (spell1 === SMITE || spell2 === SMITE) return [spell1, spell2];
    return spell1 === FLASH ? [spell1, SMITE] : [SMITE, spell2];
  }
  const swap = ROUTE_SPELL[position] ?? HEAL;
  const pick = (s: number, other: number) => (s === SMITE ? (other === swap ? HEAL : swap) : s);
  return [pick(spell1, spell2), pick(spell2, spell1)];
}

/** Rota nova na vaga `i`: repetir a rota da outra vaga troca as duas. Feitiços seguem a rota. */
export function withPosition(slots: [Slot, Slot], i: 0 | 1, p: Position): [Slot, Slot] {
  const next: [Slot, Slot] = [{ ...slots[0] }, { ...slots[1] }];
  const other = next[1 - i]!;
  if (other.positionPreference === p) other.positionPreference = next[i]!.positionPreference;
  next[i]!.positionPreference = p;
  for (const s of next) [s.spell1, s.spell2] = spellsFor(s.positionPreference, s.spell1, s.spell2);
  return next;
}

/** Campeão novo na vaga `i` (skin padrão); escolher o da outra vaga troca os campeões. */
export function withChampion(slots: [Slot, Slot], i: 0 | 1, championId: number, perks: string): [Slot, Slot] {
  const next: [Slot, Slot] = [{ ...slots[0] }, { ...slots[1] }];
  const other = next[1 - i]!;
  if (other.championId === championId) [other.championId, other.skinId, other.perks] = [next[i]!.championId, next[i]!.skinId, next[i]!.perks];
  Object.assign(next[i]!, { championId, skinId: championId * 1000, perks });
  // Vaga nova chega com feitiços 0: Flash e o da rota.
  for (const s of next) if (!s.spell1 || !s.spell2) [s.spell1, s.spell2] = spellsFor(s.positionPreference, FLASH, ROUTE_SPELL[s.positionPreference] ?? HEAL);
  return next;
}

/** Página de runas recomendada que o próprio client usa no Jogo Rápido (já vem como texto JSON). */
const perksFor = (championId: number, position: string) =>
  getJson<string>(`/lol-perks/v1/quick-play-selections/champion/${championId}/position/${position === 'UNSELECTED' || position === 'FILL' ? 'MIDDLE' : position}`).then((p) => (typeof p === 'string' ? p : ''));

const save = (slots: Slot[]) => request('PUT', SLOTS, slots);

interface RunePage {
  id: number;
  name: string;
  isValid: boolean;
  selectedPerkIds: number[];
  primaryStyleId: number;
  subStyleId: number;
}
/** Página de runas no formato que a vaga guarda (o mesmo texto JSON que o client monta). */
export const pagePerks = (p: Pick<RunePage, 'selectedPerkIds' | 'primaryStyleId' | 'subStyleId'>) =>
  JSON.stringify({ perkIds: p.selectedPerkIds, perkStyle: p.primaryStyleId, perkSubStyle: p.subStyleId });

interface SkinEntry {
  id: number;
  name: string;
  tilePath?: string;
  ownership?: { owned?: boolean };
}

/** Skins possuídas do campeão da vaga (a padrão sempre entra). */
function useOwnedSkins(summonerId: number, championId: number): SkinEntry[] {
  const [skins, setSkins] = useState<SkinEntry[]>([]);
  useEffect(() => {
    setSkins([]);
    if (!championId) return;
    let live = true;
    void getJson<SkinEntry[]>(`/lol-champions/v1/inventories/${summonerId}/champions/${championId}/skins`).then(
      (l) => live && setSkins((l ?? []).filter((s) => s.ownership?.owned || s.id === championId * 1000)),
    );
    return () => void (live = false);
  }, [summonerId, championId]);
  return skins;
}

/** Restrição do Jogo Rápido que impede a fila, em texto; as rotas em falta entram na mensagem. Null sem restrição QP. */
export function quickPlayProblem(restrictions: Array<{ restrictionCode: string }> | undefined, scarce: string[] | undefined): string | null {
  const r = restrictions?.find((x) => x.restrictionCode.startsWith('QP'));
  if (!r) return null;
  if (r.restrictionCode === 'QPInvalidChampionSelectionRestriction') return t('qpNeedChampion');
  if (/Scarce/.test(r.restrictionCode)) return `${t('qpNeedScarce')} ${(scarce ?? []).map((p) => t(positionKey(p) ?? 'lobbyPosNone')).join(', ')}`;
  if (/NonUnique/.test(r.restrictionCode)) return t('qpNotUnique');
  return t('qpInvalid');
}

/** Miniaturas das vagas na coluna de qualquer membro: campeão e rota de cada uma. */
export function SlotStrip({ slots, champions, onEdit }: { slots: Slot[] | undefined; champions: Map<number, Champion>; onEdit?: (i: 0 | 1) => void }) {
  const [a, b] = normalizeSlots(slots);
  const shown: Array<[0 | 1, Slot]> = secondaryHidden(a.positionPreference) ? [[0, a]] : [[0, a], [1, b]];
  return (
    <span class="rlc-qp-strip">
      {shown.map(([i, s]) => {
        const champ = champions.get(s.championId);
        const label = `${t(i === 0 ? 'lobbyPosPrimary' : 'lobbyPosSecondary')}: ${champ?.name ?? t('qpPickChampion')} · ${t(positionKey(s.positionPreference) ?? 'lobbyPosNone')}`;
        const body = (
          <>
            {champ?.icon ? <img src={champ.icon} alt="" /> : <i aria-hidden="true">+</i>}
            <RoleIcon role={s.positionPreference} />
          </>
        );
        return onEdit ? (
          <button type="button" key={i} class="rlc-qp-slot" aria-label={label} title={label} onClick={() => onEdit(i)}>
            {body}
          </button>
        ) : (
          <span key={i} class="rlc-qp-slot" role="img" aria-label={label} title={label}>
            {body}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Jogo Rápido (Swiftplay): cada jogador monta duas vagas (rota, campeão, feitiços) antes da fila; não há seleção de
 * campeões depois. As runas vêm da recomendação do client para o campeão e a rota. Cada mudança manda as duas vagas.
 */
export function QuickPlayEditor({ lcu, slots: current, queueId, summonerId, initial, scarce = [], onClose }: { lcu: Lcu; slots: Slot[] | undefined; queueId: number; summonerId: number; initial: 0 | 1; scarce?: string[]; onClose: () => void }) {
  useEscape(onClose);
  const [tab, setTab] = useState<0 | 1>(initial);
  const [query, setQuery] = useState('');
  const [champions, setChampions] = useState<Map<number, Champion>>(new Map());
  const [spells, setSpells] = useState<Spell[]>([]);
  const [playable, setPlayable] = useState<number[] | null>(null);
  const [spellOpen, setSpellOpen] = useState<1 | 2 | null>(null);
  useEffect(() => {
    let live = true;
    void lcu.game.champions().then((m) => live && setChampions(m));
    void lcu.game.spells().then((m) => live && setSpells([...m.values()].filter((s) => s.gameModes.includes('SWIFTPLAY')).sort((a, b) => a.name.localeCompare(b.name))));
    void getJson<Array<{ id: number }>>(`/lol-champions/v1/inventories/${summonerId}/${queueId}/champions-minimal-per-queue`).then((l) => live && setPlayable((l ?? []).map((c) => c.id).filter((id) => id > 0)));
    return () => void (live = false);
  }, [lcu, summonerId, queueId]);
  const slots = normalizeSlots(current);
  const put = useAction((next: Slot[]) => save(next));
  const slot = slots[tab];
  const hidden = secondaryHidden(slots[0].positionPreference);
  const pickChampion = useAction(async (id: number) => save(withChampion(slots, tab, id, await perksFor(id, slot.positionPreference))));
  const skins = useOwnedSkins(summonerId, slot.championId);
  const [pages, setPages] = useState<RunePage[]>([]);
  useEffect(() => {
    let live = true;
    void getJson<RunePage[]>('/lol-perks/v1/pages').then((l) => live && setPages((l ?? []).filter((p) => p.isValid && p.selectedPerkIds?.length)));
    return () => void (live = false);
  }, []);
  const withSlot = (patch: Partial<Slot>): [Slot, Slot] => (tab === 0 ? [{ ...slots[0], ...patch }, slots[1]] : [slots[0], { ...slots[1], ...patch }]);
  const recommended = useAction(async () => save(withSlot({ perks: await perksFor(slot.championId, slot.positionPreference) })));
  const currentPage = pages.find((p) => pagePerks(p) === slot.perks);
  const q = query.trim().toLowerCase();
  const list = (playable ?? [])
    .map((id) => champions.get(id))
    .filter((c): c is Champion => !!c && (!q || c.name.toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name));
  const busy = put.pending || pickChampion.pending || recommended.pending;
  const spellOf = (id: number) => spells.find((s) => s.id === id);
  const setSpell = (which: 1 | 2, id: number) => {
    setSpellOpen(null);
    const s = { ...slot };
    const [mine, other] = which === 1 ? [s.spell1, s.spell2] : [s.spell2, s.spell1];
    if (id === mine) return;
    // Escolher o feitiço do outro espaço troca os dois.
    if (which === 1) [s.spell1, s.spell2] = [id, id === other ? mine : s.spell2];
    else [s.spell1, s.spell2] = [id === other ? mine : s.spell1, id];
    const next: [Slot, Slot] = tab === 0 ? [s, slots[1]] : [slots[0], s];
    put.run(next);
  };
  return (
    <section class="rlc-tft-drawer rlc-qp" role="dialog" aria-label={t('qpTitle')}>
      <header class="rlc-tft-head">
        <nav class="rlc-tft-tabs" role="tablist">
          {([0, 1] as const).map((i) =>
            i === 1 && hidden ? null : (
              <button type="button" key={i} role="tab" aria-selected={tab === i} onClick={() => setTab(i)}>
                {t(i === 0 ? 'lobbyPosPrimary' : 'lobbyPosSecondary')}
              </button>
            ),
          )}
        </nav>
        <button type="button" class="rlc-button" data-variant="pill" onClick={onClose}>
          {t('close')}
        </button>
      </header>
      <aside class="rlc-tft-preview">
        <div class="rlc-qp-pick">
          {champions.get(slot.championId)?.icon ? <img src={champions.get(slot.championId)!.icon} alt="" /> : <span aria-hidden="true">?</span>}
          <h3>{champions.get(slot.championId)?.name ?? t('qpPickChampion')}</h3>
        </div>
        <div class="rlc-qp-positions" role="radiogroup" aria-label={t('qpPosition')}>
          {POSITIONS.filter((p) => tab === 0 || p !== 'FILL').map((p) => (
            <button type="button" key={p} role="radio" aria-checked={slot.positionPreference === p} data-scarce={scarce.includes(p) ? 'true' : undefined} aria-label={t(positionKey(p)!)} title={scarce.includes(p) ? `${t(positionKey(p)!)} · ${t('qpScarce')}` : t(positionKey(p)!)} disabled={busy} onClick={() => put.run(withPosition(slots, tab, p))}>
              <RoleIcon role={p} />
            </button>
          ))}
        </div>
        <div class="rlc-qp-spells">
          {([1, 2] as const).map((w) => {
            const sp = spellOf(w === 1 ? slot.spell1 : slot.spell2);
            return (
              <button type="button" key={w} class="rlc-cs-spell-slot" aria-label={`${t('spell')} ${w}: ${sp?.name ?? ''}`} title={sp?.name} aria-expanded={spellOpen === w} onClick={() => setSpellOpen(spellOpen === w ? null : w)}>
                {sp?.icon ? <img src={sp.icon} alt="" /> : null}
              </button>
            );
          })}
          {spellOpen ? (
            <div class="rlc-cs-spell-list" role="menu">
              {spells.map((s) => (
                <button type="button" role="menuitem" key={s.id} class="rlc-cs-spell-option" aria-label={s.name} title={s.name} disabled={busy} onClick={() => setSpell(spellOpen, s.id)}>
                  {s.icon ? <img src={s.icon} alt="" /> : s.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {skins.length > 1 ? (
          <div class="rlc-qp-skins" role="radiogroup" aria-label={t('tabSkins')}>
            {skins.map((s) => (
              <button type="button" key={s.id} role="radio" aria-checked={(slot.skinId || slot.championId * 1000) === s.id} aria-label={s.name} title={s.name} disabled={busy} onClick={() => put.run(withSlot({ skinId: s.id }))}>
                {s.tilePath ? <img src={s.tilePath} alt="" loading="lazy" /> : s.name}
              </button>
            ))}
          </div>
        ) : null}
        {slot.championId ? (
          <label class="rlc-qp-runes">
            <span>{t('runeOpen')}</span>
            <select
              class="rlc-input"
              value={currentPage ? String(currentPage.id) : 'reco'}
              disabled={busy}
              onChange={(e) => {
                const v = e.currentTarget.value;
                const page = pages.find((p) => String(p.id) === v);
                if (page) put.run(withSlot({ perks: pagePerks(page) }));
                else recommended.run();
              }}
            >
              <option value="reco">{t('qpRunesReco')}</option>
              {pages.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <p class="rlc-tft-desc">{t('qpRunesNote')}</p>
      </aside>
      <div class="rlc-tft-main">
        <div class="rlc-tft-tools">
          <input type="search" class="rlc-input" placeholder={t('searchChampion')} aria-label={t('searchChampion')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
        </div>
        <div class="rlc-tft-body">
          <div class="rlc-qp-grid">
            {list.map((c) => (
              <button type="button" key={c.id} class="rlc-qp-champ" aria-label={c.name} title={c.name} aria-pressed={slot.championId === c.id} disabled={busy} onClick={() => pickChampion.run(c.id)}>
                <img src={c.icon} alt="" loading="lazy" />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
