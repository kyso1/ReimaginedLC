# Relatório dos subprojetos 3 a 6: social, perfil, coleção, configurações e TFT

Client em lobby de TFT ranqueado (fila 1100), Pengu Loader 1.1.6, 2026-10-05. Spec: `docs/superpowers/specs/2026-10-05-subprojetos-3-a-6-design.md`.

## Dados reais da LCU

| Rota | Formato e observações |
|---|---|
| `/lol-cosmetics/v1/inventories/tft/{companions,map-skins,damage-skins,zoom-skins,playbooks,augment-pillars}` | `{ groups: [{ groupName, items: [{ itemId, name, owned, selected, favorited, loadoutsIcon }] }], selectedLoadoutItem }`. Inclui itens que o jogador não tem (`owned: false`). Pequenas Lendas vêm em 138 grupos (espécies). `augment-pillars` veio com `groups` vazio nesta conta. |
| `/lol-cosmetics/v1/favorites/tft/{companions,map-skins,damage-skins,zoom-skins}` | `{ favoriteItems: [...] }`. O `favorited` do inventário vem sempre `false`; os favoritos só aparecem aqui. Manual e Pilar não têm rota de favoritos. |
| `PUT /lol-cosmetics/v1/selection/{companion,tft-map-skin,tft-damage-skin,tft-zoom-skin,playbook,tft-augment-pillar}` | Corpo: o `itemId` puro. Respondeu 201 (testado reequipando a Pequena Lenda atual). |
| Lobby de TFT | `members[].memberData['TFT.Tactician']` traz o `contentId` da Pequena Lenda; `/lol-game-data/assets/v1/companions.json` liga o `contentId` ao `loadoutsIcon` (arte paisagem, 512 px). |
| `/lol-game-settings/v1/game-settings-schema` | Categorias (Floating Text, General, HUD, Loss Of Control, Performance, Voice, Volume) com `{ default }` por campo; 94 campos booleanos ou numéricos. `PATCH /lol-game-settings/v1/game-settings` seguido de `POST /lol-game-settings/v1/save` grava (testado alternando e desfazendo `ShowCursorLocator`). |
| `/lol-champions/v1/inventories/{id}/champions-minimal` | Traz variantes de modo com o mesmo nome e id alto (`60103 Jade_Ahri`), todas com `isVisibleInClient: true`. |
| `/lol-loot/v1/player-loot` | A Essência Mítica é `CURRENCY` com categoria `CHEST`; há uma entrada sem `lootId` (contagem 5). O menu de contexto manda `recipeContextMenuAction` vazio, com `essenceQuantity` e `essenceType`. |
| `/lol-chat/v1/conversations/{id}/messages` | Ordem cronológica, cobrindo semanas; mensagens `system` com corpo `joined_room`. |
| Emblema ranqueado | `/fe/lol-static-assets/images/ranked-emblem/emblem-{tier}.png` carrega; a imagem é 2560×1440 com o brasão no centro. |

## Verificação no client

Feita com um plugin de diagnóstico descartável, já removido. A camada foi desligada ao fim e a configuração do usuário restaurada.

- **Lobby de TFT**: a coluna mostra a Pequena Lenda equipada; Personalizar abre a gaveta. Favoritos (15) vêm primeiro, depois os grupos da LCU.
- **Configurações**:
  - Temas de LoL e TFT aparecem em grupos separados.
  - A aba Jogo gera o formulário a partir do esquema.
  - No editor, mudar a cor de destaque atualiza a prévia ao vivo.
  - O fundo personalizado funciona: escolhida uma splash da Ahri, o escurecer foi aplicado no lobby e a configuração foi gravada.
- **Perfil**: vitrine, histórico, zoom da partida (placar com itens) e ranqueadas com emblema.
- **Coleção**: campeões, runas e espólio.
- **Coluna da direita**: amigos agrupados por estado; abrir um amigo abre a conversa.

### Problemas achados e corrigidos (com teste)

- Coleção: campeões duplicados pelas variantes de modo. Agora só entram ids abaixo de 10000.
- Espólio:
  - Abria no grupo Baús, vazio, mesmo havendo itens em outros grupos. Agora cai no primeiro grupo com itens.
  - O item sem `lootId` não entra mais.
  - Os botões mostravam `REROLL` e `DISENCHANT`. Agora têm rótulo próprio com a essência, por exemplo "Desencantar (+104 EL)".
- Chat:
  - Mensagens de outros dias mostravam só a hora, parecendo fora de ordem. Agora levam dia e mês.
  - `joined_room` e `left_room` ficam escondidas.

### Ajustes visuais (sem teste, conferidos por captura de tela)

- Runas: a linha das árvores agora cabe as cinco.
- Placar: colunas alinhadas entre os dois times. O `display:flex` no `<td>` quebrava a tabela.
- Emblema ranqueado: ampliado e recortado.
- Pequena Lenda: arte sobre uma cópia desfocada.
- Painel da coluna direita: agora opaco.
- Aba Jogo: o `<details>` como grid não funciona no Chromium 108; os campos agora ficam num `div` com grid.
- Barras de rolagem e `accent-color` passam a seguir o tema.

## Não verificado no client

- **Exigem outro jogador ou gastariam recursos da conta**:
  - aceitar pedido de amizade;
  - criar com espólio (cada ação pede confirmação).
- **Seleção de campeões clássica**: exigiria sair do lobby de TFT do dono para abrir uma sala.
- **Ações de escrita não exercitadas**:
  - tela inteira de Ícones (equipar);
  - salvar e apagar tema do usuário;
  - arquivo de fundo próprio (IndexedDB).
- **Sem mudança visível a conferir**: transições reduzidas ou desligadas.
- **Animação do banner ao entrar na sala**: a correção (decodificar antes de mostrar) segue sem medição no client.
