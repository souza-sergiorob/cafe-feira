// ==========================================================
// dados.js - o cardápio da cafeteria
// Um ARRAY (lista) de OBJETOS. Cada objeto é um produto.
// Para mudar o cardápio, basta editar esta lista.
// ==========================================================

const produtos = [
  { id: 1,  nome: "Espresso",        descricao: "Café curto e encorpado",          preco: 6.00,  categoria: "Cafés",    emoji: "☕" },
  { id: 2,  nome: "Cappuccino",      descricao: "Espresso, leite vaporizado e espuma", preco: 9.50, categoria: "Cafés", emoji: "☕" },
  { id: 3,  nome: "Latte",           descricao: "Espresso com bastante leite",     preco: 10.00, categoria: "Cafés",    emoji: "🥛" },
  { id: 4,  nome: "Mocha",           descricao: "Café, chocolate e chantilly",     preco: 12.00, categoria: "Cafés",    emoji: "🍫" },
  { id: 5,  nome: "Cold Brew",       descricao: "Café extraído a frio, com gelo",  preco: 11.00, categoria: "Geladas",  emoji: "🧊" },
  { id: 6,  nome: "Frappé",          descricao: "Café batido com gelo e leite",    preco: 14.00, categoria: "Geladas",  emoji: "🥤" },
  { id: 7,  nome: "Pão de queijo",   descricao: "Porção com 4 unidades",           preco: 7.00,  categoria: "Salgados", emoji: "🧀" },
  { id: 8,  nome: "Croissant",       descricao: "Massa folhada amanteigada",       preco: 9.00,  categoria: "Salgados", emoji: "🥐" },
  { id: 9,  nome: "Bolo de cenoura", descricao: "Fatia com cobertura de chocolate", preco: 8.00, categoria: "Doces",    emoji: "🍰" },
  { id: 10, nome: "Cookie",          descricao: "Gotas de chocolate",              preco: 6.50,  categoria: "Doces",    emoji: "🍪" }
];
