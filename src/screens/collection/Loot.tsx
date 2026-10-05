import { useEffect, useMemo, useState } from 'preact/hooks';
import { locale, t, type TextKey } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolLootContextMenu, LolLootPlayerLoot, LolLootPlayerLootUpdate } from '../../lcu/types';
import { Confirm } from '../../shell/overlays/Confirm';
import { useAction } from '../../ui/useAction';
import { Chip, Cinema, type CinemaItem } from './Cinema';

type Group = 'chests' | 'champions' | 'skins' | 'cosmetics' | 'emotes' | 'materials';
const GROUPS: Array<[Group, TextKey]> = [
  ['chests', 'lootChests'],
  ['champions', 'colChampions'],
  ['skins', 'colSkins'],
  ['cosmetics', 'lootCosmetics'],
  ['emotes', 'colEmotes'],
  ['materials', 'lootMaterials'],
];

/** Categoria do item pelo `displayCategories` da LCU; o que não se reconhece vai para Materiais. */
const ACTION: Record<string, TextKey> = { OPEN: 'lootOpen', DISENCHANT: 'lootDisenchant', UPGRADE: 'lootUpgrade', REROLL: 'lootReroll', FORGE: 'lootForge' };
const ESSENCE: Record<string, TextKey> = { CURRENCY_cosmetic: 'lootOrangeShort', CURRENCY_champion: 'lootBlueShort' };

/** Rótulo da ação: a LCU costuma mandar `recipeContextMenuAction` vazio; aí usa o nosso, com a essência ganha ou gasta. */
export function actionLabel(m: LolLootContextMenu): string {
  if (m.recipeContextMenuAction) return m.recipeContextMenuAction;
  const base = ACTION[m.actionType] ? t(ACTION[m.actionType]!) : m.actionType;
  const q = m.essenceQuantity ?? 0;
  if (!q) return base;
  const unit = ESSENCE[m.essenceType] ? ` ${t(ESSENCE[m.essenceType]!)}` : '';
  return `${base} (${q > 0 ? '+' : '−'}${Math.abs(q)}${unit})`;
}

export function lootGroup(l: LolLootPlayerLoot): Group {
  const c = String(l.displayCategories ?? '').toUpperCase();
  if (c.includes('CHEST')) return 'chests';
  if (c.includes('CHAMPION')) return 'champions';
  if (c.includes('SKIN') && !c.includes('WARD')) return 'skins';
  if (c.includes('WARD') || c.includes('ICON')) return 'cosmetics';
  if (c.includes('EMOTE')) return 'emotes';
  return 'materials';
}

/**
 * Espólios: item em foco grande, quantidade e as ações do menu de contexto da LCU.
 * Toda ação gasta recursos e não tem volta: pede confirmação. O que sai é revelado numa animação.
 */
