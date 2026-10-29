import { signal } from '@preact/signals';

/**
 * Endpoints que o client instalado tem, pelo `/help` da LCU (lido uma vez por sessão). Uma atualização da Riot pode
 * criar, trocar ou tirar endpoints: as ações que dependem de um endpoint perguntam aqui antes de aparecer, e escolhem a
 * versão que existir (giro dos Reinos v2 ou v1). Sem a lista (o `/help` falhou), tudo conta como presente: esconder
 * um botão que funciona é pior que um botão que falha e avisa.
 */
export const endpoints = signal<Set<string> | null>(null);

/** Nome da função na LCU: `POST /lol-yourshop/v1/offers/{id}/reveal` vira `PostLolYourshopV1OffersByIdReveal`. */
export function endpointName(method: string, path: string): string {
  const pascal = (s: string) => s.split(/[-_]/).filter(Boolean).map((w) => w[0]!.toUpperCase() + w.slice(1)).join('');
  const parts = path.split('?')[0]!.split('/').filter(Boolean).map((seg) => (/^\{.+\}$/.test(seg) ? `By${pascal(seg.slice(1, -1))}` : pascal(seg)));
  return pascal(method.toLowerCase()) + parts.join('');
}

/** O client tem esse endpoint? `path` com os parâmetros entre chaves, como no `/help`. */
export const supports = (method: string, path: string): boolean => endpoints.value?.has(endpointName(method, path)) ?? true;

let loading: Promise<void> | null = null;
/** Lê a lista uma vez; falha deixa `endpoints` em null (tudo presente) e tenta de novo na próxima chamada. */
export function loadEndpoints(fetcher: typeof fetch = (u, i) => fetch(u, i)): Promise<void> {
  loading ??= fetcher('/help', { headers: { Accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : null))
    .then((j: { functions?: Record<string, unknown> | Array<{ name: string }> } | null) => {
      const fns = j?.functions;
      const names = Array.isArray(fns) ? fns.map((f) => f.name) : fns ? Object.keys(fns) : [];
      if (names.length) endpoints.value = new Set(names);
      else loading = null;
    })
    .catch(() => {
      loading = null;
    });
  return loading;
}
