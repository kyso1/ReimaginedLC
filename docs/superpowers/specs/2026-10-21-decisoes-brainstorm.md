# Decisões do brainstorm de 2026-10-21

O usuário pediu para pular spec e plano: esta nota só registra o que foi escolhido, para quem implementa. Os protótipos estão em `.superpowers/brainstorm/691-1792632302/content/` (abrir o HTML no navegador mostra a interação). O inventário do client oficial está em `docs/auditoria/2026-10-21-client-oficial.md`.

## Regras comuns
- Visual: vidro escuro (`linear-gradient` escuro translúcido + `backdrop-filter: blur(...) brightness(...)`), Quicksand, cantos médios, tokens `--rlc-*`. Cor literal só como reserva de `var(--rlc-*, reserva)`. Sem `:has()` (Chromium 108). CSS de cada tela no seu arquivo em `src/ui/css/<tela>.css` (já importado por `styles.css`).
- Textos sempre em `src/i18n/pt-BR.json` e `en-US.json` (mesmas chaves). Nunca mostrar id ou nome técnico (`CHAMPION_RENTAL_266`, `kSummonersRift`, `CLASSIC`, `**Default`, chave de esquema): traduzir, usar o nome localizado da LCU ou esconder.
- Dados da LCU por `request`/`getJson`; ação que gasta recurso pede confirmação explícita com custo e saldo (craft, reroll, Santuário e Loja Mítica compram pela LCU; loja de RP abre a página da Riot).
- Teste com Vitest junto do código (padrão dos `*.test.tsx` existentes). `npx tsc --noEmit` e `npx vitest run` verdes.
- Preferências novas já existem em `src/shell/prefs.ts`: `ambient`, `ambientVolume`, `clicks`, `clickVolume`, `readyCheckAnim`, `lobbyAnim`, `runesAuto`, `runesMatchup`, `runesApplyOnLock`, `allSplashes`.

## Escolhas
| Área | Escolha | Protótipo |
|---|---|---|
| Partida encontrada | B · Cortina de vidro (placas se fecham, emblema do modo acende, tempo em barra, 10 pontos acendem ao aceitar) | `aceite-v2.html` |
| Entrada no lobby | A+C · colunas sobem uma a uma saindo do desfoque; barra por último | `combinado-chat-v2.html` (topo) |
| Escolha de modo | B+C · realce de vidro desliza até o cartão; emblema se redesenha com luz; filas centralizadas | `combinado-chat-v2.html` (topo) |
| Chat | C · amigos em gaveta à direita (some 1,2 s após sair o mouse); chat sobe do canto inferior direito com conversas recentes à esquerda e a conversa à direita; botão de chat no pé da faixa abre à mão | `combinado-chat-v2.html` |
| Coleção | A · Vitrine (grade densa de retratos, nome centralizado com degradê no pé, selo de maestria no topo, detalhe em gaveta de vidro à direita) com barra lateral B · Splash do favorito (arte do campeão de maior maestria, 4 blocos de totais, categorias em seções Campeões/Cosméticos/Jogo com realce deslizante) | `colecao-a3.html` (Barra 2) |
| Perfil | A · Janela de identidade (prévia à esquerda, abas Ícones, Bordas, Títulos, Estandartes, Fundo), com busca em cada aba; Fundo lista todas as splashes quando `allSplashes` | `perfil-v2.html` (A) |
| Loja | Destaques = A · Vitrine editorial (banner grande + prateleiras); Campeões, Skins, Acessórios = B · Catálogo com filtros à esquerda; detalhe em gaveta lateral com Comprar e Presentear; carteira (EA, RP) no topo | `loja.html` |
| Menu | Início, Perfil, Coleção (inclui Espólios: Criação, Santuário, Loja Mítica), Eventos (novo: passe LoL, eventos de modo, passe TFT, Reinos dos Tesouros, Clash), Loja (inclui Sua Loja), Configurações | `passes.html` (1) |
| Passes | A · Trilha horizontal (arte ao fundo, recompensa escolhida grande à esquerda, níveis com fila grátis e premium dourada, barra de XP, Resgatar) | `passes.html` (2) |
| Configurações | C · Painéis (um por área com resumo do estado; clique abre a área); áreas: Aparência, Animações, Som, Plugins, Geral, Notificações, Chat e amigos, Jogo, Atalhos; busca | `config.html` (C) |
| Runas | Editor no padrão do editor oficial (nome + Salvar/Nova/Excluir no topo; principal com trilha vertical e pedras-chave; secundária com 2 escolhas + 3 linhas de fragmentos; arte ao fundo; nome e descrição curta ao lado de cada escolha; balão com descrição completa; "Mostrar descrições detalhadas"). Painel "Recomendadas" (OP.GG) com rota e "Contra" só com inimigos já escolhidos (+ Geral); Aplicar runas e feitiços | `runas-v4.html` |
| Som | 1 · sons do próprio client (música ambiente das telas e cliques da Riot) | — |

## Fonte das recomendações
`https://lol-api-champion.op.gg/api/{REGIAO}/champions/ranked/{championId}/{POSICAO}` (POSICAO: TOP, JUNGLE, MID, ADC, SUPPORT), com `?target_champion={id}` para a matchup. Campos: `data.rune_pages[].builds[]` (primary_page_id, primary_rune_ids, secondary_page_id, secondary_rune_ids, stat_mod_ids, play, win, pick_rate), `data.summoner_spells[]` (ids, win, play, pick_rate). Endpoint não documentado: falha vira estado "sem recomendações", nunca erro de tela.
