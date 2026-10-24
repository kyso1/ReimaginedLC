import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolPerksPerkPageResource, LolPerksPlayerInventory } from '../../lcu/types';
import { useAction } from '../../ui/useAction';
import { RuneEditor } from '../champselect/RuneEditor';
import { getJson } from '../profile/data';
import type { Style } from './runeLogic';

/**
 * Coleção › Runas: páginas em cartões (pedra angular, árvore secundária e nome) e "Criar nova".
 * Clicar num cartão abre o mesmo editor da seleção de campeões, em tela cheia.
 */
export function Runes({ lcu }: { lcu: Lcu }) {
  const pages = lcu.perkPages.value.data ?? [];
  const [open, setOpen] = useState<number | null>(null);
  const [inventory, setInventory] = useState<LolPerksPlayerInventory | null>(null);
  useEffect(() => void getJson<LolPerksPlayerInventory>('/lol-perks/v1/inventory').then(setInventory), [pages.length]);
  // Página nova com os padrões da primeira árvore, já aberta no editor. (POST a confirmar no client ao vivo.)
  const create = useAction(async () => {
    const s = (await getJson<Style[]>('/lol-perks/v1/styles'))?.[0];
    const created = await request<LolPerksPerkPageResource>('POST', '/lol-perks/v1/pages', { name: t('newPage'), primaryStyleId: s?.id, subStyleId: s?.defaultSubStyle, selectedPerkIds: s?.defaultPerks ?? [], current: true });
    if (created?.id) setOpen(created.id);
  });
  const canCreate = inventory?.canAddCustomPage !== false;

  return (
    <section class="rlc-runes">
      <div class="rlc-rp-grid">
        {pages.map((p) => (
          <button type="button" key={p.id} class="rlc-rp-card" aria-pressed={p.current} onClick={() => setOpen(p.id)}>
            <span class="rlc-rp-icons">
              {p.pageKeystone?.iconPath ? <img class="rlc-rp-key" src={p.pageKeystone.iconPath} alt="" /> : null}
              {p.secondaryStyleIconPath ? <img class="rlc-rp-sub" src={p.secondaryStyleIconPath} alt="" /> : null}
            </span>
            <span class="rlc-rp-name">{p.name}</span>
          </button>
        ))}
        <button type="button" class="rlc-rp-card" data-kind="new" disabled={!canCreate || create.pending} title={canCreate ? undefined : t('runeFull')} onClick={() => create.run()}>
          <span class="rlc-rp-plus" aria-hidden="true">＋</span>
          <span class="rlc-rp-name">{t('runeCreate')}</span>
        </button>
      </div>
      {open !== null ? <RuneEditor lcu={lcu} mode="full" initialPageId={open} onClose={() => setOpen(null)} /> : null}
    </section>
  );
}
