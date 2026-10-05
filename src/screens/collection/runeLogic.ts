import type { LolPerksPerkPageResource } from '../../lcu/types';

export interface Style {
  id: number;
  name: string;
  iconPath: string;
  allowedSubStyles: number[];
  defaultSubStyle: number;
  defaultPerks: number[];
  slots: Array<{ type: string; perks: number[] }>;
}

/** Rascunho da página em edição. A ordem final dos 9 ids é a da LCU. */
export interface Draft {
  primary: number;
  sub: number;
  keystone: number;
  primaryPerks: number[];
  secondary: number[];
  shards: number[];
}

/** Slots de um estilo: pedra angular, três linhas regulares e três de fragmentos (pelo tipo; a posição é o reserva). */
export function slotsOf(style: Style) {
  const keystone = style.slots.find((s) => /KeyStone/i.test(s.type))?.perks ?? style.slots[0]?.perks ?? [];
  const shards = style.slots.filter((s) => /StatMod/i.test(s.type)).map((s) => s.perks);
  const rows = style.slots.filter((s) => !/KeyStone|StatMod/i.test(s.type)).map((s) => s.perks);
  return { keystone, rows, shards: shards.length ? shards : style.slots.slice(4, 7).map((s) => s.perks) };
}

const find = (styles: Style[], id: number) => styles.find((s) => s.id === id);

export function fromPage(page: LolPerksPerkPageResource, styles: Style[]): Draft {
  const ids = page.selectedPerkIds ?? [];
  const primary = page.primaryStyleId || styles[0]?.id || 0;
  const style = find(styles, primary);
  const fallback = style?.defaultPerks ?? [];
  const pick = (i: number) => ids[i] ?? fallback[i] ?? 0;
  return {
    primary,
    sub: page.subStyleId || style?.defaultSubStyle || 0,
    keystone: pick(0),
    primaryPerks: [pick(1), pick(2), pick(3)],
    secondary: [ids[4], ids[5]].filter((x): x is number => !!x),
    shards: [pick(6), pick(7), pick(8)],
  };
}

export const selectedIds = (d: Draft) => [d.keystone, ...d.primaryPerks, ...d.secondary, ...d.shards];
export const isComplete = (d: Draft) => d.keystone > 0 && d.primaryPerks.every((p) => p > 0) && d.secondary.length === 2 && d.shards.every((p) => p > 0);

/** Secundária: duas runas de linhas diferentes. Mesma linha troca; uma terceira linha tira a mais antiga. */
export function pickSecondary(d: Draft, perk: number, styles: Style[]): Draft {
  const rows = slotsOf(find(styles, d.sub) ?? (styles[0] as Style)).rows;
  const rowOf = (p: number) => rows.findIndex((r) => r.includes(p));
  const row = rowOf(perk);
  if (row < 0) return d;
  const kept = d.secondary.filter((p) => rowOf(p) !== row);
  return { ...d, secondary: [...kept, perk].slice(-2) };
}

/** Novo estilo principal: padrões dele; se a secundária ficar igual, vai para a secundária padrão. */
export function changePrimary(d: Draft, primary: number, styles: Style[]): Draft {
  const style = find(styles, primary);
  if (!style) return d;
  const def = style.defaultPerks;
  const sub = d.sub === primary || !style.allowedSubStyles.includes(d.sub) ? style.defaultSubStyle : d.sub;
  return { primary, sub, keystone: def[0] ?? 0, primaryPerks: [def[1] ?? 0, def[2] ?? 0, def[3] ?? 0], secondary: sub === d.sub ? d.secondary : [], shards: d.shards };
}

export const changeSub = (d: Draft, sub: number): Draft => (sub === d.sub ? d : { ...d, sub, secondary: [] });
