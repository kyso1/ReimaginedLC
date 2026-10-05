# Subprojeto 2b: seleção de campeões, partida, honra e pós-jogo

Data: 2026-10-05
Status: aguardando revisão
Spec geral: `2026-10-03-reimaginedlc-design.md`. Antecessor: `2026-10-05-fluxo-2a-design.md` e `docs/fluxo-2a/REPORT.md`.

## Objetivo

Com a camada ligada, todas as fases do gameflow têm tela nossa: seleção de campeões no layout Cinemático, tela de partida, votação de honra e pós-jogo. Com o 2a, a pessoa joga uma partida inteira sem ver a interface da Riot, que é o critério de sucesso da spec geral.

O client original só aparece em três casos: pelo atalho ou pelo item "Client original" do trilho; quando uma tela nossa lança exceção (proteção de "client sempre utilizável"); e em `ChampSelect` quando o store da sessão de seleção está indisponível.

## Dados reais

O 2a mostrou que a API real diverge dos tipos gerados (ver `docs/fluxo-2a/REPORT.md`). Neste subprojeto:

- A seleção de campeões é gravada e verificada no client pelo executor, numa sala personalizada (modo com banimentos, contra bots) levada até a seleção e cancelada no fim.
- Partida, honra e pós-jogo são escritos a partir dos tipos gerados, porque não há gravação deles. Ficam marcados como não verificados no relatório até o dono jogar uma partida normal completa com o gravador do subprojeto 0 ligado (`npm run dump:record`), quando são verificados e corrigidos.

## Escolhas visuais

Prévias em `docs/mockups/2b-selecao-detalhes.html` e `docs/mockups/2b-pos-jogo.html`.

| Peça | Escolha |
|---|---|
| Seleção | Cinemático (spec geral) com gaveta em abas: Campeões, Skins, Runas e feitiços |
| Pós-jogo | Destaque seu: sua partida sobre a splash do seu campeão, placar completo numa gaveta |

## Rotas

| Fase | Tela |
|---|---|
| `None` | tela inicial |
| `TerminatedInError` | tela inicial, com `Toast` de partida encerrada com erro |
| `Lobby`, `Matchmaking`, `ReadyCheck` | lobby (2a) |
| `ChampSelect` | seleção; client original se o store da sessão estiver `unavailable` |
| `GameStart`, `InProgress`, `Reconnect`, `WaitingForStats` | partida |
| `PreEndOfGame` | honra |
| `EndOfGame` | pós-jogo |
| qualquer outra | fase desconhecida: nome da fase e botão "Client original" |

O trilho continua indicando onde se está (Início, Lobby quando existe lobby, e o item da tela atual quando for uma das novas).

## Dados

### Stores novos

| Store | Endpoint |
|---|---|
| `champSelect` | `/lol-champ-select/v1/session` |
| `skins` | `/lol-champ-select/v1/skin-carousel-skins` |
| `pickable` | `/lol-champ-select/v1/pickable-champion-ids` |
| `bannable` | `/lol-champ-select/v1/bannable-champion-ids` |
| `perkPages` | `/lol-perks/v1/pages` |
| `currentPerkPage` | `/lol-perks/v1/currentpage` |
| `gameflowSession` | `/lol-gameflow/v1/session` |
| `honorBallot` | `/lol-honor-v2/v1/ballot` |
| `endOfGame` | `/lol-end-of-game/v1/eog-stats-block` |

### Dados estáticos

Em `src/data/gamedata.ts`, lidos uma vez e com cache em memória:

- `/lol-game-data/assets/v1/champion-summary.json`: nome e ícone (`squarePortraitPath`) por id. Já usado pelo 2a para nomes de bots, que passa a usar este módulo.
- `/lol-game-data/assets/v1/summoner-spells.json`: nome, ícone e modos de cada feitiço.
- Splash por skin: o `createSplashes` do 2a (`champions/{id}.json`, `skins[].splashPath`), movido para este módulo.

Falha ao carregar: ícone genérico do tema e o id no lugar do nome.

### Ações

| Ação | Endpoint |
|---|---|
| Destacar ou banir campeão | `PATCH /lol-champ-select/v1/session/actions/{id}` com `{ championId }` |
| Confirmar | `POST /lol-champ-select/v1/session/actions/{id}/complete` |
| Skin, croma e feitiços | `PATCH /lol-champ-select/v1/session/my-selection` com `selectedSkinId`, `spell1Id`, `spell2Id` |
| Página de runas | `PUT /lol-perks/v1/currentpage` com o id da página |
| Troca de campeão, ordem ou posição | `POST /lol-champ-select/v1/session/{champion-swaps,pick-order-swaps,position-swaps}/{id}/{request,accept,decline,cancel}` |
| Banco do ARAM | `POST /lol-champ-select/v1/session/bench/swap/{championId}` |
| Rolagem do ARAM | `POST /lol-champ-select/v1/session/my-selection/reroll` |
| Reconectar | `POST /lol-gameflow/v1/reconnect` |
| Honrar | `POST /lol-honor-v2/v1/honor-player` |
| Jogar de novo | `POST /lol-lobby/v2/play-again` |

Os corpos exatos e os ids são confirmados na gravação; o plano registra o que a gravação mostrar.

## Telas

### Seleção Cinemática

