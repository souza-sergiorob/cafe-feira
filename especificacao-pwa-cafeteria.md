# Café Mobile Feira — Especificação do projeto

> Documento de referência do projeto. Versão inicial: 10/11/2026. Atualizada em 10/11/2026.
> Fica na raiz do repositório (`projeto_Cafe_Mobile_Feira/especificacao-pwa-cafeteria.md`).
> Quando uma regra ou decisão mudar, atualize este arquivo e reenvie ao Contexto do Projeto no Claude.

## 1. Objetivo

Transformar o PWA "Café Mobile", criado para as seis aulas de Desenvolvimento Mobile Híbrido, num **sistema de caixa simples para as vendas da cafeteria em feiras**.

- Roda em **3 celulares e 1 computador** ao mesmo tempo.
- Registra as vendas, soma o total, calcula o troco e registra a forma de pagamento.
- Arquiva todas as vendas num lugar central, para consultar depois **por dia, por produto e por forma de pagamento**.
- Envia por e-mail, duas vezes ao dia, um resumo das vendas como cópia de segurança.
- **Não** se integra a nenhum sistema de pagamento (maquininha, banco ou Pix automático).
- É um sistema **separado** do App Cafeteria em Laravel. No futuro, as vendas podem ser importadas para lá como tipo "Feira".

Princípio do projeto: **manter a simplicidade.** HTML, CSS e JavaScript puro, sem framework, sem etapa de build e sem servidor próprio.

## 2. Ponto de partida (código existente)

Pasta: `___PWA_projeto_cafeteria_Feira/projeto_Cafe_Mobile_Feira`

| Arquivo | O que faz hoje |
|---|---|
| `index.html` | 3 telas (Cardápio, Pedido, Meu Café) com barra de abas embaixo |
| `css/style.css` | Visual mobile-first, paleta de café (`#6f4e37`, `#fff8f0`) |
| `js/dados.js` | Cardápio **fixo e fictício**: 10 produtos, categorias Cafés, Geladas, Salgados e Doces |
| `js/app.js` | Abas, filtro do cardápio, pedido com quantidades, total, `localStorage` (chave `pedido`) e vibração |
| `js/camera.js` | Câmera (getUserMedia) e galeria de fotos no `localStorage` (chave `fotos`) |
| `js/pwa.js` | Registro do service worker, botão Instalar, compartilhar pedido e foto, faixa de offline |
| `sw.js` | Cache `cafe-mobile-v2`, estratégia "rede primeiro" |
| `manifest.json` | Nome "Café Mobile", modo standalone, retrato, ícones 192/512/maskable |

**Limitações para uso real:**
- "Finalizar pedido" só limpa o pedido. **Nenhuma venda é registrada.**
- Os textos falam com o cliente ("Seu pedido", "Meu Café"). O novo usuário é o operador do caixa.
- O cardápio é fictício e só muda editando o código.
- Os dados ficam só no aparelho.
- O `sw.js` não coloca `icon-maskable-512.png` no cache.
- A pasta está ligada ao repositório da aula (`souza-sergiorob/cafe-mobile`). Ver seção 11.

## 3. Usuários e dispositivos

| Caixa | Dispositivo |
|---|---|
| Caixa 1 | Celular 1 |
| Caixa 2 | Celular 2 |
| Caixa 3 | Celular 3 |
| Caixa 4 | Computador (navegador Chrome/Edge, app instalado) |

- Cada caixa tem **chave de acesso própria** e o operador usa um **PIN**.
- O administrador (dono) acessa a planilha pelo Google Drive no computador.

## 4. Funcionalidades

### 4.1 Configuração inicial (uma vez por aparelho)
- Tela "Configurar caixa": número/nome do caixa, chave de acesso, PIN do operador e endereço do Apps Script.
- Fica salva no aparelho. Só se altera com o PIN.

### 4.2 Venda
1. O operador toca nos produtos do cardápio (com filtro por categoria) e ajusta as quantidades.
2. O app mostra o **total**.
3. O operador escolhe a forma de pagamento: **Dinheiro, Pix, Cartão de Crédito ou Cartão de Débito**. O caso normal é uma forma só, que já vem com o valor total.
4. **Pagamento dividido** (raro): um botão "Dividir pagamento" permite somar mais de uma forma, cada uma com o seu valor (ex.: R$ 10,00 em dinheiro + R$ 15,50 no Pix). O app mostra quanto ainda falta e só deixa confirmar quando a soma das parcelas for igual ao total.
5. Se houver parcela em **Dinheiro**: o operador digita o **valor recebido** em dinheiro e o app mostra o **troco** (valor recebido − parcela em dinheiro). Não deixa confirmar se o valor recebido for menor que a parcela.
6. Ao **confirmar**: a venda é gravada no aparelho, entra na fila de envio, o carrinho é limpo e o aparelho vibra.

