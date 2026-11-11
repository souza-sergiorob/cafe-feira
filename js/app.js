// ==========================================================
// app.js - Café Feira (caixa): abas, cardápio, venda atual, confirmação e vibração
// (o dinheiro em centavos e o painel de pagamento ficam em pagamento.js)
// ==========================================================

// ---------- Utilidades ----------

// Mostra uma mensagem rápida na parte de baixo da tela
let temporizadorAviso;
function mostrarAviso(texto) {
  const aviso = document.querySelector("#aviso");
  aviso.textContent = texto;
  aviso.classList.add("visivel");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(function () {
    aviso.classList.remove("visivel");
  }, 2000);
}

// RECURSO DE HARDWARE: motor de vibração do celular
// padrao pode ser um número (ms) ou uma lista: [vibra, pausa, vibra...]
function vibrar(padrao) {
  // Nem todo aparelho tem vibração (iPhone e computador não têm esta API)
  if ("vibrate" in navigator) {
    navigator.vibrate(padrao);
  }
}

// ---------- Navegação por abas ----------

const abas = document.querySelectorAll(".aba");
const telas = document.querySelectorAll(".tela");

function abrirTela(idTela) {
  for (const tela of telas) {
    tela.hidden = tela.id !== idTela; // esconde todas, menos a escolhida
  }
  for (const aba of abas) {
    aba.classList.toggle("ativa", aba.dataset.tela === idTela);
  }
  window.scrollTo(0, 0);
}

for (const aba of abas) {
  aba.addEventListener("click", function () {
    abrirTela(aba.dataset.tela);
  });
}

// ---------- Cardápio ----------

const listaProdutos = document.querySelector("#lista-produtos");
const botoesFiltro = document.querySelectorAll(".filtro");

const PASTA_IMAGENS = "img/produtos/";
const IMAGEM_PADRAO = PASTA_IMAGENS + "padrao.webp";

// Imagem do cartão, nesta ordem (decisão D8):
//   1) img/produtos/<imagem do produto>
//   2) se o campo estiver vazio ou o arquivo falhar: a imagem padrão
//   3) se a padrão também falhar: o emoji do produto
// O "data-nivel" guarda em que nível estamos, para cada nível ser tentado
// uma vez só (sem laço infinito de onerror).
function montarImagemProduto(produto) {
  const quadro = document.createElement("div");
  quadro.className = "card-imagem";

  const img = document.createElement("img");
  img.alt = produto.nome;
  img.loading = "lazy";
  img.width = 64;
  img.height = 64;

  // onerror é definido ANTES do src, para não perder um erro rápido
  img.onerror = function () {
    if (img.dataset.nivel === "produto") {
      img.dataset.nivel = "padrao";
      img.src = IMAGEM_PADRAO;          // 2) tenta a imagem padrão
    } else {
      img.onerror = null;               // 3) desiste das imagens: mostra o emoji
      quadro.textContent = produto.emoji;
      quadro.classList.add("com-emoji");
    }
  };

  if (produto.imagem) {
    img.dataset.nivel = "produto";
    img.src = PASTA_IMAGENS + produto.imagem;
  } else {
    img.dataset.nivel = "padrao";
    img.src = IMAGEM_PADRAO;
  }

  quadro.appendChild(img);
  return quadro;
}

