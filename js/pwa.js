// ==========================================================
// pwa.js - Dia 6 (versão final): Service Worker, instalação e compartilhamento
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
  mostrarAviso("☕ Café Mobile instalado!");
});

// ---------- 3. Compartilhar (Web Share API) ----------
// Abre a janela nativa de compartilhamento do celular (WhatsApp, e-mail...)

function montarResumoPedido() {
  let texto = "☕ Meu pedido no Café Mobile:\n";
  for (const item of pedido) {
    texto = texto + item.quantidade + "x " + item.nome + " - " + formatarPreco(item.preco * item.quantidade) + "\n";
  }
  texto = texto + "Total: " + formatarPreco(calcularTotal());
  return texto;
}

async function compartilharPedido() {
  const texto = montarResumoPedido();

  if (navigator.share) {
    try {
      await navigator.share({ title: "Meu pedido", text: texto });
    } catch (erro) {
      console.log("Compartilhamento cancelado");
    }
  } else {
    // Computador sem suporte: copia o texto para a área de transferência
    await navigator.clipboard.writeText(texto);
    mostrarAviso("Resumo copiado! Cole onde quiser.");
  }
}

document.querySelector("#btn-compartilhar-pedido").addEventListener("click", compartilharPedido);

async function compartilharFoto(foto) {
  // Transforma a imagem guardada (texto base64) em um arquivo de verdade
  const resposta = await fetch(foto.imagem);
  const blob = await resposta.blob();
  const arquivo = new File([blob], "meu-cafe.jpg", { type: "image/jpeg" });

  // canShare verifica se o aparelho consegue compartilhar ARQUIVOS
  if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: "Meu café", text: "Olha o meu café! ☕" });
    } catch (erro) {
      console.log("Compartilhamento cancelado");
    }
  } else {
    mostrarAviso("Este aparelho não compartilha imagens");
  }
}

// ---------- 4. EXTRA do dia 6: aviso de offline ----------
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
