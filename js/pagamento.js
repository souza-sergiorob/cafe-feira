// ==========================================================
// pagamento.js - Café Feira: dinheiro em centavos e painel de pagamento
// Carregado ANTES do app.js. Aqui só criamos funções e botões; quem desenha a
// tela pela primeira vez é o app.js (que também tem o carrinho "pedido").
// ==========================================================

// ---------- 1. Dinheiro em centavos ----------
// 0.1 + 0.2 dá 0.30000000000000004 no JavaScript. Para não errar contas de
// dinheiro, todos os cálculos usam CENTAVOS (números inteiros): R$ 4,90 = 490.

// 4.9 (reais) -> 490 (centavos)
function reaisParaCentavos(valor) {
  return Math.round(valor * 100);
}

// 490 (centavos) -> 4.9 (reais, no máximo 2 casas)
function centavosParaReais(centavos) {
  return Math.round(centavos) / 100;
}

// 490 -> "R$ 4,90"
function formatarMoeda(centavos) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// 490 -> "4,90" (para preencher campos de digitação)
function centavosParaTexto(centavos) {
  return (centavos / 100).toFixed(2).replace(".", ",");
}

// Texto digitado -> centavos. Aceita "20", "20,5", "20,50", "20.50",
// "R$ 20" e "1.234,50". Devolve null se o texto não for um valor válido.
function textoParaCentavos(texto) {
  let limpo = String(texto).replace(/R\$/gi, "").replace(/\s/g, "");
  if (limpo === "") {
    return null;
  }
  // Com vírgula, ela é a casa decimal e os pontos separam milhar: "1.234,50" -> "1234.50"
  if (limpo.includes(",")) {
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  }
  // Só dígitos, com no máximo 2 casas depois do ponto
  if (!/^\d+(\.\d{0,2})?$/.test(limpo)) {
    return null;
  }
  return Math.round(parseFloat(limpo) * 100);
}

// ---------- 2. Estado do pagamento (só na memória) ----------

// Nomes exatos da especificação (seção 6.1)
const FORMAS_PAGAMENTO = ["Dinheiro", "Pix", "Cartão de Crédito", "Cartão de Débito"];

const pagamento = {
  dividido: false,     // false = forma única (o normal); true = pagamento dividido
  formaUnica: null,    // forma escolhida no modo normal (ex.: "Pix")
  parcelas: [],        // modo dividido: [{ forma, centavos }] (centavos = null se inválido)
  avisoDivisao: false  // true quando o carrinho mudou e a divisão foi zerada
};

const painelPagamento = document.querySelector("#painel-pagamento");
const areaFormaUnica = document.querySelector("#area-forma-unica");
const areaDividida = document.querySelector("#area-dividida");
const listaParcelas = document.querySelector("#lista-parcelas");
const situacaoDivisao = document.querySelector("#situacao-divisao");
const avisoDivisao = document.querySelector("#aviso-divisao");
const areaDinheiro = document.querySelector("#area-dinheiro");
const campoRecebido = document.querySelector("#valor-recebido");
const avisoRecebido = document.querySelector("#aviso-recebido");
const valorTroco = document.querySelector("#valor-troco");
const btnConfirmar = document.querySelector("#btn-confirmar");

// As parcelas que valem agora. Na forma única, é uma só, sempre com o total
// atual (por isso ela se atualiza sozinha quando o carrinho muda).
function parcelasAtuais() {
  if (pagamento.dividido) {
    return pagamento.parcelas;
  }
  if (pagamento.formaUnica) {
    return [{ forma: pagamento.formaUnica, centavos: calcularTotalCentavos() }];
  }
  return [];
}

function somaParcelas() {
  let soma = 0;
  for (const parcela of parcelasAtuais()) {
    soma = soma + (parcela.centavos || 0);
  }
  return soma;
}

// Valor da parcela em Dinheiro (0 se não houver)
function parcelaEmDinheiro() {
  const parcela = parcelasAtuais().find(function (p) {
    return p.forma === "Dinheiro";
  });
  return parcela ? parcela.centavos || 0 : 0;
}

function temDinheiro() {
  return parcelasAtuais().some(function (p) {
    return p.forma === "Dinheiro";
  });
}

function recebidoEmCentavos() {
  return textoParaCentavos(campoRecebido.value);
}