- Topo: duas faixas de 5 jogadores. Cada um mostra o ícone do campeão escolhido ou destacado (mais apagado se destacado), o nome (resolvido pelo puuid quando vier vazio, como no 2a), os feitiços e a posição. Quem está na vez tem borda de destaque. Banimentos em fila sob a faixa do time que baniu.
- Centro do topo: tempo restante e a fase em texto ("Banir", "Sua vez de escolher", "Aguardando", "Finalização").
- Fundo: splash do campeão destacado ou escolhido, ou da skin escolhida; sem campeão, o fundo do tema.
- Gaveta inferior com abas:
  - Campeões: grade com busca por nome e filtro por posição; só campeões permitidos na ação atual (`pickable` ou `bannable`). Clique destaca. Botão principal "Confirmar" na vez de escolher e "Banir" na vez de banir.
  - Skins: carrossel das skins do campeão escolhido que o jogador possui; cromas da skin selecionada embaixo. Clique aplica.
  - Runas e feitiços: dois feitiços, cada um abre a lista dos disponíveis no modo; lista das páginas de runas com a atual marcada; clique troca.
  - A aba muda sozinha conforme a fase (Campeões na vez de banir ou escolher; Skins depois de confirmar) e pode ser trocada à mão.
- Trocas: pedido recebido vira cartão à direita com Aceitar e Recusar. Para pedir, o ⋯ na faixa de um aliado oferece apenas as trocas que a LCU indica como possíveis. Pedido enviado aparece como "aguardando" com Cancelar.
- ARAM: banco como linha de ícones acima da gaveta; clique troca. Botão de rolagem com o número de rolagens restantes.

### Partida

Fundo com a splash do seu campeão. Texto "Partida em andamento", mapa e fila, e tempo desde o início. Em `Reconnect`, botão Reconectar. Em `WaitingForStats`, "Carregando resultados". Em `GameStart`, "Abrindo a partida".

### Honra

Cartões dos aliados elegíveis com splash do campeão e nome. Clique honra; "Pular" encerra a votação. A LCU avança a fase sozinha após o voto ou o tempo.

### Pós-jogo

- Resultado grande ("Vitória", "Derrota"), campeão, fila e duração.
- KDA, farm, dano causado, ouro; PdL em ranqueada quando a LCU informar.
- Barra de dano comparando você com o maior dano da partida.
- "Ver placar completo" abre uma gaveta com os dois times: campeão, nome, KDA, itens.
- "Jogar de novo" (`play-again`) volta ao lobby; "Sair" vai para a tela inicial.
- Fundo: splash do seu campeão.

### Fase desconhecida

Nome da fase e botão "Client original".

### Estrutura

- `src/data/gamedata.ts`: campeões, feitiços, splashes.
- `src/screens/champselect/`: tela, faixas, gaveta e abas, trocas, e a lógica pura (fase, ação atual, minha vez, banimentos por time, tempo restante).
- `src/screens/ingame/`, `src/screens/honor/`, `src/screens/postgame/`, `src/screens/unknown/`.

## Tratamento de erros

| Situação | Comportamento |
|---|---|
| Exceção na seleção de campeões | A camada se desliga na hora e a seleção da Riot aparece |
| Exceção nas outras telas | Boundary existente: camada desligada, `Toast` |
| Ação da seleção com erro | `Toast` com a mensagem da LCU, estado inalterado |
| Store `champSelect` indisponível | `ChampSelect` com o client original |
| Dados estáticos não carregam | Ícone genérico e id no lugar do nome |
| Tempo da seleção | Contado localmente a partir do último valor da LCU, nunca negativo |

Texto externo sempre como texto. Componentes só com variáveis do tema (regra fixada por teste no 2a).

## Testes

- Lógica pura da seleção: fase atual, ação do jogador local, se é a vez dele, campeões permitidos, banimentos por time, tempo restante.
- Uma família de testes por tela com fixtures: banir, destacar e confirmar, skins e cromas, feitiços, runas, trocas recebidas e enviadas, banco e rolagem do ARAM, partida e reconexão, honra, pós-jogo (vitória, derrota, ranqueada).
- Fallback: exceção na seleção desliga a camada.
- Fixtures da seleção derivadas da gravação nova (anonimizada); as demais derivadas dos tipos.

## Verificação no client

Pelo executor:

1. Gravar uma seleção numa sala personalizada com banimentos, contra bots, e salvar a gravação anonimizada em `docs/dump/sessions/`.
2. No client: banir, destacar e confirmar, skin e croma, feitiços, página de runas; a camada volta ao cancelar a seleção.
3. Fase desconhecida não verificável sem forçar estado; coberta por teste.

Pelo dono, numa partida normal com o gravador ligado: trocas reais, partida, reconexão (se houver), honra e pós-jogo. Depois dessa partida, o executor corrige o que a gravação mostrar e só então a camada passa a vir ligada por padrão.

## Execução

Implementação direta na sessão principal, branch `fluxo-2b`, commit por tarefa. Uma revisão do branch inteiro por um subagente ao final, de 100 a 200 mil tokens. Correções apenas das conclusões aceitas.

## Fora de escopo

- Chat da seleção (subprojeto 4).
- Edição de runas (subprojeto 3).
- Estatísticas de meta e sugestões (subprojeto 8).
- Camada ligada por padrão antes da partida de verificação do dono.
