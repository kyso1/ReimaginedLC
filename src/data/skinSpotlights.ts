import table from './skinSpotlights.json';

// Vídeo do canal SkinSpotlights por skin (tools/spotlights/update.mjs gera a tabela). O id vem de terceiros:
// só passa o formato de id do YouTube, para nunca virar outra coisa na URL do iframe.
const ID = /^[\w-]{11}$/;

/** Id do vídeo no YouTube da skin (a mãe, para cromas e estágios); null sem vídeo. */
export function spotlightOf(skinId: number | undefined): string | null {
  const id = skinId ? (table as Record<string, string>)[String(skinId)] : undefined;
  return id && ID.test(id) ? id : null;
}
