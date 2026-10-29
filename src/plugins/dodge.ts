import { supports } from '../lcu/capabilities';
import { request } from '../lcu/request';

/**
 * Dodge sem fechar o client: pede ao servidor o mesmo `quitV2` do teambuilder que o client manda ao fechar no meio da
 * seleção. Não é atalho de penalidade: o servidor aplica o dodge igual (tempo de espera e, na ranqueada, PdL).
 */
export const DODGE_PATH = `/lol-login/v1/session/invoke?destination=lcdsServiceProxy&method=call&args=${encodeURIComponent(JSON.stringify(['', 'teambuilder-draft', 'quitV2', '']))}`;

export const dodge = () => request('POST', DODGE_PATH);

/**
 * O client 16.21 tirou o `/lol-login/v1/session/invoke`: sem ele não há como sair da seleção sem fechar o client, então
 * o botão some (e a opção avisa) em vez de falhar no meio da seleção. Volta sozinho se a Riot devolver o endpoint.
 * Testado numa fila normal em 2026-10-29: `/lol-lobby-team-builder/champ-select/v1/session/quit` responde 400
 * ("Current champ select does not allow quitting"), `/lol-login/v1/service-proxy-async-requests/teambuilder-draft/quitV2`
 * responde 204 sem sair, e `/lol-gameflow/v1/session/dodge` só muda o estado local do gameflow.
 */
export const dodgeAvailable = () => supports('POST', '/lol-login/v1/session/invoke');
