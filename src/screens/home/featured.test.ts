import { expect, test } from 'vitest';
import { needsSkins, parseGallery, parseNav, parsePage } from './featured';

test('abas: páginas da tela inicial e sites embutidos; sem título fica de fora', () => {
  const nav = {
    data: [
      { title: 'True Damage', action: { type: 'lc_home_tab', payload: { tabId: 'td' } } },
      { title: 'Hall', navigationItemID: 'hall-1', action: { type: 'iframed', payload: { url: 'https://x' } } },
      { title: '', action: { type: 'lc_home_tab', payload: { tabId: 'vazio' } } },
    ],
  };
  expect(parseNav(nav)).toEqual([
    { id: 'td', title: 'True Damage', kind: 'page' },
    { id: 'https://x', title: 'Hall', kind: 'embed', url: 'https://x', frameId: 'hall-1' },
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
    { id: 'https://embed.rgpub.io/x/{LOCALE}/', title: 'Worlds', kind: 'embed', url: 'https://embed.rgpub.io/x/pt-BR/', frameId: 'https://embed.rgpub.io/x/{LOCALE}/' },
    { id: 'https://embed.rgpub.io/y/{locale}/', title: 'Hall', kind: 'embed', url: 'https://embed.rgpub.io/y/pt-br/', frameId: 'https://embed.rgpub.io/y/{locale}/' },
  ]);
});

test('cabeçalho: vídeo, títulos, descrição sem HTML e botões (externo, evento e ação do client que não conhecemos)', () => {
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
          links: [{ title: 'Assistir', action: { type: 'weblink', payload: { url: 'https://youtube.com/x' } } }, { title: 'Estranho', action: { type: 'lc_algo', payload: { itemId: '7' } } }, { title: 'Sem tipo', action: {} }],
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
      logo: null,
      links: [
        { title: 'Assistir', kind: 'web', url: 'https://youtube.com/x' },
        { title: 'Estranho', kind: 'client', type: 'lc_algo', payload: { itemId: '7' } },
        { title: 'Ver trilha', kind: 'events' },
      ],
    },
  });
});

test('cabeçalho de metagame: logo do cabeçalho e botão que abre um site num quadro (só https)', () => {
  const page = {
    blades: [
      {
        type: 'leagueClientMastheadContentBlock',
        backdrop: { background: { type: 'image', url: 'https://i/fundo.png' } },
        header: {
          media: { type: 'image', url: 'https://i/logo.png' },
          subtitle: 'Faça seus palpites',
          links: [
            { title: 'Palpites abertos<br>31 de outubro', action: { type: 'open_iframe', payload: { iframeId: 'palpites_fulano', url: 'https://palpites.exemplo/pt-BR/' } } },
            { title: 'Inseguro', action: { type: 'open_iframe', payload: { url: 'http://palpites.exemplo/' } } },
          ],
        },
      },
    ],
  };
  expect(parsePage(page).masthead).toEqual({
    supertitle: '',
    title: '',
    subtitle: 'Faça seus palpites',
    description: '',
    image: 'https://i/fundo.png',
    video: null,
    logo: 'https://i/logo.png',
    links: [{ title: 'Palpites abertos 31 de outubro', kind: 'iframe', url: 'https://palpites.exemplo/pt-BR/', frameId: 'palpites_fulano' }],
  });
});

test('galeria de skins (template "skin"): sem imagem no CMS, arte e nome vêm do skins.json pelo itemId', () => {
  const paw = (itemId: string) => ({ title: '*Coração Fulano', action: { type: 'lc_store_paw', payload: { inventoryType: 'CHAMPION_SKIN', itemId } } });
  const page = {
    blades: [
      { type: 'mediaGallery', items: [
        { mediaGalleryItemID: 'a', header: { title: '*Coração Fulano', links: [paw('1001')] } },
        { mediaGalleryItemID: 'b', header: { title: '*Coração Zeca', links: [paw('2002')] } },
        { mediaGalleryItemID: 'c', header: { title: 'Sumiu', links: [paw('9999')] } },
      ] },
    ],
  };
  expect(needsSkins(page)).toBe(true);
  expect(needsSkins({ blades: [{ type: 'mediaGallery', items: [{ header: { links: [{ media: { type: 'image', url: '/x.png' } }] } }] }] })).toBe(false);
  // Sem o skins.json ainda: nada a mostrar.
  expect(parsePage(page).slides).toEqual([]);
  const skins = { '1001': { name: 'Fulano Coração de Aço', uncenteredSplashPath: '/s/1001.jpg' }, '2002': { uncenteredSplashPath: '/s/2002.jpg' } };
  expect(parsePage(page, skins).slides).toEqual([
    { id: 'a', title: 'Fulano Coração de Aço', image: '/s/1001.jpg', store: true },
    { id: 'b', title: 'Coração Zeca', image: '/s/2002.jpg', store: true },
  ]);
});
