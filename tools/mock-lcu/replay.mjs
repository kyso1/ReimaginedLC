const PHASE_URI = '/lol-gameflow/v1/gameflow-phase';
const CDN = 'https://raw.communitydragon.org/latest/plugins';

const valid = (line) => line && typeof line === 'object' && typeof line.uri === 'string' && (line.type === 'snapshot' || line.type === 'event');

/** Reproduz uma gravação de sessão: estado para os GETs e a fila de eventos do WebSocket. */
export function createReplay(lines, { idle = false } = {}) {
  const state = new Map();
  const events = [];
  for (const line of lines) {
    if (!valid(line)) continue;
    if (line.type === 'snapshot') state.set(line.uri, { status: Number(line.status) || 200, data: line.data ?? null });
    else events.push(line);
  }
  if (idle) state.set(PHASE_URI, { status: 200, data: 'None' });

  let index = 0;
  let clock = 0;

  return {
    get(uri) {
      return state.get(uri.split('?')[0]) ?? { status: 404, data: { errorCode: 'RESOURCE_NOT_FOUND', httpStatus: 404, message: 'Not found in recording' } };
    },
    next() {
      if (idle || index >= events.length) return null;
      const event = events[index++];
      const t = Number(event.t) || 0;
      const delay = Math.max(0, t - clock);
      clock = Math.max(clock, t);
      const phaseBefore = event.uri === PHASE_URI ? state.get(PHASE_URI)?.data : null;
      if (event.eventType === 'Delete') state.delete(event.uri);
      else state.set(event.uri, { status: 200, data: event.data ?? null });
      let enteredPhase = null;
      if (event.uri === PHASE_URI && event.data !== phaseBefore) enteredPhase = event.data;
      return { delay, message: JSON.stringify([8, 'OnJsonApiEvent', { uri: event.uri, eventType: event.eventType, data: event.data ?? null }]), enteredPhase };
    },
    phase() {
      return state.get(PHASE_URI)?.data ?? null;
    },
  };
}

/** Assets do client não existem fora dele; a LCU simulada redireciona para a CDN do CommunityDragon. */
export function assetRedirect(path) {
  const clean = path.split('?')[0];
  if (clean.includes('..') || !/^[\w./-]+$/.test(clean)) return null;
  const gameData = /^\/lol-game-data\/assets\/(.+)$/.exec(clean);
  if (gameData) return `${CDN}/rcp-be-lol-game-data/global/default/${gameData[1].toLowerCase()}`;
  const fe = /^\/fe\/([\w-]+)\/(.+)$/.exec(clean);
  if (fe) return `${CDN}/rcp-fe-${fe[1]}/global/default/${fe[2].toLowerCase()}`;
  return null;
}
