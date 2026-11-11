// ==========================================================
// pwa.js - Café Feira: Service Worker, botão Instalar e aviso de offline
// ==========================================================

// ---------- 1. Registrar o Service Worker ----------
// O Service Worker (sw.js) guarda os arquivos no celular para o app abrir offline.
// Só funciona em HTTPS ou localhost. Abrindo pelo arquivo (file://) dá erro, e tudo bem.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("sw.js")
      .then(function () {
        console.log("Service Worker registrado!");
      })
      .catch(function (erro) {
        console.log("Service Worker não registrado:", erro.message);
      });
  });
}

// ---------- 2. Botão "Instalar" ----------
// Chrome/Edge (Android e computador) avisam quando o app pode ser instalado.
// No iPhone não existe esse aviso: instala-se por Compartilhar > Adicionar à Tela de Início.
const btnInstalar = document.querySelector("#btn-instalar");
let pedidoDeInstalacao = null;

window.addEventListener("beforeinstallprompt", function (evento) {
  evento.preventDefault();           // impede o aviso automático do navegador
  pedidoDeInstalacao = evento;       // guarda para usar quando o usuário clicar
  btnInstalar.hidden = false;
});

btnInstalar.addEventListener("click", async function () {
  if (!pedidoDeInstalacao) {
    return;
  }
  pedidoDeInstalacao.prompt();                       // mostra a janela de instalação
  const escolha = await pedidoDeInstalacao.userChoice;
  console.log("Resposta do usuário:", escolha.outcome); // "accepted" ou "dismissed"
  pedidoDeInstalacao = null;
  btnInstalar.hidden = true;
});

window.addEventListener("appinstalled", function () {
  mostrarAviso("☕ Café Feira instalado!");
});

// ---------- 3. Aviso de offline ----------
// navigator.onLine diz se há conexão; os eventos avisam quando ela muda
const faixaOffline = document.querySelector("#faixa-offline");

function atualizarConexao() {
  faixaOffline.hidden = navigator.onLine;
}

window.addEventListener("online", function () {
  atualizarConexao();
  mostrarAviso("Conexão restabelecida");
});
window.addEventListener("offline", atualizarConexao);
atualizarConexao();
