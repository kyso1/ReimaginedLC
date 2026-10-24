import { useEffect, useMemo, useState } from 'preact/hooks';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolLootContextMenu, LolLootPlayerLoot, LolLootPlayerLootUpdate } from '../../lcu/types';
import { Confirm } from '../../shell/overlays/Confirm';
import { useAction } from '../../ui/useAction';
import { useEscape } from '../../ui/useEscape';
import { MythicShop } from './MythicShop';
import { fill, Sanctum } from './Sanctum';

type Tab = 'craft' | 'sanctum' | 'mythic';
const TABS: Array<[Tab, TextKey]> = [
  ['craft', 'lootTabCraft'],
  ['sanctum', 'lootTabSanctum'],
  ['mythic', 'lootTabMythic'],
];

/** Filtros do trilho, na ordem do client oficial. */
export type Group = 'materials' | 'champions' | 'skins' | 'eternals' | 'emotes' | 'wards' | 'icons';
const GROUPS: Array<[Group, TextKey]> = [
  ['materials', 'lootMaterials'],
  ['champions', 'colChampions'],
  ['skins', 'colSkins'],
  ['eternals', 'lootEternals'],
  ['emotes', 'colEmotes'],
  ['wards', 'colWards'],
  ['icons', 'colIcons'],
];

type Sort = 'name' | 'value' | 'rarity';
const SORTS: Array<[Sort, TextKey]> = [
  ['name', 'lootSortName'],
  ['value', 'lootSortValue'],
  ['rarity', 'lootSortRarity'],
];

const ACTION: Record<string, TextKey> = { OPEN: 'lootOpen', DISENCHANT: 'lootDisenchant', UPGRADE: 'lootUpgrade', REROLL: 'lootReroll', FORGE: 'lootForge' };
const ESSENCE: Record<string, TextKey> = { CURRENCY_cosmetic: 'lootOrangeShort', CURRENCY_champion: 'lootBlueShort' };
/** Raridades da LCU (`EPIC`, `kMythic`...) na ordem crescente; `DEFAULT` não tem rótulo. */
const RARITY: Array<[string, TextKey]> = [
  ['EPIC', 'lootRarityEpic'],
  ['LEGENDARY', 'lootRarityLegendary'],
  ['MYTHIC', 'lootRarityMythic'],
  ['ULTIMATE', 'lootRarityUltimate'],
  ['TRANSCENDENT', 'lootRarityTranscendent'],
  ['EXALTED', 'lootRarityExalted'],
];
/** Materiais que a LCU manda sem nome localizado. */
const MATERIAL: Record<string, TextKey> = { MATERIAL_key: 'lootKey', MATERIAL_key_fragment: 'lootKeyFragment' };

const rarityKey = (r: string | undefined) => String(r ?? '').toUpperCase().replace(/^K(?=[A-Z])/, '');
const rarityRank = (r: string | undefined) => RARITY.findIndex(([k]) => k === rarityKey(r));

/** Raridade traduzida; padrão ou desconhecida fica sem rótulo. */
export function rarityLabel(r: string | undefined): string | null {
  const hit = RARITY.find(([k]) => k === rarityKey(r));
  return hit ? t(hit[1]) : null;
}

/** Nome visível do item: nunca o `lootId` (`CHAMPION_RENTAL_266`). */
export function lootName(l: Pick<LolLootPlayerLoot, 'lootId' | 'localizedName' | 'itemDesc'>): string {
  if (l.localizedName) return l.localizedName;
  if (l.itemDesc) return l.itemDesc;
  const material = MATERIAL[l.lootId];
  return material ? t(material) : t('lootItem');
}

/** Rótulo da ação: a LCU costuma mandar `recipeContextMenuAction` vazio; aí usa o nosso, com a essência ganha ou gasta. */
export function actionLabel(m: LolLootContextMenu): string {
  if (m.recipeContextMenuAction) return m.recipeContextMenuAction;
  const base = ACTION[m.actionType] ? t(ACTION[m.actionType]!) : m.actionType;
  const q = m.essenceQuantity ?? 0;
  if (!q) return base;
  const unit = ESSENCE[m.essenceType] ? ` ${t(ESSENCE[m.essenceType]!)}` : '';
  return `${base} (${q > 0 ? '+' : '−'}${Math.abs(q)}${unit})`;
}

