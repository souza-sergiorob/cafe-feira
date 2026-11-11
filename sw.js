// ==========================================================
// sw.js - Service Worker
// Roda em segundo plano, entre o app e a internet.
// Estratégia "rede primeiro": tenta buscar na internet (versão mais nova);
// se estiver offline, entrega a cópia guardada no cache.
// ==========================================================

// Mude o número da versão sempre que alterar a lista de arquivos abaixo
// ou o conteúdo de qualquer arquivo dela.
const CACHE = "cafe-feira-v2";

// Prefixo de todos os caches deste app (decisão D9)
const PREFIXO_CACHE = "cafe-feira-";

// ATENÇÃO, imagens de produtos (img/produtos/):
// - cada imagem NOVA tem que entrar nesta lista, senão não abre offline;
// - ao incluir OU trocar uma imagem, suba a versão de CACHE acima.
// Só liste arquivos que existem: se um faltar, o cache.addAll falha inteiro
// e o app deixa de funcionar offline.
const ARQUIVOS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/dados.js",
  "./js/pagamento.js",
  "./js/app.js",
  "./js/pwa.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./img/produtos/padrao.webp",
  "./img/produtos/chemex.webp"
];

// 1) INSTALAÇÃO: baixa e guarda todos os arquivos do app no cache
self.addEventListener("install", function (evento) {
  evento.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ARQUIVOS);
    })
  );
  self.skipWaiting(); // ativa a nova versão sem esperar fechar o app
});

// 2) ATIVAÇÃO: apaga caches de versões antigas DESTE app.
// O domínio souza-sergiorob.github.io é dividido com o app da aula (cache "cafe-mobile-..."),
// por isso só apagamos caches que começam com "cafe-feira-".
self.addEventListener("activate", function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(
        nomes
          .filter(function (nome) {
            return nome.startsWith(PREFIXO_CACHE) && nome !== CACHE;
          })
          .map(function (nome) { return caches.delete(nome); })
      );
    })
  );
  self.clients.claim(); // passa a controlar as abas já abertas
});

// 3) BUSCA: toda requisição do app passa por aqui
self.addEventListener("fetch", function (evento) {
  if (evento.request.method !== "GET") {
    return; // só guardamos requisições GET
  }

  evento.respondWith(
    fetch(evento.request)
      .then(function (resposta) {
        // Online: guarda uma cópia atualizada no cache (só respostas OK,
        // para não guardar um "404" de imagem que ainda não existe)
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(evento.request, copia);
          });
        }
        return resposta;
      })
      .catch(function () {
        // Offline: devolve o que está no cache
        return caches.match(evento.request, { ignoreSearch: true }).then(function (guardada) {
          if (guardada) {
            return guardada; // inclui a navegação: "./" e "./index.html" estão na lista
          }
          // Abrir o app por um endereço que não está no cache: entrega o index.html
          if (evento.request.mode === "navigate") {
            return caches.match("./index.html");
          }
          // Arquivo que nunca foi guardado (ex.: imagem de produto ainda não publicada):
          // devolve um erro de rede "limpo"; a imagem cai no onerror e mostra a padrão.
          return Response.error();
        });
      })
  );
});