function criarCard(produto) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <div class="card-info">
      <h3>${produto.nome}</h3>
      <p>${produto.descricao}</p>
      <strong>${formatarMoeda(reaisParaCentavos(produto.preco))}</strong>
    </div>
    <button class="btn-adicionar" aria-label="Adicionar ${produto.nome}">+</button>
  `;
  card.prepend(montarImagemProduto(produto));
  card.querySelector(".btn-adicionar").addEventListener("click", function () {
    adicionarAoPedido(produto);
  });
  return card;
}

function mostrarCardapio(categoria) {
  listaProdutos.innerHTML = "";
  for (const produto of produtos) {
    if (categoria === "Todos" || produto.categoria === categoria) {
      listaProdutos.appendChild(criarCard(produto));
    }
  }
}

for (const botao of botoesFiltro) {
  botao.addEventListener("click", function () {
    for (const outro of botoesFiltro) {
      outro.classList.remove("ativo");
    }
    botao.classList.add("ativo");
    mostrarCardapio(botao.dataset.categoria);
  });
}

// ---------- Venda atual (carrinho) ----------

// localStorage só guarda TEXTO. Por isso usamos JSON:
//   JSON.stringify(lista) -> transforma a lista em texto
//   JSON.parse(texto)     -> transforma o texto de volta em lista
//
// Todas as chaves do app começam com "cafeFeira." (decisão D9): o app divide o
// domínio souza-sergiorob.github.io com o app da aula, que usa a chave "pedido".
const CHAVE_PEDIDO = "cafeFeira.pedido";

function carregarPedido() {
  const salvo = localStorage.getItem(CHAVE_PEDIDO);
  if (salvo) {
    return JSON.parse(salvo);
  }
  return []; // nada salvo ainda: carrinho vazio
}

function salvarPedido() {
  localStorage.setItem(CHAVE_PEDIDO, JSON.stringify(pedido));
}

// Cada item: { id, nome, preco (em reais, como no cardápio), quantidade }
let pedido = carregarPedido();

function adicionarAoPedido(produto) {
  // Procura se o produto já está na venda
  const item = pedido.find(function (i) {
    return i.id === produto.id;
  });

  if (item) {
    item.quantidade = item.quantidade + 1;
  } else {
    pedido.push({ id: produto.id, nome: produto.nome, preco: produto.preco, quantidade: 1 });
  }

  esconderConclusao(); // começou outra venda: o painel da anterior sai
  salvarPedido();
  aoMudarCarrinho();   // pagamento.js: refaz a divisão, se houver
  mostrarPedido();
  vibrar(50); // vibração curtinha
  mostrarAviso(produto.emoji + " " + produto.nome + " adicionado");
}

// mudanca = +1 ou -1
function alterarQuantidade(id, mudanca) {
  const item = pedido.find(function (i) {
    return i.id === id;
  });
  item.quantidade = item.quantidade + mudanca;

  if (item.quantidade <= 0) {
    // filter cria uma nova lista SEM o item zerado
    pedido = pedido.filter(function (i) {
      return i.id !== id;
    });
  }
  salvarPedido();
  aoMudarCarrinho();
  mostrarPedido();
}

function subtotalCentavos(item) {
  return reaisParaCentavos(item.preco) * item.quantidade;
}

// Total em centavos (inteiro): 3 x R$ 4,90 = 1470, sem 14,700000001
function calcularTotalCentavos() {
  let total = 0;
  for (const item of pedido) {
    total = total + subtotalCentavos(item);
  }
  return total;
}

function mostrarPedido() {
  const lista = document.querySelector("#lista-pedido");
  lista.innerHTML = "";

  if (pedido.length === 0) {
    lista.innerHTML = '<li class="vazio">Nenhum item na venda. Escolha os produtos no cardápio.</li>';
  }

  let quantidadeTotal = 0;
  for (const item of pedido) {
    quantidadeTotal = quantidadeTotal + item.quantidade;

    const li = document.createElement("li");
    li.className = "item-pedido";
    li.innerHTML = `
      <div class="nome">
        ${item.nome}
        <small>${formatarMoeda(subtotalCentavos(item))}</small>
      </div>
      <button class="btn-qtd menos" aria-label="Diminuir">−</button>
      <span>${item.quantidade}</span>
      <button class="btn-qtd mais" aria-label="Aumentar">+</button>
    `;
    li.querySelector(".menos").addEventListener("click", function () {
      alterarQuantidade(item.id, -1);
    });
    li.querySelector(".mais").addEventListener("click", function () {
      alterarQuantidade(item.id, 1);
    });
    lista.appendChild(li);
  }

  document.querySelector("#total-pedido").textContent = formatarMoeda(calcularTotalCentavos());

  // Bolinha vermelha com a quantidade, na aba "Venda"
  const contador = document.querySelector("#contador-pedido");
  contador.textContent = quantidadeTotal;
  contador.hidden = quantidadeTotal === 0;

  desenharPagamento(); // pagamento.js: mostra/esconde o painel e liga/desliga "Confirmar venda"
}

// ---------- Confirmação da venda ----------

// Data e hora com o fuso do aparelho. No Brasil (Brasília): "2026-11-10T15:30:12-03:00"
function dataHoraLocalISO(data) {
  function doisDigitos(numero) {
    return String(numero).padStart(2, "0");
  }
  const minutosFuso = -data.getTimezoneOffset(); // Brasília: -180
  const sinal = minutosFuso >= 0 ? "+" : "-";
  const absoluto = Math.abs(minutosFuso);
  return data.getFullYear() + "-" + doisDigitos(data.getMonth() + 1) + "-" + doisDigitos(data.getDate()) +
    "T" + doisDigitos(data.getHours()) + ":" + doisDigitos(data.getMinutes()) + ":" + doisDigitos(data.getSeconds()) +
    sinal + doisDigitos(Math.floor(absoluto / 60)) + ":" + doisDigitos(absoluto % 60);
}

// Monta a venda no formato da seção 6.1 (valores em reais, 2 casas).
// Ainda SEM id, caixa e status: entram na Etapa 3 (id e status) e na Etapa 4 (caixa).
function montarVenda() {
  const dadosPagamento = dadosDoPagamento(); // pagamento.js
  return {
    dataHora: dataHoraLocalISO(new Date()),
    itens: pedido.map(function (item) {
      return {
        produtoId: item.id,
        nome: item.nome,
        preco: centavosParaReais(reaisParaCentavos(item.preco)),
        quantidade: item.quantidade
      };
    }),
    total: centavosParaReais(calcularTotalCentavos()),
    pagamentos: dadosPagamento.pagamentos,
    valorRecebidoDinheiro: dadosPagamento.valorRecebidoDinheiro,
    troco: dadosPagamento.troco
  };
}

// Ponto de extensão: na Etapa 3, esta função vai gravar a venda no aparelho
// (localStorage, com id único e status "pendente") e colocá-la na fila de envio.
// Por enquanto, só mostra a venda na aba Console das DevTools.
function registrarVenda(venda) {
  console.log("Venda confirmada:", venda);
}

function confirmarVenda() {
  if (!pagamentoValido()) {
    return; // o botão já fica desabilitado; isto é só uma garantia
  }
  const venda = montarVenda();
  registrarVenda(venda);
  vibrar([100, 50, 100, 50, 200]); // padrão "comemoração"

  // O carrinho é limpo já na confirmação (seção 4.2), para a mesma venda
  // não poder ser confirmada duas vezes.
  pedido = [];
  salvarPedido();
  limparPagamento();
  mostrarPedido();
  mostrarConclusao(venda);
}

// Painel de conclusão: total, formas e o troco bem grande
function mostrarConclusao(venda) {
  document.querySelector("#conclusao-total").textContent = formatarMoeda(reaisParaCentavos(venda.total));

  const listaFormas = document.querySelector("#conclusao-formas");
  listaFormas.innerHTML = "";
  for (const parcela of venda.pagamentos) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${parcela.forma}</span><span>${formatarMoeda(reaisParaCentavos(parcela.valor))}</span>`;
    listaFormas.appendChild(li);
  }

  const temDinheiroNaVenda = venda.pagamentos.some(function (p) {
    return p.forma === "Dinheiro";
  });
  document.querySelector("#conclusao-troco").hidden = !temDinheiroNaVenda;
  document.querySelector("#conclusao-troco-valor").textContent = formatarMoeda(reaisParaCentavos(venda.troco));

  document.querySelector("#area-venda").hidden = true;
  document.querySelector("#painel-conclusao").hidden = false;
  window.scrollTo(0, 0);
}

function esconderConclusao() {
  document.querySelector("#painel-conclusao").hidden = true;
  document.querySelector("#area-venda").hidden = false;
}

function novaVenda() {
  pedido = [];
  salvarPedido();
  limparPagamento();
  mostrarPedido();
  esconderConclusao();
  abrirTela("tela-cardapio");
}

document.querySelector("#btn-confirmar").addEventListener("click", confirmarVenda);
document.querySelector("#btn-nova-venda").addEventListener("click", novaVenda);

// ---------- Início ----------
mostrarCardapio("Todos");
mostrarPedido();