/** Categoria do item pelo `displayCategories` da LCU; o que não se reconhece (baús, chaves) vai para Materiais. */
export function lootGroup(l: Pick<LolLootPlayerLoot, 'displayCategories'>): Group {
  const c = String(l.displayCategories ?? '').toUpperCase();
  if (c.includes('ETERNAL')) return 'eternals';
  if (c.includes('WARD')) return 'wards';
  if (c.includes('ICON')) return 'icons';
  if (c.includes('EMOTE')) return 'emotes';
  if (c.includes('CHAMPION')) return 'champions';
  if (c.includes('SKIN')) return 'skins';
  return 'materials';
}

function sortLoot(list: LolLootPlayerLoot[], sort: Sort): LolLootPlayerLoot[] {
  const byName = (a: LolLootPlayerLoot, b: LolLootPlayerLoot) => lootName(a).localeCompare(lootName(b), locale());
  return [...list].sort((a, b) => (sort === 'value' ? (b.value ?? 0) - (a.value ?? 0) : sort === 'rarity' ? rarityRank(b.rarity) - rarityRank(a.rarity) : 0) || byName(a, b));
}

/** Espólios: Criação (oficina de criação), Santuário e Loja Mítica. */
export function Loot({ lcu }: { lcu: Lcu }) {
  const [tab, setTab] = useState<Tab>('craft');
  return (
    <div class="rlc-loot">
      <nav class="rlc-lt-tabs">
        {TABS.map(([id, label]) => (
          <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {t(label)}
          </button>
        ))}
      </nav>
      {tab === 'craft' ? <Craft lcu={lcu} /> : tab === 'sanctum' ? <Sanctum /> : <MythicShop />}
    </div>
  );
}

/**
 * Criação no desenho do client oficial: trilho de filtros, busca e ordenação, grade em seções,
 * palco do item escolhido com as ações do menu de contexto da LCU e a bandeja de moedas embaixo.
 * Toda ação gasta recursos e não tem volta: pede confirmação. O que sai é revelado numa animação.
 */
