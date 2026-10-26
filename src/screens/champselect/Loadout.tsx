import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Spell } from '../../data/gamedata';
import { request } from '../../lcu/request';
import type { TeamBuilderDirect_SkinSelectorSkin } from '../../lcu/types';
import { useAction } from '../../ui/useAction';
import { getJson } from '../profile/data';
import { chooseRoseChroma, chooseRoseSkin, requestRoseMods, roseChoice, roseMods, roseModSelected, selectRoseMod } from '../../plugins/rose';
import type { Cell } from './logic';

const MY_SELECTION = '/lol-champ-select/v1/session/my-selection';

type Skin = TeamBuilderDirect_SkinSelectorSkin;
interface Chroma {
  id: number;
  name: string;
  unlocked: boolean;
  colors?: string[];
}

/**
 * Carrossel de skins desbloqueadas do campeão sob a splash; cromas desbloqueadas da skin selecionada ao lado.
 * Com o ROSE conectado (`rose`), entram também as skins e cromas não possuídas e os mods da skin: essas vão só para o
 * ROSE (`pick` guarda a skin escolhida para o palco), nunca para a LCU.
 */
export function SkinCarousel({ skins, me, rose = false, pick = null, onPick }: { skins: Skin[]; me: Cell; rose?: boolean; pick?: number | null; onPick?: (id: number | null) => void }) {
  const apply = useAction((selectedSkinId: number) => request('PATCH', MY_SELECTION, { selectedSkinId }));
  const shown = skins.filter((s) => !s.disabled && (s.unlocked || rose));
  const parent = skinOf(shown, pick ?? me.selectedSkinId);
  // Croma escolhida pelo ROSE, se for desta skin.
  const pickedChroma = rose ? roseChoice.value?.chroma : null;
  const chroma = pickedChroma && parent && skinOf([parent], pickedChroma.id) ? pickedChroma : null;
  // Mods do ROSE da skin (ou croma do ROSE) em destaque.
  const modSkin = parent ? (chroma?.id ?? parent.id) : 0;
  useEffect(() => {
    if (rose && modSkin) requestRoseMods(me.championId, modSkin);
  }, [rose, modSkin, me.championId]);
  if (shown.length === 0) return null;

  const chooseSkin = (s: Skin) => {
    if (s.unlocked) {
      onPick?.(null);
      if (s.id !== me.selectedSkinId) apply.run(s.id);
    } else onPick?.(s.id);
    if (rose) chooseRoseSkin(s.name);
  };
  const chooseChroma = (p: Skin, c: Chroma) => {
    if (c.unlocked && p.unlocked) {
      onPick?.(null);
      apply.run(c.id);
    } else if (p.unlocked) {
      // Croma não possuída de skin possuída: a LCU fica com a skin mãe, a croma vai pelo ROSE.
      onPick?.(null);
      if (me.selectedSkinId !== p.id) apply.run(p.id);
    } else onPick?.(p.id);
    if (rose) chooseRoseChroma(p.name, { id: c.id, name: c.name, championId: me.championId, baseSkinId: p.id });
  };
  const chromas = parent ? chromasOf(parent, rose) : [];
  const mods = rose && roseMods.value?.skinId === modSkin ? roseMods.value.mods : [];
  return (
    <div class="rlc-cs-carousel">
      <div class="rlc-cs-skins">
        {shown.map((s) => (
          <button type="button" key={s.id} class="rlc-cs-skin" data-rose={s.unlocked ? undefined : ''} aria-label={s.name} title={s.name} aria-pressed={s === parent} disabled={apply.pending} onClick={() => chooseSkin(s)}>
            {s.tilePath ? <img src={s.tilePath} alt="" /> : null}
            {s.unlocked ? null : <span class="rlc-cs-rose-badge">ROSE</span>}
          </button>
        ))}
        {mods.map((m) => {
          const on = roseModSelected.value === m.id;
          return (
            <button type="button" key={m.id} class="rlc-cs-skin rlc-cs-mod" data-rose="" aria-label={m.name} title={m.name} aria-pressed={on} onClick={() => selectRoseMod(me.championId, modSkin, on ? null : m)}>
              {m.thumbnailUrl ? <img src={m.thumbnailUrl} alt="" /> : <span class="rlc-cs-mod-name">{m.name}</span>}
              <span class="rlc-cs-rose-badge">{t('roseCustom')}</span>
            </button>
          );
        })}
      </div>
      {parent && chromas.length ? (
        <div class="rlc-cs-chromas">
          {chromas.map((c) => (
            <button
              type="button"
              key={c.id}
              class="rlc-cs-chroma"
              data-rose={c.unlocked && parent.unlocked ? undefined : ''}
              aria-label={c.name}
              title={c.name}
              aria-pressed={chroma ? chroma.id === c.id : c.id === me.selectedSkinId}
              disabled={apply.pending}
              style={c.colors?.[0] ? { background: c.colors[0] } : undefined}
              onClick={() => chooseChroma(parent, c)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Cromas da skin: só as desbloqueadas, ou todas com o ROSE. */
const chromasOf = (s: Skin, all = false) => ((s.childSkins ?? []) as unknown as Chroma[]).filter((c) => all || c.unlocked);
/** Skin de um id; croma escolhida conta como a skin mãe. */
export const skinOf = (skins: Skin[], id: number) => skins.find((s) => s.id === id || chromasOf(s, true).some((c) => c.id === id));

interface Ward {
  id: number;
  name: string;
  wardImagePath: string;
  ownership?: { owned?: boolean };
}
interface AccountLoadout {
  id: string;
  loadout?: Record<string, { itemId?: number }>;
}
const WARD_SLOT = 'WARD_SKIN_SLOT';

/**
 * Sentinela equipada e a lista das possuídas. A sentinela vale para a conta (loadout `WARD_SKIN_SLOT`):
 * o client oficial troca por PATCH no loadout da conta, e é isso que se faz aqui. Sem item no slot vale a primeira.
 */
export function WardPicker({ summonerId }: { summonerId: number | null | undefined }) {
  const [wards, setWards] = useState<Ward[]>([]);
  const [account, setAccount] = useState<AccountLoadout | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!summonerId) return;
    let live = true;
    void getJson<Ward[]>(`/lol-collections/v1/inventories/${summonerId}/ward-skins`).then((w) => live && setWards((w ?? []).filter((x) => x.ownership?.owned)));
    void getJson<AccountLoadout[]>('/lol-loadouts/v4/loadouts/scope/account').then((l) => live && setAccount(l?.[0] ?? null));
    return () => void (live = false);
  }, [summonerId]);
  const equip = useAction(async (itemId: number) => {
    const id = account!.id;
    await request('PATCH', `/lol-loadouts/v4/loadouts/${id}`, { id, loadout: { [WARD_SLOT]: { inventoryType: 'WARD_SKIN', itemId } } });
    setAccount((a) => a && { ...a, loadout: { ...a.loadout, [WARD_SLOT]: { ...a.loadout?.[WARD_SLOT], itemId } } });
  });
  if (!account || wards.length === 0) return null;
  const current = wards.find((w) => w.id === account.loadout?.[WARD_SLOT]?.itemId) ?? wards[0]!;
  const label = `${t('csWard')}: ${current.name}`;
  return (
    <div class="rlc-cs-ward">
      <button type="button" class="rlc-cs-spell-slot" aria-label={label} title={label} aria-expanded={open} onClick={() => setOpen(!open)}>
        {current.wardImagePath ? <img src={current.wardImagePath} alt="" /> : null}
      </button>
      {open ? (
        <div class="rlc-cs-spell-list rlc-cs-ward-list" role="menu" aria-label={t('csWard')}>
          {wards.map((w) => (
            <button
              type="button"
              role="menuitem"
              key={w.id}
              class="rlc-cs-spell-option"
              aria-label={w.name}
              title={w.name}
              aria-current={w === current ? 'true' : undefined}
              disabled={equip.pending}
              onClick={() => {
                setOpen(false);
                if (w !== current) equip.run(w.id);
              }}
            >
              {w.wardImagePath ? <img src={w.wardImagePath} alt="" loading="lazy" /> : w.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Feitiços, runas e sentinela na barra de baixo, sempre visível como no client: dois feitiços, o nome da página atual,
 * o botão que abre o editor de runas e a sentinela.
 * Escolher no slot o feitiço do outro slot troca os dois, como no client da Riot.
 */
export function Loadout({ me, spells, gameMode, pageName, onRunes, summonerId }: { me: Cell; spells: Map<number, Spell>; gameMode: string | null; pageName: string | null; onRunes: () => void; summonerId?: number | null }) {
  const [open, setOpen] = useState<1 | 2 | null>(null);
  const setSpells = useAction((body: { spell1Id?: number; spell2Id?: number }) => request('PATCH', MY_SELECTION, body));
  const available = [...spells.values()].filter((s) => !gameMode || s.gameModes.includes(gameMode)).sort((a, b) => a.name.localeCompare(b.name));
  // Arena: o mapa não tem runas e os dois feitiços do modo são fixos (Flash e Fuga), como no client.
  const arena = gameMode === 'CHERRY';
  const fixed = arena || (available.length > 0 && available.length <= 2);
  const slots: Array<[1 | 2, number]> = [
    [1, me.spell1Id],
    [2, me.spell2Id],
  ];
  const choose = (slot: 1 | 2, id: number) => {
    setOpen(null);
    const [mine, other] = slot === 1 ? [me.spell1Id, me.spell2Id] : [me.spell2Id, me.spell1Id];
    if (id === mine) return;
    if (id === other) setSpells.run(slot === 1 ? { spell1Id: id, spell2Id: mine } : { spell1Id: mine, spell2Id: id });
    else setSpells.run(slot === 1 ? { spell1Id: id } : { spell2Id: id });
  };
  return (
    <div class="rlc-cs-loadout">
      <div class="rlc-cs-spell-slots">
        {slots.map(([slot, id]) => {
          const spell = spells.get(id);
          const label = `${t('spell')} ${slot}: ${spell?.name ?? id}`;
          return (
            <button type="button" key={slot} class="rlc-cs-spell-slot" aria-label={label} title={label} aria-expanded={fixed ? undefined : open === slot} disabled={fixed} onClick={() => setOpen(open === slot ? null : slot)}>
              {spell?.icon ? <img src={spell.icon} alt="" /> : String(id)}
            </button>
          );
        })}
        {open ? (
          <div class="rlc-cs-spell-list" role="menu">
            {available.map((s) => (
              <button type="button" role="menuitem" key={s.id} class="rlc-cs-spell-option" aria-label={s.name} title={s.name} disabled={setSpells.pending} onClick={() => choose(open, s.id)}>
                {s.icon ? <img src={s.icon} alt="" /> : s.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {arena ? null : (
        <div class="rlc-cs-runes">
          <span class="rlc-cs-page-name">{pageName ?? t('runeNoPage')}</span>
          <button type="button" class="rlc-button" data-variant="pill" onClick={onRunes}>
            {t('runeOpen')}
          </button>
        </div>
      )}
      <WardPicker summonerId={summonerId} />
    </div>
  );
}
