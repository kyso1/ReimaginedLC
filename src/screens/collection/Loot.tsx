import { useEffect, useState } from 'preact/hooks';
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
  const [group, setGroup] = useState<Group>('chests');
  const [focusId, setFocusId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ menu: LolLootContextMenu; loot: LolLootPlayerLoot } | null>(null);
  const [reveal, setReveal] = useState<LolLootPlayerLootUpdate | null>(null);
  const all = (lcu.loot.value.data ?? []).filter((l) => l.type !== 'CURRENCY' && l.count > 0);
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
        extra={(i) => <Actions key={i.id} lootId={String(i.id)} onAction={(menu) => setConfirm({ menu, loot: list.find((l) => l.lootId === i.id)! })} busy={craft.pending} />}
        chips={GROUPS.filter(([g]) => all.some((l) => lootGroup(l) === g)).map(([g, label]) => (
          <Chip key={g} on={group === g} onClick={() => setGroup(g)}>
            {t(label)}
          </Chip>
        ))}
      />
      {confirm ? (
        <Confirm
          message={`${confirm.menu.recipeContextMenuAction || confirm.menu.actionType}: ${confirm.loot.localizedName || confirm.loot.lootName}?`}
          confirmLabel={confirm.menu.recipeContextMenuAction || confirm.menu.actionType}
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
function Actions({ lootId, onAction, busy }: { lootId: string; onAction: (m: LolLootContextMenu) => void; busy: boolean }) {
  const [menu, setMenu] = useState<LolLootContextMenu[]>([]);
  useEffect(() => {
    let live = true;
    void request<LolLootContextMenu[]>('POST', `/lol-loot/v1/player-loot/${encodeURIComponent(lootId)}/context-menu`)
      .then((m) => live && setMenu(m ?? []))
      .catch(() => {});
    return () => void (live = false);
  }, [lootId]);
  if (!menu.length) return null;
  return (
    <div class="rlc-lt-actions">
      {menu.map((m) => (
        <button type="button" key={m.name} class="rlc-button" data-variant="pill" disabled={!m.enabled || busy} onClick={() => onAction(m)}>
          {m.recipeContextMenuAction || m.actionType}
        </button>
      ))}
    </div>
  );
}
