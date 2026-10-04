const depName = (d) => (typeof d === 'string' ? d : d?.fullName ?? '');

export function buildScreens(plugins, endpoints, decisions) {
  const perBackend = {};
  for (const e of endpoints) if (e.plugin) perBackend[e.plugin] = (perBackend[e.plugin] ?? 0) + 1;

  const rows = [];
  const missing = [];
  for (const p of plugins) {
    if (!p.fullName.startsWith('rcp-fe-')) continue;
    const decision = decisions[p.fullName];
    if (!decision) {
      missing.push(p.fullName);
      continue;
    }
    // A API de plugins não liga rcp-fe-* a rcp-be-* (dependencies só traz outros rcp-fe-*), então
    // une: dependências rcp-be-* declaradas, o namespace LCU homônimo da tela e `backends` de decisions.json.
    const own = p.fullName.slice('rcp-fe-'.length);
    const backends = [...new Set([
      ...(p.dependencies ?? []).map(depName).filter((n) => n.startsWith('rcp-be-')).map((n) => n.slice('rcp-be-'.length)),
      ...(own in perBackend ? [own] : []),
      ...(decision.backends ?? []),
    ])].sort();
    rows.push({
      plugin: p.fullName,
      ...decision,
      backends,
      endpoints: backends.reduce((n, b) => n + (perBackend[b] ?? 0), 0),
    });
  }
  rows.sort((a, b) => (a.subprojeto ?? 99) - (b.subprojeto ?? 99) || a.plugin.localeCompare(b.plugin));
  return { rows, missing, pending: rows.filter((r) => r.decisao === 'investigar').map((r) => r.plugin) };
}
