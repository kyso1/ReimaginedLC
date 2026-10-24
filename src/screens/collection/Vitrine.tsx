import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { t } from '../../i18n';
import { readSetting, writeSetting } from '../../shell/storage';
import { Crossfade } from '../../ui/Crossfade';
import { useDecoded } from '../../ui/useDecoded';

export interface VitrineItem {
  id: number | string;
  name: string;
  /** Arte do retrato na grade. */
  art: string;
  owned: boolean;
  /** Selo pequeno no topo do retrato ("M12", "Não possui"). */
  pill?: string;
  /** Cabeçalho de grupo: quando muda entre itens seguidos, a grade abre uma seção nova. */
  group?: string;
  /** Texto extra que a busca também procura (campeão da skin, coleção). */
  search?: string;
}

/** Detalhe aberto na gaveta de vidro à direita. */
export interface VitrineDetail {
  splash: string;
  name: string;
  kicker?: string;
  body?: ComponentChildren;
}

/**
 * Vitrine da Coleção: busca e chips no topo, grade densa de retratos com nome centralizado no pé.
 * Clicar num retrato chama `onPick`; quem chama decide se abre a gaveta (`detail`) ou age direto (equipar ícone).
 */
export function Vitrine({ items, tools, placeholder, square = false, onPick, detail, onClose }: { items: VitrineItem[]; tools?: ComponentChildren; placeholder: string; square?: boolean; onPick: (item: VitrineItem) => void; detail: VitrineDetail | null; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLocaleLowerCase();
  const list = q ? items.filter((i) => `${i.name} ${i.search ?? ''}`.toLocaleLowerCase().includes(q)) : items;
  return (
    <div class="rlc-vt" data-square={square ? 'true' : undefined}>
      <div class="rlc-vt-tools">
        <input type="search" class="rlc-vt-search" placeholder={placeholder} aria-label={placeholder} value={query} onInput={(e) => setQuery(e.currentTarget.value)} />
        {tools}
      </div>
      <div class="rlc-vt-grid">
        {list.length ? null : <p class="rlc-muted">{t('colEmpty')}</p>}
        {list.map((i, n) => [
          i.group && i.group !== list[n - 1]?.group ? <h3 key={`g${i.group}`} class="rlc-vt-group">{i.group}</h3> : null,
          <button type="button" key={i.id} class="rlc-vt-tile" aria-label={i.name} title={i.name} data-owned={i.owned ? 'true' : 'false'} onClick={() => onPick(i)}>
            {i.art ? <img src={i.art} alt="" loading="lazy" decoding="async" /> : null}
            {i.pill ? <span class="rlc-vt-pill">{i.pill}</span> : null}
            <span class="rlc-vt-name">{i.name}</span>
          </button>,
        ])}
      </div>
      {detail ? <Drawer detail={detail} onClose={onClose} /> : null}
    </div>
  );
}

function Drawer({ detail, onClose }: { detail: VitrineDetail; onClose: () => void }) {
  const splash = useDecoded(detail.splash);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div class="rlc-vt-drawer" role="dialog" aria-label={detail.name}>
      {/* Trocar de item com a gaveta aberta funde a arte nova sobre a anterior. */}
      <div class="rlc-vt-splash">
        <Crossfade src={splash} />
      </div>
      <button type="button" class="rlc-vt-close" aria-label={t('close')} onClick={onClose}>
        ✕
      </button>
      <div class="rlc-vt-info">
        {detail.kicker ? <small class="rlc-vt-kicker">{detail.kicker}</small> : null}
        <h2 class="rlc-vt-title">{detail.name}</h2>
        {detail.body}
      </div>
    </div>
  );
}

/** Chip de alternância da Vitrine, com contador opcional. */
export function Chip({ on, onClick, children, count }: { on: boolean; onClick: () => void; children: ComponentChildren; count?: number }) {
  return (
    <button type="button" class="rlc-vt-chip" aria-pressed={on} onClick={onClick}>
      {children}
      {count === undefined ? null : <small>{count}</small>}
    </button>
  );
}

/** Lista suspensa da barra de filtros; cada opção é [valor, rótulo, contador?]. */
export function Select<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Array<[T, string, number?]>; onChange: (v: T) => void }) {
  return (
    <select class="rlc-vt-select" aria-label={label} title={label} value={value} onChange={(e) => onChange(e.currentTarget.value as T)}>
      {options.map(([v, l, n]) => (
        <option key={v} value={v}>
          {n === undefined ? l : `${l} (${n})`}
        </option>
      ))}
    </select>
  );
}

const SAVED = 'rlc.collection.filters';
/** Filtros de uma seção da Coleção, lembrados no DataStore. Valor salvo de tipo diferente do padrão é ignorado. */
export function useSaved<T extends Record<string, string>>(section: string, def: T): [T, (patch: Partial<T>) => void] {
  const [value, setValue] = useState<T>(() => {
    const all = readSetting<Record<string, Record<string, unknown>> | null>(SAVED, null);
    const saved = all && typeof all[section] === 'object' ? all[section] : {};
    const out = { ...def };
    for (const k of Object.keys(def) as Array<keyof T>) if (typeof saved?.[k as string] === 'string') out[k] = saved[k as string] as T[keyof T];
    return out;
  });
  const patch = (p: Partial<T>) => {
    const next = { ...value, ...p };
    setValue(next);
    writeSetting(SAVED, { ...readSetting<Record<string, unknown>>(SAVED, {}), [section]: next });
  };
  return [value, patch];
}

/** Itens que passam em todos os filtros menos `skip` (para contar as opções do filtro `skip`). */
export function facet<T>(rows: T[], tests: Record<string, (r: T) => boolean>, skip?: string): T[] {
  const active = Object.entries(tests).filter(([k]) => k !== skip);
  return rows.filter((r) => active.every(([, f]) => f(r)));
}

/** Contagem por valor; `keys` pode devolver vários valores por item (rotas de um campeão). */
export function tally<T>(rows: T[], keys: (r: T) => string | string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) for (const k of ([] as string[]).concat(keys(r))) m.set(k, (m.get(k) ?? 0) + 1);
  return m;
}