### 4.3 Sincronização
- Toda venda é gravada **primeiro no aparelho**, com status `pendente`.
- O app envia as pendentes ao Apps Script assim que há internet: ao confirmar a venda, ao voltar a conexão e ao abrir o app.
- Quando o envio é confirmado, o status vira `enviada`.
- Um indicador mostra quantas vendas estão pendentes.
- Cada venda tem um **ID único** (gerado no aparelho), para nunca gravar duas vezes a mesma venda se ela for reenviada.

### 4.4 Vendas do dia no aparelho
- Lista das vendas daquele caixa no dia, com o status de cada uma.
- Totais do caixa no dia: geral e por forma de pagamento (útil para conferir a gaveta de dinheiro).

### 4.5 Cardápio
- O cardápio oficial fica na aba **Cardápio** da planilha.
- O app baixa o cardápio quando tem internet e guarda uma cópia para usar offline.
- O `dados.js` passa a ser só o cardápio de reserva, para o primeiro uso sem internet.
- **Imagem do produto**: a coluna **Imagem** guarda só o nome do arquivo (ex.: `espresso.webp`). O app monta o caminho `img/produtos/<nome>`. Os arquivos ficam no repositório, são publicados com o app e guardados no cache do service worker (decisão D8).
- A ideia é que todo produto tenha imagem, mas a coluna pode ficar vazia numa urgência. Ordem de exibição:
  1. Imagem do produto (`img/produtos/<nome>`).
  2. Se a coluna estiver vazia ou o arquivo não carregar: **imagem padrão** (`img/produtos/padrao.webp`).
  3. Se nem a imagem padrão carregar: o **emoji** do produto.

### 4.6 Computador
- Mesmo app, instalado pelo Chrome/Edge, como Caixa 4.
- Layout responsivo: em tela larga, cardápio e venda ficam lado a lado.
- Uso pelo teclado: digitar o valor recebido e confirmar com Enter.

## 5. Arquitetura

```
Celulares 1-3 / Computador (PWA no GitHub Pages)
   │ 1) grava a venda no aparelho (localStorage)  ── funciona sem internet
   │ 2) envia via fetch POST (JSON)
   ▼
Google Apps Script (aplicativo da Web, na conta do dono)
   ├─ valida a chave, o produto, o preço e o total
   ├─ grava na planilha "Vendas Feira" (abas Vendas e Itens)
   └─ envia resumo por e-mail 2x ao dia (MailApp + acionadores de horário)
```

| Camada | Tecnologia |
|---|---|
| Front-end | HTML, CSS e JavaScript puro (PWA). Manifest e service worker já existentes |
| Hospedagem | GitHub Pages (HTTPS, exigido pelo service worker) |
| Armazenamento local | `localStorage` (vendas, fila de envio, configuração e cópia do cardápio) |
| Banco central | Google Planilhas ("Vendas Feira") |
| API | Google Apps Script implantado como "App da Web" (`doPost` grava a venda, `doGet` devolve o cardápio) |
| E-mail | `MailApp` do Apps Script |

**Por que essa escolha:** não precisa de servidor, banco para instalar nem custo, e a planilha abre no navegador ou é baixada em `.ods` para o LibreOffice. As alternativas foram descartadas: só `localStorage` deixa as vendas espalhadas em 4 aparelhos, e MySQL/PostgreSQL exige hospedagem PHP.

Observação técnica: para evitar bloqueio de CORS, o `fetch` envia o corpo como `text/plain` contendo JSON. O Apps Script lê `e.postData.contents`.

## 6. Modelo de dados

### 6.1 Venda (no aparelho e no envio)
```json
{
  "id": "C1-20261110-153012-a8f3",
  "caixa": "Caixa 1",
  "dataHora": "2026-11-10T15:30:12-03:00",
  "itens": [
    { "produtoId": 1, "nome": "Espresso", "preco": 6.00, "quantidade": 2 }
  ],
  "total": 12.00,
  "pagamentos": [
    { "forma": "Dinheiro", "valor": 12.00 }
  ],
  "valorRecebidoDinheiro": 20.00,
  "troco": 8.00,
  "status": "pendente"
}
```
- `pagamentos` tem uma ou mais parcelas, no máximo uma por forma. `forma` aceita: `Dinheiro`, `Pix`, `Cartão de Crédito` e `Cartão de Débito`.
- `valorRecebidoDinheiro` e `troco` só são preenchidos quando há parcela em Dinheiro. Nos outros casos, ficam `0`.

### 6.2 Planilha "Vendas Feira"