// Regras da seção 7: itens, forma(s), soma = total e dinheiro recebido suficiente
function pagamentoValido() {
  const parcelas = parcelasAtuais();
  if (pedido.length === 0 || parcelas.length === 0) {
    return false;
  }
  const todasComValor = parcelas.every(function (p) {
    return p.centavos !== null && p.centavos > 0;
  });
  if (!todasComValor || somaParcelas() !== calcularTotalCentavos()) {
    return false;
  }
  if (temDinheiro()) {
    const recebido = recebidoEmCentavos();
    if (recebido === null || recebido < parcelaEmDinheiro()) {
      return false;
    }
  }
  return true;
}

// Pagamento no formato da venda (seção 6.1), já em reais
function dadosDoPagamento() {
  const pagamentos = parcelasAtuais().map(function (p) {
    return { forma: p.forma, valor: centavosParaReais(p.centavos) };
  });
  let recebido = 0;
  let troco = 0;
  if (temDinheiro()) {
    recebido = recebidoEmCentavos();
    troco = recebido - parcelaEmDinheiro();
  }
  return {
    pagamentos: pagamentos,
    valorRecebidoDinheiro: centavosParaReais(recebido),
    troco: centavosParaReais(troco)
  };
}

// ---------- 3. Ações do operador ----------

function escolherFormaUnica(forma) {
  pagamento.formaUnica = forma;
  desenharPagamento();
}

function entrarModoDividido() {
  pagamento.dividido = true;
  pagamento.formaUnica = null;
  pagamento.parcelas = [];
  pagamento.avisoDivisao = false;
  desenharPagamento();
}

function cancelarDivisao() {
  pagamento.dividido = false;
  pagamento.parcelas = [];
  pagamento.avisoDivisao = false;
  desenharPagamento();
}

// Adiciona uma forma à divisão, já com o valor que ainda falta
function adicionarParcela(forma) {
  const jaExiste = pagamento.parcelas.some(function (p) {
    return p.forma === forma;
  });
  if (jaExiste) {
    return; // no máximo uma parcela por forma
  }
  const falta = calcularTotalCentavos() - somaParcelas();
  pagamento.parcelas.push({ forma: forma, centavos: Math.max(falta, 0) });
  pagamento.avisoDivisao = false;
  desenharPagamento();

  // Deixa o valor da parcela nova selecionado, pronto para digitar por cima
  const campos = listaParcelas.querySelectorAll("input");
  const campoNovo = campos[campos.length - 1];
  campoNovo.focus();
  campoNovo.select();
}

function removerParcela(forma) {
  pagamento.parcelas = pagamento.parcelas.filter(function (p) {
    return p.forma !== forma;
  });
  desenharPagamento();
}

// Chamada pelo app.js sempre que o carrinho muda
function aoMudarCarrinho() {
  if (pedido.length === 0) {
    limparPagamento();
    return;
  }
  // Forma única: nada a fazer (o valor vem do total).
  // Dividido: os valores antigos não servem mais -> zera e avisa.
  if (pagamento.dividido && pagamento.parcelas.length > 0) {
    pagamento.parcelas = [];
    pagamento.avisoDivisao = true;
  }
}

// Volta tudo ao começo (nova venda ou carrinho vazio)
function limparPagamento() {
  pagamento.dividido = false;
  pagamento.formaUnica = null;
  pagamento.parcelas = [];
  pagamento.avisoDivisao = false;
  campoRecebido.value = "";
}

// ---------- 4. Desenhar o painel ----------

// Redesenha o painel inteiro (quando muda a forma, o modo ou as parcelas)
function desenharPagamento() {
  painelPagamento.hidden = pedido.length === 0;

  // Forma única
  areaFormaUnica.hidden = pagamento.dividido;
  for (const botao of document.querySelectorAll("#formas-unica .btn-forma")) {
    botao.classList.toggle("ativa", botao.dataset.forma === pagamento.formaUnica);
  }

  // Dividido
  areaDividida.hidden = !pagamento.dividido;
  avisoDivisao.hidden = !pagamento.avisoDivisao;
  desenharParcelas();

  atualizarSituacao();
}

