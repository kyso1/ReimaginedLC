import { afterEach, expect, test } from 'vitest';
import { dodgeAvailable } from '../plugins/dodge';
import { endpointName, endpoints, loadEndpoints, supports } from './capabilities';

afterEach(() => void (endpoints.value = null));

test('endpointName segue o nome das funções do /help', () => {
  expect(endpointName('POST', '/lol-yourshop/v1/offers/{id}/reveal')).toBe('PostLolYourshopV1OffersByIdReveal');
  expect(endpointName('PUT', '/lol-cosmetics/v1/favorites/tft/{cosmeticType}/{contentId}')).toBe('PutLolCosmeticsV1FavoritesTftByCosmeticTypeByContentId');
  expect(endpointName('GET', '/lol-champ-select/v1/session?x=1')).toBe('GetLolChampSelectV1Session');
});

test('sem lista tudo conta como presente; com lista, só o que o client tem (dodge some sem o invoke)', async () => {
  expect(supports('POST', '/qualquer/coisa')).toBe(true);
  expect(dodgeAvailable()).toBe(true);
  await loadEndpoints(async () => new Response(JSON.stringify({ functions: { PostLolTftTrovesV1Roll: '', GetLolChampSelectV1Session: '' } }), { status: 200 }));
  expect(supports('POST', '/lol-tft-troves/v1/roll')).toBe(true);
  expect(supports('POST', '/lol-tft-troves/v2/roll')).toBe(false);
  expect(dodgeAvailable()).toBe(false);
});