As abas Vendas e Itens são gravadas **só pelo Apps Script** e não devem ser editadas à mão.

**Aba Vendas**: uma linha por venda. As formas de pagamento ficam em colunas, para facilitar as somas por forma (`SOMASES`).

| Data | Hora | ID venda | Caixa | Total | Dinheiro | Pix | Crédito | Débito | Recebido em dinheiro | Troco | Situação | Recebido em |

`Situação`: `OK` ou `CANCELADA`.

**Aba Itens**: uma linha por item vendido.

| Data | Hora | ID venda | Caixa | Produto | Qtd | Preço unit. | Subtotal |

**Aba Cardápio**: editada pelo dono.

| ID | Nome | Descrição | Preço | Categoria | Emoji | Imagem | Ativo (SIM/NÃO) |

`Imagem`: só o nome do arquivo em `img/produtos/` (ex.: `pao-de-queijo.webp`). Deve ser preenchida sempre que possível; vazia, o app mostra a imagem padrão (seção 4.5).

**Aba Resumo do dia**: o dono escolhe uma data e as fórmulas mostram o total geral, os totais por forma de pagamento, por produto e por caixa.

## 7. Regras de negócio

- Uma venda só é confirmada com pelo menos 1 item e uma forma de pagamento escolhida.
- A soma das parcelas de pagamento tem que ser **igual ao total** da venda.
- Troco só existe quando há parcela em **Dinheiro**: `troco = valorRecebidoDinheiro - parcela em dinheiro`, e o valor recebido tem que ser igual ou maior que essa parcela.
- Os valores são arredondados em 2 casas, e os cálculos usam centavos (inteiros) para evitar erro de ponto flutuante.
- O preço gravado é o do cardápio **no momento da venda**.
- O Apps Script ignora uma venda cujo `id` já está na planilha (reenvio seguro).
- O app **não** coleta dados pessoais de clientes (nome, telefone etc.).

## 8. Segurança

1. **Chave por caixa** (a proteção principal): o Apps Script só grava vendas com uma chave válida. As chaves ficam nas **Propriedades do script**, nunca no código ou no GitHub. Se um aparelho for perdido, basta apagar a chave dele.
2. **API só de escrita**: o app envia vendas e baixa o cardápio, mas **nunca lê as vendas** da planilha.
3. **Validação no servidor**: o Apps Script confere se o produto existe, se o preço bate com o cardápio e se o total está certo. Venda inconsistente é recusada.
4. **PIN do operador**: pedido ao abrir o app e depois de um tempo parado. Ele evita uso casual, mas não é proteção forte, porque fica no aparelho. Usar também o bloqueio de tela dos aparelhos.
5. **Planilha privada** na conta Google do dono, com verificação em duas etapas. Compartilhar só com permissão de leitura, se precisar.
6. Implantação do Apps Script: "Executar como: eu" e "Quem pode acessar: qualquer pessoa". O controle é feito pela chave.

## 9. E-mail de segurança

A planilha é o arquivo principal. O e-mail é a segunda cópia e é enviado **duas vezes ao dia**, por acionadores de horário do Apps Script:

| E-mail | Quando | Período coberto |
|---|---|---|
| Resumo 1 | 13:00 | Da abertura até 12:59 |
| Resumo 2 | Fim do dia (horário configurável no script; padrão 20:00) | De 13:00 até o fim do dia |

Conteúdo de cada e-mail:
- Totais do período: geral, por forma de pagamento, por caixa e por produto.
- Número de vendas e de vendas canceladas.
- Anexo CSV com as vendas e os itens do período.
- Se não houver vendas no período (dia sem feira), o e-mail não é enviado.

Observações:
- Com 2 e-mails por dia, o limite do Gmail pelo Apps Script (100 destinatários por dia) não é problema.
- O acionador do Apps Script pode disparar com alguns minutos de atraso. Por isso o período é calculado pelo **horário da venda** (corte fixo às 13:00), e não pela hora em que o e-mail sai.
- Vendas que chegarem à planilha depois do envio do resumo (aparelho que estava sem internet) entram no resumo seguinte, marcadas como "recebidas atrasadas".

## 10. Decisões

### Tomadas (10/11/2026)