export function Loot({ lcu }: { lcu: Lcu }) {
  const [chosen, setGroup] = useState<Group>('chests');
  const [focusId, setFocusId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ menu: LolLootContextMenu; loot: LolLootPlayerLoot } | null>(null);
  const [reveal, setReveal] = useState<LolLootPlayerLootUpdate | null>(null);
  // Cache do menu vale para um estado do espólio: qualquer mudança (chave nova, essência gasta) consulta de novo.
  const menus = useMemo<MenuCache>(() => new Map(), [lcu.loot.value]);
  // A LCU manda itens sem lootId (count > 0, sem nome): ficam de fora.
  const all = (lcu.loot.value.data ?? []).filter((l) => l.lootId && l.type !== 'CURRENCY' && l.count > 0);
  const present = GROUPS.filter(([g]) => all.some((l) => lootGroup(l) === g));
  // Grupo escolhido vazio (sem baús, ou o último item gasto): cai no primeiro que tem itens.
  const group = present.some(([g]) => g === chosen) ? chosen : (present[0]?.[0] ?? chosen);
  const list = all.filter((l) => lootGroup(l) === group);
  const n = new Intl.NumberFormat(locale());
  const items: CinemaItem[] = list.map((l) => ({
    id: l.lootId,
    name: l.localizedName || l.itemDesc || l.lootName,
    tile: l.tilePath,
    splash: l.splashPath || undefined,
    owned: true,
    kicker: l.rarity && l.rarity !== 'DEFAULT' ? l.rarity.toLowerCase() : undefined,
    detail: `×${n.format(l.count)}`,
  }));
  const focus = list.find((l) => l.lootId === focusId) ?? list[0];
  const craft = useAction(async (menu: LolLootContextMenu, loot: LolLootPlayerLoot) => {
    const ids = [loot.lootId, ...(menu.requiredOthers ? [menu.requiredOthers] : [])];
    const result = await request<LolLootPlayerLootUpdate>('POST', `/lol-loot/v1/recipes/${encodeURIComponent(menu.name)}/craft?repeat=1`, ids);
    if (result?.added?.length) setReveal(result);
  });

  return (
    <div class="rlc-loot">
      <Cinema
        items={items}
        onEnter={(i) => setFocusId(String(i.id))}
        extra={(i) => <Actions key={i.id} lootId={String(i.id)} count={list.find((l) => l.lootId === i.id)?.count ?? 0} cache={menus} onAction={(menu) => setConfirm({ menu, loot: list.find((l) => l.lootId === i.id)! })} busy={craft.pending} />}
        chips={present.map(([g, label]) => (
          <Chip key={g} on={group === g} onClick={() => setGroup(g)}>
            {t(label)}
          </Chip>
        ))}
      />
      {confirm ? (
        <Confirm
          message={`${actionLabel(confirm.menu)}: ${confirm.loot.localizedName || confirm.loot.lootName}?`}
          confirmLabel={actionLabel(confirm.menu)}
          onConfirm={() => {
            craft.run(confirm.menu, confirm.loot);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
      {reveal ? (
        <div class="rlc-veil rlc-lt-reveal" role="dialog" aria-modal="true">
          <h2>{t('lootReceived')}</h2>
          <div class="rlc-lt-reveal-cards">
            {reveal.added.map((a, i) => {
              const p = (a as unknown as { playerLoot?: { localizedName?: string; tilePath?: string } }).playerLoot;
              return (
                <div key={i} class="rlc-lt-reveal-card" style={{ animationDelay: `${i * 120}ms` }}>
                  {p?.tilePath ? <img src={p.tilePath} alt="" /> : null}
                  <span>{p?.localizedName ?? ''}</span>
                </div>
              );
            })}
          </div>
          <button type="button" class="rlc-button" data-variant="primary" onClick={() => setReveal(null)}>
            {t('ok')}
          </button>
        </div>
      ) : null}
      {focus ? null : <p class="rlc-muted rlc-lt-empty">{t('lootEmpty')}</p>}
    </div>
  );
}

/** Ações do item em foco, como a LCU as oferece no menu de contexto. */
type MenuCache = Map<string, Promise<LolLootContextMenu[]>>;

/** Menu de ações do item. Uma consulta por item e quantidade (passar o mouse de novo usa o cache); falha deixa sem ações, sem aviso. */
function Actions({ lootId, count, cache, onAction, busy }: { lootId: string; count: number; cache: MenuCache; onAction: (m: LolLootContextMenu) => void; busy: boolean }) {
  const [menu, setMenu] = useState<LolLootContextMenu[]>([]);
  useEffect(() => {
    let live = true;
    const key = `${lootId}:${count}`;
    let entry = cache.get(key);
    if (!entry) {
      entry = fetch(`/lol-loot/v1/player-loot/${encodeURIComponent(lootId)}/context-menu`, { method: 'POST' })
        .then((r) => (r.ok ? (r.json() as Promise<LolLootContextMenu[]>) : []))
        .catch(() => []);
      cache.set(key, entry);
    }
    void entry.then((m) => live && setMenu(Array.isArray(m) ? m : []));
    return () => void (live = false);
  }, [lootId, count, cache]);
  if (!menu.length) return null;
  return (
    <div class="rlc-lt-actions">
      {menu.map((m) => (
        <button type="button" key={m.name} class="rlc-button" data-variant="pill" disabled={!m.enabled || busy} onClick={() => onAction(m)}>
          {actionLabel(m)}
        </button>
      ))}
    </div>
  );
}