function Craft({ lcu }: { lcu: Lcu }) {
  const [group, setGroup] = useState<Group | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('name');
  const [focusId, setFocusId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ menu: LolLootContextMenu; loot: LolLootPlayerLoot } | null>(null);
  const [reroll, setReroll] = useState<{ menu: LolLootContextMenu; loot: LolLootPlayerLoot; pool: string[] } | null>(null);
  const [reveal, setReveal] = useState<LolLootPlayerLootUpdate | null>(null);
  // Cache do menu vale para um estado do espólio: qualquer mudança (chave nova, essência gasta) consulta de novo.
  const menus = useMemo<MenuCache>(() => new Map(), [lcu.loot.value]);
  const raw = lcu.loot.value.data ?? [];
  // A LCU manda itens sem lootId (count > 0, sem nome): ficam de fora. Moedas vão para a bandeja.
  const all = raw.filter((l) => l.lootId && l.type !== 'CURRENCY' && l.count > 0);
  const q = query.trim().toLocaleLowerCase(locale());
  const shown = sortLoot(all.filter((l) => (group === 'all' || lootGroup(l) === group) && (!q || lootName(l).toLocaleLowerCase(locale()).includes(q))), sort);
  const sections = GROUPS.map(([g, label]) => ({ g, label, items: shown.filter((l) => lootGroup(l) === g) })).filter((s) => s.items.length);
  // Foco padrão: o primeiro na ordem da tela (seções), não o primeiro da ordenação geral.
  const focus = shown.find((l) => l.lootId === focusId) ?? sections[0]?.items[0];
  const n = new Intl.NumberFormat(locale());
  const count = (g: Group | 'all') => all.filter((l) => g === 'all' || lootGroup(l) === g).length;

  // Corpo do craft: um lootId por vaga da receita (o client oficial faz igual em `craft(recipeName, itemIds, repeat)`).
  const craft = useAction(async (menu: LolLootContextMenu, ids: string[]) => {
    const result = await request<LolLootPlayerLootUpdate>('POST', `/lol-loot/v1/recipes/${encodeURIComponent(menu.name)}/craft?repeat=1`, ids);
    if (result?.added?.length) setReveal(result);
  });

  // Bandeja: Essência Laranja (do espólio ou do store próprio), chaves e baús.
  const orange = raw.find((l) => l.lootId === 'CURRENCY_cosmetic')?.count ?? lcu.orangeEssence.value.data?.count ?? 0;
  const keys = raw.find((l) => l.lootId === 'MATERIAL_key');
  const fragments = raw.find((l) => l.lootId === 'MATERIAL_key_fragment');
  const chests = all.filter((l) => l.type === 'CHEST');
  const chestCount = chests.reduce((s, l) => s + l.count, 0);

  return (
    <div class="rlc-lt-craft">
      <aside class="rlc-lt-rail">
        {([['all', 'lootAll'], ...GROUPS] as Array<[Group | 'all', TextKey]>).map(([g, label]) => (
          <button type="button" key={g} aria-pressed={group === g} onClick={() => setGroup(g)}>
            <span>{t(label)}</span>
            <small>{count(g)}</small>
          </button>
        ))}
      </aside>
      <section class="rlc-lt-main">
        <div class="rlc-lt-tools">
          <input type="search" class="rlc-lt-search" placeholder={t('lootSearch')} aria-label={t('lootSearch')} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
          <label class="rlc-lt-sort">
            <span>{t('lootSort')}</span>
            <select value={sort} onChange={(e) => setSort(e.currentTarget.value as Sort)}>
              {SORTS.map(([s, label]) => (
                <option key={s} value={s}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div class="rlc-lt-sections">
          {sections.map((s) => (
            <div key={s.g} class="rlc-lt-section">
              <h3>
                {t(s.label)} <small>{s.items.length}</small>
              </h3>
              <div class="rlc-lt-grid">
                {s.items.map((l) => (
                  <button type="button" key={l.lootId} class="rlc-lt-tile" aria-label={lootName(l)} title={lootName(l)} aria-pressed={l === focus} data-rarity={rarityKey(l.rarity).toLowerCase() || undefined} onClick={() => setFocusId(l.lootId)}>
                    {l.tilePath ? <img src={l.tilePath} alt="" loading="lazy" decoding="async" /> : null}
                    {l.count > 1 ? <b class="rlc-lt-count">×{n.format(l.count)}</b> : null}
                    <span>{lootName(l)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {sections.length ? null : <p class="rlc-muted rlc-lt-empty">{all.length ? t('lootNoMatch') : t('lootEmpty')}</p>}
        </div>
      </section>
      <aside class="rlc-lt-stage">
        {focus ? (
          <>
            <div class="rlc-lt-art" style={focus.splashPath || focus.tilePath ? { backgroundImage: `url("${focus.splashPath || focus.tilePath}")` } : undefined} />
            {rarityLabel(focus.rarity) ? <small class="rlc-lt-rarity" data-rarity={rarityKey(focus.rarity).toLowerCase()}>{rarityLabel(focus.rarity)}</small> : null}
            <h2>{lootName(focus)}</h2>
            <p class="rlc-muted">
              {focus.isRental && (lootGroup(focus) === 'champions' || lootGroup(focus) === 'skins') ? `${t('lootShard')} · ` : ''}×{n.format(focus.count)}
            </p>
            <Actions key={focus.lootId} lootId={focus.lootId} count={focus.count} cache={menus} units={(pool) => rerollUnits(pool, raw).length} onAction={(menu, pool) => (menu.actionType === 'REROLL' ? setReroll({ menu, loot: focus, pool }) : setConfirm({ menu, loot: focus }))} busy={craft.pending} />
          </>
        ) : (
          <p class="rlc-muted">{t('lootPick')}</p>
        )}
      </aside>
      <footer class="rlc-lt-tray">
        <Balance icon="/fe/lol-loot/assets/tray_icons/currency_cosmetic.png" label={t('lootOrange')} value={n.format(orange)} />
        <Balance icon={keys?.tilePath || '/fe/lol-loot/assets/loot_item_icons/material_key.png'} label={t('lootKeys')} value={n.format(keys?.count ?? 0)} />
        {fragments?.count ? <Balance icon={fragments.tilePath} label={t('lootKeyFragment')} value={n.format(fragments.count)} /> : null}
        <Balance icon={chests[0]?.tilePath} label={t('lootChestsTray')} value={n.format(chestCount)} />
      </footer>
      {confirm ? (
        <Confirm
          message={`${actionLabel(confirm.menu)}: ${lootName(confirm.loot)}?`}
          confirmLabel={actionLabel(confirm.menu)}
          onConfirm={() => {
            craft.run(confirm.menu, [confirm.loot.lootId, ...(confirm.menu.requiredOthers ? [confirm.menu.requiredOthers] : [])]);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      {reroll ? (
        <Reroll
          {...reroll}
          all={raw}
          onCraft={(ids) => {
            craft.run(reroll.menu, ids);
            setReroll(null);
          }}
          onCancel={() => setReroll(null)}
        />
      ) : null}
      {reveal ? (
        <div class="rlc-veil rlc-lt-reveal" role="dialog" aria-modal="true">
          <h2>{t('lootReceived')}</h2>
          <div class="rlc-lt-reveal-cards">
            {reveal.added.map((a, i) => (
              <div key={i} class="rlc-lt-reveal-card" style={{ animationDelay: `${i * 120}ms` }}>
                {a.playerLoot?.tilePath ? <img src={a.playerLoot.tilePath} alt="" /> : null}
                <span>{a.playerLoot ? lootName(a.playerLoot) : ''}</span>
              </div>
            ))}
          </div>
          <button type="button" class="rlc-button" data-variant="primary" onClick={() => setReveal(null)}>
            {t('ok')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Balance({ icon, label, value }: { icon?: string; label: string; value: string }) {
  return (
    <div class="rlc-lt-balance" title={label}>
      {icon ? <img src={icon} alt="" /> : null}
      <span>
        <b>{value}</b>
        <small>{label}</small>
      </span>
    </div>
  );
}

/** Ações do item em foco, como a LCU as oferece no menu de contexto, e os itens aceitos pela receita de reformular. */
type MenuCache = Map<string, Promise<{ menu: LolLootContextMenu[]; pool: string[] }>>;

interface Recipe {
  recipeName: string;
  type: string;
  slots: Array<{ lootIds: string[]; quantity: number }>;
}

const getList = <T,>(url: string, init?: RequestInit): Promise<T[]> =>
  fetch(url, init)
    .then((r) => (r.ok ? (r.json() as Promise<T[]>) : []))
    .then((v) => (Array.isArray(v) ? v : []))
    .catch(() => []);

/**
 * Menu de ações do item. Uma consulta por item e quantidade (voltar ao item usa o cache); falha deixa sem ações, sem aviso.
 * O menu da LCU marca Reformular como possível mesmo com menos de 3 peças; quem decide é a receita
 * (`/recipes/initial-item`, vagas com os lootIds aceitos), lida só quando o menu traz Reformular.
 */
function Actions({ lootId, count, cache, units, onAction, busy }: { lootId: string; count: number; cache: MenuCache; units: (pool: string[]) => number; onAction: (m: LolLootContextMenu, pool: string[]) => void; busy: boolean }) {
  const [state, setState] = useState<{ menu: LolLootContextMenu[]; pool: string[] }>({ menu: [], pool: [] });
  useEffect(() => {
    let live = true;
    const key = `${lootId}:${count}`;
    let entry = cache.get(key);
    if (!entry) {
      // POST de leitura: a LCU só monta o menu, não gasta nada.
      entry = getList<LolLootContextMenu>(`/lol-loot/v1/player-loot/${encodeURIComponent(lootId)}/context-menu`, { method: 'POST' }).then(async (menu) => {
        const rr = menu.find((m) => m.actionType === 'REROLL');
        if (!rr) return { menu, pool: [] };
        const recipes = await getList<Recipe>(`/lol-loot/v1/recipes/initial-item/${encodeURIComponent(lootId)}`);
        const recipe = recipes.find((r) => r.recipeName === rr.name) ?? recipes.find((r) => r.type === 'REROLL');
        return { menu, pool: [...new Set(recipe?.slots.flatMap((s) => s.lootIds) ?? [])] };
      });
      cache.set(key, entry);
    }
    void entry.then((v) => live && setState(v));
    return () => void (live = false);
  }, [lootId, count, cache]);
  if (!state.menu.length) return null;
  const short = units(state.pool) < REROLL_SLOTS;
  return (
    <div class="rlc-lt-actions">
      {state.menu.map((m) => {
        const blocked = m.actionType === 'REROLL' && short;
        return (
          <button type="button" key={m.name} class="rlc-button" data-variant="pill" disabled={!m.enabled || blocked || busy} title={blocked ? t('lootRerollNeed') : undefined} onClick={() => onAction(m, state.pool)}>
            {actionLabel(m)}
          </button>
        );
      })}
      {state.menu.some((m) => m.actionType === 'REROLL') && short ? <small class="rlc-muted">{t('lootRerollNeed')}</small> : null}
    </div>
  );
}

const REROLL_SLOTS = 3;

/** Peças que a receita aceita, uma por unidade (fragmento ×2 conta duas), as de menor valor primeiro. */
export function rerollUnits(pool: string[], loot: LolLootPlayerLoot[]): string[] {
  const accepted = new Set(pool);
  return loot
    .filter((l) => accepted.has(l.lootId) && l.count > 0)
    .sort((a, b) => (a.value ?? 0) - (b.value ?? 0) || a.lootId.localeCompare(b.lootId))
    .flatMap((l) => Array<string>(l.count).fill(l.lootId));
}

/** Completa a escolha até 3 com as peças de menor valor que sobram. */
export function autoFill(chosen: string[], units: string[]): string[] {
  const left = [...units];
  for (const id of chosen) left.splice(left.indexOf(id), 1);
  return [...chosen, ...left].slice(0, REROLL_SLOTS);
}

/**
 * Reformular: escolher 3 peças aceitas pela receita (o item em foco já entra), conferir e confirmar.
 * As 3 são consumidas e a LCU devolve uma skin aleatória, mostrada pela revelação da Criação.
 */
function Reroll({ menu, loot, pool, all, onCraft, onCancel }: { menu: LolLootContextMenu; loot: LolLootPlayerLoot; pool: string[]; all: LolLootPlayerLoot[]; onCraft: (ids: string[]) => void; onCancel: () => void }) {
  const units = rerollUnits(pool, all);
  const [chosen, setChosen] = useState<string[]>(units.includes(loot.lootId) ? [loot.lootId] : []);
  const [confirm, setConfirm] = useState(false);
  useEscape(() => !confirm && onCancel());
  const byId = (id: string) => all.find((l) => l.lootId === id);
  const used = (id: string) => chosen.filter((c) => c === id).length;
  const items = all.filter((l) => pool.includes(l.lootId) && l.count > 0);
  const full = chosen.length === REROLL_SLOTS;
  const n = new Intl.NumberFormat(locale());
  return (
    <div class="rlc-veil" role="dialog" aria-modal="true" aria-label={t('lootRerollTitle')}>
      <div class="rlc-dialog rlc-lt-reroll">
        <h2>{t('lootRerollTitle')}</h2>
        <p class="rlc-muted">{t('lootRerollHint')}</p>
        <div class="rlc-lt-slots">
          {Array.from({ length: REROLL_SLOTS }, (_, i) => {
            const l = chosen[i] ? byId(chosen[i]!) : undefined;
            return l ? (
              <button type="button" key={i} class="rlc-lt-tile" aria-label={`${lootName(l)}: ${t('lootRerollRemove')}`} title={t('lootRerollRemove')} onClick={() => setChosen(chosen.filter((_, j) => j !== i))}>
                {l.tilePath ? <img src={l.tilePath} alt="" /> : null}
                <span>{lootName(l)}</span>
              </button>
            ) : (
              <div key={i} class="rlc-lt-slot" aria-hidden="true" />
            );
          })}
        </div>
        <div class="rlc-lt-grid rlc-lt-reroll-pool">
          {items.map((l) => {
            const left = l.count - used(l.lootId);
            return (
              <button type="button" key={l.lootId} class="rlc-lt-tile" aria-label={lootName(l)} title={lootName(l)} data-rarity={rarityKey(l.rarity).toLowerCase() || undefined} disabled={full || left <= 0} onClick={() => setChosen([...chosen, l.lootId])}>
                {l.tilePath ? <img src={l.tilePath} alt="" loading="lazy" decoding="async" /> : null}
                {left > 1 ? <b class="rlc-lt-count">×{n.format(left)}</b> : null}
                <span>{lootName(l)}</span>
              </button>
            );
          })}
        </div>
        <div class="rlc-dialog-actions">
          <span class="rlc-muted rlc-lt-slot-count">{fill(t('lootRerollSlots'), { n: chosen.length })}</span>
          <button type="button" class="rlc-button" disabled={full || units.length < REROLL_SLOTS} onClick={() => setChosen(autoFill(chosen, units))}>
            {t('lootRerollAuto')}
          </button>
          <button type="button" class="rlc-button" data-variant="primary" disabled={!full} onClick={() => setConfirm(true)}>
            {actionLabel(menu)}
          </button>
          <button type="button" class="rlc-button" onClick={onCancel}>
            {t('cancel')}
          </button>
        </div>
      </div>
      {confirm ? (
        <Confirm
          message={fill(t('lootRerollConfirm'), { items: chosen.map((id) => lootName(byId(id) ?? loot)).join(', ') })}
          confirmLabel={actionLabel(menu)}
          onConfirm={() => onCraft(chosen)}
          onCancel={() => setConfirm(false)}
        />
      ) : null}
    </div>
  );
}