| # | Decisão |
|---|---|
| D1 | **Pagamento dividido é permitido**, mas é raro: a tela usa uma forma por padrão e tem o botão "Dividir pagamento" (seções 4.2 e 6.1) |
| D2 | **Na feira há internet**; em último caso, o dono compartilha a internet do celular dele. O registro offline com envio posterior continua como proteção |
| D3 | **Sem e-mail por venda.** Dois resumos por dia: até 13:00 e de 13:00 até o fim do dia (seção 9) |
| D5 | **Câmera e galeria removidas do app de caixa.** O código continua no repositório da aula |
| D8 | **Imagens dos produtos são arquivos no repositório**, em `img/produtos/`, publicadas com o app no GitHub Pages e guardadas no cache do service worker. Todo produto deve ter imagem; sem ela, o app mostra a imagem padrão (`img/produtos/padrao.webp`) e, se essa também falhar, o emoji (seção 4.5) |
| D9 | **Todas as chaves do `localStorage` usam o prefixo `cafeFeira.`** (ex.: `cafeFeira.pedido`), porque o app divide o domínio `souza-sergiorob.github.io` com o app da aula. Pelo mesmo motivo, o `sw.js` só apaga caches cujo nome começa com `cafe-feira-` |

### Pendentes

| # | Pergunta | Proposta enquanto não houver decisão |
|---|---|---|
| D4 | Cancelar ou estornar venda já confirmada? | Cancelar só no mesmo dia, com PIN, gerando um registro de cancelamento (não apagar a linha) |
| D6 | Cardápio real (produtos, preços, categorias) | A ser informado pelo dono. Inclui produtos da Kapeh, com imagem |
| D7 | Horário de encerramento da feira (2º resumo) | 20:00, configurável no script |

## 11. Repositório e publicação

- Criar um **repositório novo** no GitHub (sugestão: `cafe-feira`) para a versão real. **Não** usar o `cafe-mobile`, que é o material das aulas e deve ficar intacto.
- Publicar pelo GitHub Pages do repositório novo.
- Mudar o nome do app no `manifest.json` (ex.: "Café Feira — Caixa") e o nome do cache no `sw.js` (ex.: `cafe-feira-v1`).

### Imagens dos produtos (`img/produtos/`)

- Quadradas, com cerca de **300×300 px**, em **JPG ou WebP**, de até **40 KB**.
- Nome do arquivo em minúsculas, sem acento e sem espaço, usando hífen (ex.: `pao-de-queijo.webp`).
- Incluir ou trocar uma imagem exige **aumentar a versão de `CACHE` no `sw.js`** e fazer push.
- Para cadastrar um produto novo: (1) colocar a imagem em `img/produtos/`; (2) aumentar a versão do `CACHE` e fazer push; (3) incluir a linha na planilha com a coluna Imagem preenchida.
- Exceção (urgência): o produto pode ser cadastrado só pela planilha, com a coluna Imagem vazia. O app mostra a imagem padrão até a imagem real ser publicada.
- A imagem padrão (`padrao.webp`) segue as mesmas regras e fica sempre no cache.

## 12. Roteiro de desenvolvimento (etapas)

Uma etapa por vez, testando antes de seguir para a próxima.

1. **Preparação**: copiar o projeto para o repositório novo, renomear o app e o cache, remover câmera e galeria, corrigir a lista de cache do `sw.js`. Usar o prefixo `cafeFeira.` nas chaves do `localStorage`, apagar no `activate` só os caches que começam com `cafe-feira-` e criar a imagem padrão `img/produtos/padrao.webp` (D9 e D8).
2. **Tela de venda**: textos para o operador, formas de pagamento (com pagamento dividido), valor recebido, troco e confirmação. Os cartões do cardápio mostram a imagem do produto (vinda do `dados.js`), com a imagem padrão e o emoji como reserva.
3. **Registro local**: vendas salvas no aparelho com ID único, tela "Vendas do dia" com totais por forma de pagamento.
4. **Configuração e PIN**: tela de configuração do caixa e bloqueio por PIN.
5. **Planilha + Apps Script**: criar a planilha (abas Vendas, Itens, Cardápio e Resumo do dia), o script (`doPost`/`doGet`), as chaves e a implantação.
6. **Sincronização**: fila de pendentes, reenvio automático, indicador de pendentes, cardápio vindo da planilha (incluindo a coluna Imagem).
7. **E-mail**: os dois resumos diários (13:00 e fim do dia), com acionadores de horário e anexo CSV.
8. **Computador**: layout responsivo e uso pelo teclado.
9. **Teste geral**: 4 aparelhos ao mesmo tempo, modo avião, reenvio, conferência de totais na planilha.
10. **Produção**: cardápio real com as imagens, instalação nos aparelhos, ensaio antes da primeira feira.

## 13. Status

- [ ] Etapa 1 — Preparação
- [ ] Etapa 2 — Tela de venda
- [ ] Etapa 3 — Registro local
- [ ] Etapa 4 — Configuração e PIN
- [ ] Etapa 5 — Planilha + Apps Script
- [ ] Etapa 6 — Sincronização
- [ ] Etapa 7 — E-mail
- [ ] Etapa 8 — Computador
- [ ] Etapa 9 — Teste geral
- [ ] Etapa 10 — Produção
