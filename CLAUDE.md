# CLAUDE.md — Café Mobile Feira

Instruções para o Claude Code neste repositório. A especificação completa está em `especificacao-pwa-cafeteria.md` (na raiz deste repositório).

## O que é
PWA de caixa para vendas da cafeteria em feiras (3 celulares + 1 computador). Registra vendas, total, troco e forma de pagamento (Dinheiro, Pix, Cartão de Crédito, Cartão de Débito; raramente dividido entre duas formas), grava primeiro no aparelho e envia para o Google Apps Script, que grava no Google Planilhas e manda dois resumos por e-mail ao dia (13:00 e fim do dia).

## Stack e estrutura
- HTML, CSS e JavaScript **puro**. Sem framework, sem npm/build e sem TypeScript.
- Scripts carregados por `<script>` no `index.html`, na ordem: `dados.js`, `app.js`, `pwa.js` (+ novos arquivos, se criados).
- `localStorage` para vendas, fila de envio, configuração e cópia do cardápio. Salvar sempre com `JSON.stringify` e ler com `JSON.parse`.
- `sw.js`: estratégia "rede primeiro". Pedidos que não são GET (POST ao Apps Script) **não** passam pelo cache.
- Hospedagem: GitHub Pages.

## Regras
- **Simplicidade acima de tudo.** Não adicionar bibliotecas, dependências ou ferramentas sem pedido explícito.
- Manter o estilo atual: funções nomeadas em português, comentários explicativos em português e mobile-first.
- **Sempre que mudar a lista de arquivos ou o conteúdo de arquivos em cache, aumentar a versão de `CACHE` no `sw.js`.**
- Chaves do `localStorage` sempre com o prefixo `cafeFeira.` (ex.: `cafeFeira.pedido`): o domínio `souza-sergiorob.github.io` é dividido com o app da aula.
- No `activate` do `sw.js`, apagar só os caches cujo nome começa com `cafe-feira-`.
- Imagens de produtos ficam em `img/produtos/` (coluna Imagem = só o nome do arquivo). Ao incluir ou trocar uma imagem, aumentar a versão de `CACHE` no `sw.js`. Ordem de exibição: imagem do produto → imagem padrão `img/produtos/padrao.webp` → emoji.
- Valores em dinheiro: calcular em centavos (inteiros) e formatar com `toLocaleString("pt-BR", { style: "currency", currency: "BRL" })`.
- Cada venda tem `id` único gerado no aparelho e `status` `pendente` ou `enviada`.
- Pagamento: lista `pagamentos` de parcelas `{ forma, valor }` (no máximo uma por forma), cuja soma tem que ser igual ao total. Troco só sobre a parcela em Dinheiro.
- Envio ao Apps Script: `fetch(url, { method: "POST", body: JSON.stringify(dados), headers: { "Content-Type": "text/plain;charset=utf-8" } })` (evita preflight de CORS).
- **Nunca** colocar no código: chave de acesso, PIN ou URL do Apps Script. Esses valores vêm da tela de configuração e ficam no `localStorage`.
- Não coletar dados pessoais de clientes.
- Código do Apps Script fica em `apps-script/Codigo.gs` (só como cópia versionada; é colado no editor do Apps Script).

## Como trabalhar
- Uma etapa por vez. Primeiro apresente o plano e espere aprovação antes de alterar arquivos.
- Ao terminar, liste os arquivos alterados e diga como testar.
- Teste local: o service worker só funciona em `localhost` ou HTTPS (usar a extensão Live Server do VS Code ou `npx serve`). Abrir com `file://` não registra o service worker.
- Não fazer commit nem push sem eu pedir.
