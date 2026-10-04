const NUM = new Set(['int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'float', 'double']);
const BUILTIN = new Set([...NUM, 'string', 'bool', 'object', 'vector', 'map', '']);

export const ident = (name) => name.replace(/[^A-Za-z0-9_]/g, '_').replace(/^(\d)/, '_$1');

export function tsType(t) {
  if (!t || !t.type) return 'unknown';
  // ponytail: int64/uint64 viram number; perdem precisão acima de 2^53.
  // Se algum ID da LCU passar disso, trocar por string no ponto de uso.
  if (NUM.has(t.type)) return 'number';
  if (t.type === 'string') return 'string';
  if (t.type === 'bool') return 'boolean';
  if (t.type === 'object') return 'unknown';
  if (t.type === 'vector') return `${tsType({ type: t.elementType })}[]`;
  if (t.type === 'map') return `Record<string, ${tsType({ type: t.elementType })}>`;
  return ident(t.type);
}

export function genTypes(help) {
  const out = ['// Gerado por tools/dump/fetch-api.mjs a partir de /help?format=Full. Não editar.', ''];
  const defined = new Set();
  const referenced = new Set();
  const ref = (t) => {
    if (!t) return;
    for (const n of [t.type, t.elementType]) if (n && !BUILTIN.has(n)) referenced.add(ident(n));
  };

  for (const t of help.types) {
    const name = ident(t.name);
    if (defined.has(name)) continue;
    defined.add(name);
    if (t.values?.length) {
      out.push(`export type ${name} = ${t.values.map((v) => JSON.stringify(v.name)).join(' | ')};`);
      continue;
    }
    out.push(`export interface ${name} {`);
    const seenFields = new Set();
    for (const f of t.fields ?? []) {
      if (seenFields.has(f.name)) continue;
      seenFields.add(f.name);
      ref(f.type);
      out.push(`  ${JSON.stringify(f.name)}${f.optional ? '?' : ''}: ${tsType(f.type)};`);
    }
    out.push('}');
  }

  for (const f of help.functions) {
    ref(f.returns);
    for (const a of f.arguments ?? []) ref(a.type);
  }
  for (const n of [...referenced].sort()) if (!defined.has(n)) out.push(`export type ${n} = unknown;`);

  return out.join('\n') + '\n';
}
