import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import type { Lcu } from '../../lcu';
import { request } from '../../lcu/request';
import type { LolPerksPerkPageResource } from '../../lcu/types';
import { Confirm } from '../../shell/overlays/Confirm';
import { useAction } from '../../ui/useAction';
import { getJson } from '../profile/data';
import { changePrimary, changeSub, fromPage, isComplete, pickSecondary, selectedIds, slotsOf, type Draft, type Style } from './runeLogic';

interface Perk {
  id: number;
  name: string;
  longDesc?: string;
  shortDesc?: string;
  iconPath?: string;
}
type Page = LolPerksPerkPageResource;

/** Texto sem as marcações que a Riot põe nas descrições (`<b>`, `<lol-uikit-…>`). */
const plain = (html: string | undefined) => (html ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/**
 * Editor de runas (layout B): uma coluna em linhas com o rótulo à esquerda — principal, secundária, fragmentos —,
 * descrição da runa em foco à direita e as páginas como abas na base.
 */
export function Runes({ lcu }: { lcu: Lcu }) {
  const [styles, setStyles] = useState<Style[]>([]);
  const [perks, setPerks] = useState<Map<number, Perk>>(new Map());
  useEffect(() => {
    let live = true;
    void getJson<Style[]>('/lol-perks/v1/styles').then((s) => live && setStyles(s ?? []));
    void getJson<Perk[]>('/lol-perks/v1/perks').then((p) => live && setPerks(new Map((p ?? []).map((x) => [x.id, x]))));
    return () => void (live = false);
  }, []);
  const pages = (lcu.perkPages.value.data ?? []).filter((p) => p.isEditable !== false);
  const [pageId, setPageId] = useState<number | null>(null);
  const page = pages.find((p) => p.id === pageId) ?? pages.find((p) => p.current) ?? pages[0] ?? null;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [name, setName] = useState('');
  const [focus, setFocus] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (page && styles.length) {
      setDraft(fromPage(page, styles));
      setName(page.name);
    }
  }, [page?.id, page?.lastModified, styles.length]);

  const save = useAction(() => request('PUT', `/lol-perks/v1/pages/${page!.id}`, { ...page, name: name.trim() || page!.name, primaryStyleId: draft!.primary, subStyleId: draft!.sub, selectedPerkIds: selectedIds(draft!) }));
  const create = useAction(async () => {
    const created = await request<Page>('POST', '/lol-perks/v1/pages', { name: t('newPage'), primaryStyleId: draft?.primary, subStyleId: draft?.sub, selectedPerkIds: draft ? selectedIds(draft) : [], current: true });
    if (created?.id) setPageId(created.id);
  });

  const primary = styles.find((s) => s.id === draft?.primary);
  const sub = styles.find((s) => s.id === draft?.sub);
  const focused = perks.get(focus ?? draft?.keystone ?? 0);

  const perkButton = (id: number, on: boolean, onPick: () => void) => {
    const p = perks.get(id);
    return (
      <button type="button" key={id} class="rlc-rn-perk" data-id={id} aria-pressed={on} aria-label={p?.name ?? String(id)} title={p?.name} onMouseEnter={() => setFocus(id)} onFocus={() => setFocus(id)} onClick={onPick}>
        {p?.iconPath ? <img src={p.iconPath} alt="" /> : null}
      </button>
    );
  };
  const styleRow = (label: string, options: Style[], current: number | undefined, onPick: (id: number) => void) => (
    <div class="rlc-rn-row" data-kind="style">
      <span class="rlc-rn-label">{label}</span>
      {options.map((s) => (
        <button type="button" key={s.id} class="rlc-rn-style" aria-pressed={s.id === current} aria-label={s.name} title={s.name} onClick={() => onPick(s.id)}>
          {s.iconPath ? <img src={s.iconPath} alt="" /> : s.name}
        </button>
      ))}
    </div>
  );

  return (
    <section class="rlc-runes">
      {draft && primary ? (
        <div class="rlc-rn-body">
          <div class="rlc-rn-rows">
            {styleRow(t('runePrimary'), styles, draft.primary, (id) => setDraft(changePrimary(draft, id, styles)))}
            <div class="rlc-rn-row" data-kind="keystone">
              <span class="rlc-rn-label" />
              {slotsOf(primary).keystone.map((id) => perkButton(id, draft.keystone === id, () => setDraft({ ...draft, keystone: id })))}
            </div>
            {slotsOf(primary).rows.map((row, i) => (
              <div class="rlc-rn-row" key={`p${i}`}>
                <span class="rlc-rn-label" />
                {row.map((id) =>
                  perkButton(id, draft.primaryPerks[i] === id, () => {
                    const next = [...draft.primaryPerks];
                    next[i] = id;
                    setDraft({ ...draft, primaryPerks: next });
                  }),
                )}
              </div>
            ))}
            {styleRow(
              t('runeSecondary'),
              styles.filter((s) => primary.allowedSubStyles.includes(s.id)),
              draft.sub,
              (id) => setDraft(changeSub(draft, id)),
            )}
            {(sub ? slotsOf(sub).rows : []).map((row, i) => (
              <div class="rlc-rn-row" key={`s${i}`}>
                <span class="rlc-rn-label" />
                {row.map((id) => perkButton(id, draft.secondary.includes(id), () => setDraft(pickSecondary(draft, id, styles))))}
              </div>
            ))}
            {slotsOf(primary).shards.map((row, i) => (
              <div class="rlc-rn-row" data-kind="shard" key={`f${i}`}>
                <span class="rlc-rn-label">{i === 0 ? t('runeShards') : ''}</span>
                {row.map((id) =>
                  perkButton(id, draft.shards[i] === id, () => {
                    const next = [...draft.shards];
                    next[i] = id;
                    setDraft({ ...draft, shards: next });
                  }),
                )}
              </div>
            ))}
          </div>
          <aside class="rlc-rn-desc">
            <h2>{focused?.name ?? ''}</h2>
            <p>{plain(focused?.longDesc ?? focused?.shortDesc)}</p>
            <input class="rlc-input" aria-label={t('pageName')} value={name} maxLength={50} onInput={(e) => setName(e.currentTarget.value)} />
            <div class="rlc-rn-actions">
              <button type="button" class="rlc-button" data-variant="primary" disabled={!page?.isEditable || !isComplete(draft) || save.pending} onClick={() => save.run()}>
                {t('save')}
              </button>
              <button type="button" class="rlc-button" data-variant="pill" disabled={!page?.isDeletable} onClick={() => setDeleting(true)}>
                {t('delete')}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
      <nav class="rlc-rn-pages">
        {pages.map((p) => (
          <button type="button" key={p.id} class="rlc-rn-page" aria-pressed={p === page} onClick={() => setPageId(p.id)}>
            {p.name}
          </button>
        ))}
        <button type="button" class="rlc-rn-page" disabled={create.pending} onClick={() => create.run()}>
          {t('newPageButton')}
        </button>
      </nav>
      {deleting && page ? (
        <Confirm
          message={`${t('deletePageConfirm')} ${page.name}`}
          confirmLabel={t('delete')}
          onConfirm={() => {
            void request('DELETE', `/lol-perks/v1/pages/${page.id}`).catch(() => {});
            setDeleting(false);
            setPageId(null);
          }}
          onCancel={() => setDeleting(false)}
        />
      ) : null}
    </section>
  );
}