function desenharParcelas() {
  listaParcelas.innerHTML = "";
  for (const parcela of pagamento.parcelas) {
    const li = document.createElement("li");
    li.className = "parcela";
    li.innerHTML = `
      <span class="parcela-forma">${parcela.forma}</span>
      <input type="text" inputmode="decimal" autocomplete="off"
             aria-label="Valor em ${parcela.forma}" value="${centavosParaTexto(parcela.centavos || 0)}">
      <button class="btn-remover" aria-label="Remover ${parcela.forma}">✕</button>
    `;
    // Ao digitar, só atualiza os textos (sem redesenhar, para o teclado não fechar)
    li.querySelector("input").addEventListener("input", function (evento) {
      parcela.centavos = textoParaCentavos(evento.target.value);
      atualizarSituacao();
    });
    li.querySelector(".btn-remover").addEventListener("click", function () {
      removerParcela(parcela.forma);
    });
    listaParcelas.appendChild(li);
  }
}

// Atualiza só os textos e botões que dependem dos valores digitados
function atualizarSituacao() {
  // Botões de adicionar forma: desabilita as formas que já estão na divisão
  for (const botao of document.querySelectorAll("#formas-adicionar .btn-forma")) {
    botao.disabled = pagamento.parcelas.some(function (p) {
      return p.forma === botao.dataset.forma;
    });
  }

  // "Falta" / "Passou" / "Pagamento completo"
  if (pagamento.dividido) {
    const diferenca = calcularTotalCentavos() - somaParcelas();
    const algumaInvalida = pagamento.parcelas.some(function (p) {
      return p.centavos === null;
    });
    let texto = "";
    let classe = "erro";
    if (pagamento.parcelas.length === 0) {
      texto = "Adicione as formas de pagamento abaixo.";
      classe = "";
    } else if (algumaInvalida) {
      texto = "Há um valor inválido.";
    } else if (diferenca > 0) {
      texto = "Falta " + formatarMoeda(diferenca);
    } else if (diferenca < 0) {
      texto = "Passou " + formatarMoeda(-diferenca) + " do total";
    } else {
      texto = "✔ Pagamento completo";
      classe = "ok";
    }
    situacaoDivisao.textContent = texto;
    situacaoDivisao.className = "situacao-divisao " + classe;
  }

  // Dinheiro: valor recebido e troco
  areaDinheiro.hidden = !temDinheiro();
  avisoRecebido.hidden = true;
  valorTroco.textContent = formatarMoeda(0);
  if (temDinheiro() && campoRecebido.value.trim() !== "") {
    const recebido = recebidoEmCentavos();
    const emDinheiro = parcelaEmDinheiro();
    if (recebido === null) {
      avisoRecebido.textContent = "Valor recebido inválido.";
      avisoRecebido.hidden = false;
    } else if (recebido < emDinheiro) {
      avisoRecebido.textContent = "Valor recebido menor que " + formatarMoeda(emDinheiro) + " (parcela em dinheiro).";
      avisoRecebido.hidden = false;
    } else {
      valorTroco.textContent = formatarMoeda(recebido - emDinheiro);
    }
  }

  btnConfirmar.disabled = !pagamentoValido();
}

// ---------- 5. Botões (criados uma vez só) ----------

function criarBotaoForma(forma, aoTocar) {
  const botao = document.createElement("button");
  botao.className = "btn-forma";
  botao.dataset.forma = forma;
  botao.textContent = forma;
  botao.addEventListener("click", function () {
    aoTocar(forma);
  });
  return botao;
}

for (const forma of FORMAS_PAGAMENTO) {
  document.querySelector("#formas-unica").appendChild(criarBotaoForma(forma, escolherFormaUnica));
  document.querySelector("#formas-adicionar").appendChild(criarBotaoForma(forma, adicionarParcela));
}

document.querySelector("#btn-dividir").addEventListener("click", entrarModoDividido);
document.querySelector("#btn-cancelar-divisao").addEventListener("click", cancelarDivisao);
campoRecebido.addEventListener("input", atualizarSituacao);

// Botões rápidos do valor recebido: "Exato", R$ 10, R$ 20, R$ 50, R$ 100
for (const botao of document.querySelectorAll(".btn-nota")) {
  botao.addEventListener("click", function () {
    const centavos = botao.dataset.centavos === "exato" ? parcelaEmDinheiro() : Number(botao.dataset.centavos);
    campoRecebido.value = centavosParaTexto(centavos);
    atualizarSituacao();
  });
}
