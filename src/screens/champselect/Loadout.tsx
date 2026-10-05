import { useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Spell } from '../../data/gamedata';
import { request } from '../../lcu/request';
import type { LolPerksPerkPageResource, TeamBuilderDirect_SkinSelectorSkin } from '../../lcu/types';
import { useAction } from '../../ui/useAction';
import type { Cell } from './logic';
import { extensions } from '../../extensions';
import type { Lcu } from '../../lcu';

const MY_SELECTION = '/lol-champ-select/v1/session/my-selection';

type Skin = TeamBuilderDirect_SkinSelectorSkin;
interface Chroma {
  id: number;
  name: string;
  unlocked: boolean;
  colors?: string[];
}

/** Skins desbloqueadas do campeão escolhido; cromas desbloqueadas da skin selecionada embaixo. */
export function SkinsTab({ lcu, skins, me }: { lcu: Lcu; skins: Skin[]; me: Cell }) {
  const apply = useAction((selectedSkinId: number) => request('PATCH', MY_SELECTION, { selectedSkinId }));
  const owned = skins.filter((s) => s.unlocked && !s.disabled);
  const chromasOf = (s: Skin) => ((s.childSkins ?? []) as unknown as Chroma[]).filter((c) => c.unlocked);
  // Croma escolhida mantém a skin mãe marcada.
  const parent = owned.find((s) => s.id === me.selectedSkinId || chromasOf(s).some((c) => c.id === me.selectedSkinId));
  const cards = extensions().skinCards;
  if (owned.length === 0 && cards.length === 0) return <p class="rlc-muted">{t('noSkins')}</p>;
  return (
    <div class="rlc-cs-skins-wrap">
      <div class="rlc-cs-skins">
        {owned.map((s) => (
          <button type="button" key={s.id} class="rlc-cs-skin" aria-label={s.name} title={s.name} aria-pressed={s === parent} disabled={apply.pending} onClick={() => apply.run(s.id)}>
            {s.tilePath ? <img src={s.tilePath} alt="" /> : null}
          </button>
        ))}
        {cards.map((Card, i) => (
          <Card key={`x${i}`} lcu={lcu} me={me} />
        ))}
      </div>
      {parent && chromasOf(parent).length ? (
        <div class="rlc-cs-chromas">
          {chromasOf(parent).map((c) => (
            <button type="button" key={c.id} class="rlc-cs-chroma" aria-label={c.name} title={c.name} aria-pressed={c.id === me.selectedSkinId} disabled={apply.pending} style={c.colors?.[0] ? { background: c.colors[0] } : undefined} onClick={() => apply.run(c.id)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Dois feitiços e a página de runas. Escolher no slot o feitiço do outro slot troca os dois, como no client da Riot. */
export function RunesSpellsTab({ me, spells, gameMode, pages, currentPage }: { me: Cell; spells: Map<number, Spell>; gameMode: string | null; pages: LolPerksPerkPageResource[]; currentPage: number | null }) {
  const [open, setOpen] = useState<1 | 2 | null>(null);
  const setSpells = useAction((body: { spell1Id?: number; spell2Id?: number }) => request('PATCH', MY_SELECTION, body));
  const setPage = useAction((id: number) => request('PUT', '/lol-perks/v1/currentpage', id));
  const available = [...spells.values()].filter((s) => !gameMode || s.gameModes.includes(gameMode)).sort((a, b) => a.name.localeCompare(b.name));
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
      <section>
        <p class="rlc-muted">{t('spells')}</p>
        <div class="rlc-cs-spell-slots">
          {slots.map(([slot, id]) => {
            const spell = spells.get(id);
            const label = `${t('spell')} ${slot}: ${spell?.name ?? id}`;
            return (
              <button type="button" key={slot} class="rlc-cs-spell-slot" aria-label={label} title={label} aria-expanded={open === slot} onClick={() => setOpen(open === slot ? null : slot)}>
                {spell?.icon ? <img src={spell.icon} alt="" /> : String(id)}
              </button>
            );
          })}
        </div>
        {open ? (
          <div class="rlc-cs-spell-list">
            {available.map((s) => (
              <button type="button" key={s.id} class="rlc-cs-spell-option" aria-label={s.name} title={s.name} disabled={setSpells.pending} onClick={() => choose(open, s.id)}>
                {s.icon ? <img src={s.icon} alt="" /> : s.name}
              </button>
            ))}
          </div>
        ) : null}
      </section>
      <section>
        <p class="rlc-muted">{t('runePages')}</p>
        <div class="rlc-cs-pages">
          {pages
            .filter((p) => p.isValid !== false)
            .map((p) => (
              <button type="button" key={p.id} class="rlc-cs-page" aria-pressed={p.id === currentPage} disabled={setPage.pending} onClick={() => setPage.run(p.id)}>
                {p.name}
              </button>
            ))}
        </div>
      </section>
    </div>
  );
}
