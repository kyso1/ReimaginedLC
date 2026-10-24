import { expect, test } from 'vitest';
import { parseGallery, parseNav, parsePage } from './featured';

test('abas: páginas da tela inicial e sites embutidos; sem título fica de fora', () => {
  const nav = {
    data: [
      { title: 'True Damage', action: { type: 'lc_home_tab', payload: { tabId: 'td' } } },
      { title: 'Hall', action: { type: 'iframed', payload: { url: 'https://x' } } },
      { title: '', action: { type: 'lc_home_tab', payload: { tabId: 'vazio' } } },
    ],
  };
  expect(parseNav(nav)).toEqual([
    { id: 'td', title: 'True Damage', kind: 'page' },
    { id: 'https://x', title: 'Hall', kind: 'embed', url: 'https://x' },
  ]);
  expect(parseNav(null)).toEqual([]);
});

test('galeria: itens com imagem viram slides, sem o * do título; sem imagem fica de fora', () => {
  const img = (url: string) => ({ type: 'image', url });
  const page = {
    blades: [
      { type: 'leagueClientMastheadContentBlock' },
      {
        type: 'mediaGallery',
        items: [
          { mediaGalleryItemID: 'a', header: { title: '*Akali', links: [{ title: 'x' }] } },
          { mediaGalleryItemID: 'y', header: { title: '*Yasuo', links: [{ media: img('/y.png'), action: { type: 'lc_store_paw' } }] } },
          { mediaGalleryItemID: 's', header: { title: 'Senna', links: [{ title: 'sem ação' }, { media: img('/s.jpg') }] } },
        ],
      },
    ],
  };
  expect(parseGallery(page)).toEqual([
    { id: 'y', title: 'Yasuo', image: '/y.png', store: true },
    { id: 's', title: 'Senna', image: '/s.jpg', store: false },
  ]);
  expect(parseGallery(null)).toEqual([]);
});

test('abas embutidas (site da Riot) entram com o endereço no idioma do client; http fica de fora', () => {
  const nav = {
    data: [
      { title: 'Worlds', action: { type: 'iframed', payload: { url: 'https://embed.rgpub.io/x/{LOCALE}/' } } },
      { title: 'Hall', action: { type: 'iframed', payload: { url: 'https://embed.rgpub.io/y/{locale}/' } } },
      { title: 'Ruim', action: { type: 'iframed', payload: { url: 'http://exemplo/' } } },
    ],
  };
  expect(parseNav(nav, 'pt_BR')).toEqual([
    { id: 'https://embed.rgpub.io/x/{LOCALE}/', title: 'Worlds', kind: 'embed', url: 'https://embed.rgpub.io/x/pt-BR/' },
    { id: 'https://embed.rgpub.io/y/{locale}/', title: 'Hall', kind: 'embed', url: 'https://embed.rgpub.io/y/pt-br/' },
  ]);
});

test('cabeçalho: vídeo, títulos, descrição sem HTML e botões reconhecidos (externo, loja, evento)', () => {
  const page = {
    blades: [
      {
        type: 'leagueClientMastheadContentBlock',
        backdrop: { background: { type: 'video', sources: [{ src: 'https://v/x.webm', type: 'video/webm' }], thumbnail: { url: 'https://i/x.png' } } },
        header: {
          supertitle: 'Modo de jogo',
          title: 'ARAM: Caos',
          subtitle: 'Rumo ao estrelato',
          description: { body: '<p>Uma <b>nova</b> temporada</p>' },
          links: [{ title: 'Assistir', action: { type: 'weblink', payload: { url: 'https://youtube.com/x' } } }, { title: 'Estranho', action: { type: 'algo' } }],
        },
      },
      { type: 'leagueClientTabContent', footerLinks: [{ title: 'Ver trilha', action: { type: 'lc_event_shop' } }] },
    ],
  };
  expect(parsePage(page)).toEqual({
    slides: [],
    masthead: {
      supertitle: 'Modo de jogo',
      title: 'ARAM: Caos',
      subtitle: 'Rumo ao estrelato',
      description: 'Uma nova temporada',
      image: 'https://i/x.png',
      video: 'https://v/x.webm',
      links: [
        { title: 'Assistir', kind: 'web', url: 'https://youtube.com/x' },
        { title: 'Ver trilha', kind: 'events' },
      ],
    },
  });
});
