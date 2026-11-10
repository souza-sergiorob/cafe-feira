// ==========================================================
// sw.js - Service Worker
// Roda em segundo plano, entre o app e a internet.
// Estratégia "rede primeiro": tenta buscar na internet (versão mais nova);
// se estiver offline, entrega a cópia guardada no cache.
// ==========================================================

// Mude o número da versão sempre que alterar a lista de arquivos abaixo
// (também ao incluir ou trocar uma imagem de produto em img/produtos/)
const CACHE = "cafe-feira-v1";

// Prefixo de todos os caches deste app (decisão D9)
const PREFIXO_CACHE = "cafe-feira-";

const ARQUIVOS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/dados.js",
  "./js/app.js",
  "./js/pwa.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./img/produtos/padrao.webp"
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
        // Online: guarda uma cópia atualizada no cache e devolve a resposta
        const copia = resposta.clone();
        caches.open(CACHE).then(function (cache) {
          cache.put(evento.request, copia);
        });
        return resposta;
      })
      .catch(function () {
        // Offline: devolve o que está no cache
        return caches.match(evento.request, { ignoreSearch: true });
      })
  );
});
