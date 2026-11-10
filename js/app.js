// ==========================================================
// app.js - Café Feira (caixa): abas, cardápio, pedido, localStorage e vibração
// ==========================================================

// ---------- Utilidades ----------

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

function criarCard(produto) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `
    <div class="card-emoji">${produto.emoji}</div>
    <div class="card-info">
      <h3>${produto.nome}</h3>
      <p>${produto.descricao}</p>
      <strong>${formatarPreco(produto.preco)}</strong>
    </div>
    <button class="btn-adicionar" aria-label="Adicionar ${produto.nome}">+</button>
  `;
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

// ---------- Pedido ----------

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
  return []; // nada salvo ainda: pedido vazio
}

function salvarPedido() {
  localStorage.setItem(CHAVE_PEDIDO, JSON.stringify(pedido));
}

// Cada item do pedido: { id, nome, preco, quantidade }
let pedido = carregarPedido();

function adicionarAoPedido(produto) {
  // Procura se o produto já está no pedido
  const item = pedido.find(function (i) {
    return i.id === produto.id;
  });

  if (item) {
    item.quantidade = item.quantidade + 1;
  } else {
    pedido.push({ id: produto.id, nome: produto.nome, preco: produto.preco, quantidade: 1 });
  }

  salvarPedido();
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
  mostrarPedido();
}

function calcularTotal() {
  let total = 0;
  for (const item of pedido) {
    total = total + item.preco * item.quantidade;
  }
  return total;
}

function mostrarPedido() {
  const lista = document.querySelector("#lista-pedido");
  lista.innerHTML = "";

  if (pedido.length === 0) {
    lista.innerHTML = '<li class="vazio">Seu pedido está vazio. Escolha algo no cardápio!</li>';
  }

  let quantidadeTotal = 0;
  for (const item of pedido) {
    quantidadeTotal = quantidadeTotal + item.quantidade;

    const li = document.createElement("li");
    li.className = "item-pedido";
    li.innerHTML = `
      <div class="nome">
        ${item.nome}
        <small>${formatarPreco(item.preco * item.quantidade)}</small>
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

  document.querySelector("#total-pedido").textContent = formatarPreco(calcularTotal());

  // Bolinha vermelha com a quantidade, na aba "Pedido"
  const contador = document.querySelector("#contador-pedido");
  contador.textContent = quantidadeTotal;
  contador.hidden = quantidadeTotal === 0;

  document.querySelector("#btn-finalizar").disabled = pedido.length === 0;
  document.querySelector("#btn-compartilhar-pedido").disabled = pedido.length === 0;
}

function finalizarPedido() {
  if (pedido.length === 0) {
    return;
  }
  vibrar([100, 50, 100, 50, 200]); // padrão "comemoração"
  mostrarAviso("Pedido enviado! Total: " + formatarPreco(calcularTotal()));
  pedido = [];
  salvarPedido();
  mostrarPedido();
}

document.querySelector("#btn-finalizar").addEventListener("click", finalizarPedido);

// ---------- Início ----------
mostrarCardapio("Todos");
mostrarPedido();
