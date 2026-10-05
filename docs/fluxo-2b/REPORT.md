# Relatório do subprojeto 2b: seleção, partida, honra e pós-jogo

Client 16.19.823.0722, Pengu Loader 1.1.6, 2026-10-05.

## Gravação

`docs/dump/sessions/selecao-personalizada.jsonl`: 381 linhas, 1,2 MB, anonimizada. Sala personalizada na fila 3130 ("SR Tournament Draft", mutador `TournamentPickStrategy`), com um bot no time inimigo. A fila aceitou bot e começou com um só humano. Fases vistas: `Lobby`, `Matchmaking`, `ReadyCheck`, `ChampSelect`, `None` (a sala também passa por `Matchmaking` e `ReadyCheck` no mesmo instante, como a Ferramenta de Treino). Ações feitas: banir, destacar, confirmar, skin, feitiços, página de runas; a fase `FINALIZATION` foi alcançada; a seleção foi cancelada com `POST /lol-lobby/v1/lobby/custom/cancel-champ-select`, que leva a `None` e desfaz o lobby.

O gravador passou a ignorar `/lol-challenges`, `/lol-missions` e `/lol-objectives` (3,3 MB de ruído nesta gravação) e URIs que chegam sem a barra inicial.

### Formato real da sessão (`/lol-champ-select/v1/session`)

- `actions` é uma lista de listas (um grupo por turno). Cada ação: `id`, `actorCellId`, `championId`, `completed`, `isInProgress`, `isAllyAction`, `pickTurn`, `duration`, `type` (`ban`, `pick` e `phase_transition`, este com `actorCellId` -1).
- Banimento que expira sem escolha fica `completed: true` com `championId` -1.
- `bans` vem `{ myTeamBans: [], theirTeamBans: [], numBans: 0 }` mesmo com banimentos feitos no Tournament Draft: os banimentos precisam ser lidos das ações `ban` concluídas.
- `myTeam` e `theirTeam`: `cellId`, `puuid`, `gameName`, `tagLine`, `team` (1 ou 2), `assignedPosition` em minúsculas (`top`), `championId`, `championPickIntent`, `selectedSkinId`, `spell1Id`, `spell2Id`, `nameVisibilityType`, `playerAlias`. Aqui `gameName` vem preenchido (ao contrário do lobby).
- `timer`: `phase` (`BAN_PICK`, `FINALIZATION`), `adjustedTimeLeftInPhase` e `totalTimeInPhase` em milissegundos, `internalNowInEpochMs`, `isInfinite`.
- Trocas: os campos da sessão são `trades`, `pickOrderSwaps` e `positionSwaps` (listas vazias nesta gravação), embora as rotas de ação se chamem `champion-swaps`, `pick-order-swaps` e `position-swaps`.
- Outros campos úteis: `localPlayerCellId`, `benchEnabled`, `benchChampions`, `allowRerolling`, `rerollsRemaining`, `allowSkinSelection`, `hasSimultaneousBans`, `hasSimultaneousPicks`, `isCustomGame`, `queueId`.

### Ações

| Ação | Resultado |
|---|---|
| `PATCH /lol-champ-select/v1/session/actions/{id}` com `{ championId }` | 204; o campeão vira intenção (`championPickIntent`) e o `championId` da ação |
| `POST /lol-champ-select/v1/session/actions/{id}/complete` | 204, mas **não conclui** a ação: ela segue em andamento até o tempo acabar |
| `PATCH .../actions/{id}` com `{ championId, completed: true }` | 204; conclui (banir ou confirmar) |
| `PATCH /lol-champ-select/v1/session/my-selection` com `{ selectedSkinId }` ou `{ spell1Id, spell2Id }` | 204 |
| `PUT /lol-perks/v1/currentpage` com o id da página como corpo (número puro) | 201 |

### Skins (`/lol-champ-select/v1/skin-carousel-skins`)

Lista de skins do campeão escolhido, cada uma com `id`, `name`, `unlocked`, `ownership`, `disabled`, `isBase`, `splashPath`, `tilePath`, `childSkins` (cromas, com `unlocked`, `colors`, `parentSkinId`, `chromaPreviewPath`). Nesta conta, só a skin base estava desbloqueada para o campeão usado, então troca de skin e croma não foram exercitadas.

### Não coberto pela gravação

Trocas reais (sem outro humano), banco e rolagem do ARAM, skins além da base, partida, honra e pós-jogo.

## Verificação no client

Conduzida por dentro do client com o plugin de diagnóstico descartável e a ponte local do 2a, numa sala Tournament Draft (3130) com um bot. Client em `en_US`, então os textos apareceram em inglês. Plugin e ponte removidos ao fim; camada desligada; sem lobby.

| # | Item | Resultado | Observação |
|---|---|---|---|
| 1 | Seleção aparece com a camada ligada e a Riot escondida | ok | Faixas, tempo, fase, gaveta com abas. |
| 2 | Banir pela grade e pelo botão Ban | ok | Banimento concluído (`PATCH` com `completed: true`) e mostrado sob o nosso time. |
| 3 | Destacar e confirmar | ok | Splash da Ahri em tela cheia ao destacar; confirmação aceita pela LCU. |
| 4 | Aba muda sozinha | ok | Depois de confirmar, a aba ficou em Campeões porque o próximo banimento do jogador já estava em andamento (correto); a troca para Skins depois de confirmar está coberta por teste. |
| 5 | Skins | ok, parcial | A conta só tem a skin base do campeão usado; a lista mostrou a base marcada. Troca de skin e cromas cobertas por teste. |
| 6 | Feitiços | ok | Flash trocado por Ghost pelo slot 1. |
| 7 | Página de runas | ok | Troca e volta à página original. |
| 8 | Cancelar a seleção | ok | Fase `None`, camada de volta na tela inicial. |

Defeito encontrado e corrigido: a grade de campeões saía achatada (o `aspect-ratio` dos itens não segurava a altura dentro da grade no Chromium 108); itens com tamanho fixo. Vaga do time limitada a um quinto da faixa.

## Não verificado

Precisam de uma partida real com outras pessoas:

- trocas de campeão, ordem e posição;
- banco e rolagem do ARAM;
- telas de partida (início, em andamento, reconexão, carregando resultados);
- honra (corpo `{ recipientPuuid, honorType: 'HEART' }` e o efeito de Pular são suposições);
- pós-jogo (campos de `eog-stats-block`, `dismiss-stats` e `play-again-decline`);
- PdL e itens no placar, deixados de fora até a gravação mostrar os campos.

## Roteiro da partida do dono

1. Client aberto, camada desligada (Ctrl+Shift+F12 se estiver ligada).
2. No repositório: `npm run dump:record -- partida-normal` e deixar rodando.
3. Jogar uma partida normal com escolha alternada (com banimentos), do lobby até o pós-jogo, votando na honra.
4. Ao voltar à tela inicial, encerrar o gravador com Ctrl+C.
5. Avisar o executor, que roda `npm run dump:anonymize -- partida-normal`, confere a gravação, corrige o que divergir e então liga a camada por padrão.

Ponto menor visto: com cinco jogadores por time, a vaga fica estreita e nomes longos são cortados.
