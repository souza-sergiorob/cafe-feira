// ==========================================================
// dados.js - o cardápio da cafeteria
// Um ARRAY (lista) de OBJETOS. Cada objeto é um produto.
// Por enquanto é um cardápio de teste; na Etapa 6 ele vira só a reserva
// para o primeiro uso sem internet, e o cardápio oficial vem da planilha.
//
// preco: em reais (o app converte para centavos na hora de calcular).
// imagem: só o nome do arquivo em img/produtos/ (ex.: "espresso.webp").
//         Vazio ou arquivo inexistente: o app mostra a imagem padrão.
// ==========================================================

const produtos = [
  { id: 1,  nome: "Espresso",            descricao: "Café curto e encorpado",              preco: 6.00,  categoria: "Cafés",    emoji: "☕", imagem: "espresso.webp" },
  { id: 2,  nome: "Cappuccino",          descricao: "Espresso, leite vaporizado e espuma", preco: 9.50,  categoria: "Cafés",    emoji: "☕", imagem: "cappuccino.webp" },
  { id: 3,  nome: "Latte",               descricao: "Espresso com bastante leite",         preco: 10.00, categoria: "Cafés",    emoji: "🥛", imagem: "latte.webp" },
  { id: 4,  nome: "Mocha",               descricao: "Café, chocolate e chantilly",         preco: 12.00, categoria: "Cafés",    emoji: "🍫", imagem: "mocha.webp" },
  { id: 11, nome: "Café coado (Chemex)", descricao: "Café filtrado na Chemex",             preco: 12.00, categoria: "Cafés",    emoji: "☕", imagem: "chemex.webp" },
  { id: 5,  nome: "Cold Brew",           descricao: "Café extraído a frio, com gelo",      preco: 11.00, categoria: "Geladas",  emoji: "🧊", imagem: "cold-brew.webp" },
  { id: 6,  nome: "Frappé",              descricao: "Café batido com gelo e leite",        preco: 14.00, categoria: "Geladas",  emoji: "🥤", imagem: "frappe.webp" },
  { id: 7,  nome: "Pão de queijo",       descricao: "Porção com 4 unidades",               preco: 7.00,  categoria: "Salgados", emoji: "🧀", imagem: "pao-de-queijo.webp" },
  { id: 8,  nome: "Croissant",           descricao: "Massa folhada amanteigada",           preco: 9.00,  categoria: "Salgados", emoji: "🥐", imagem: "croissant.webp" },
  { id: 9,  nome: "Bolo de cenoura",     descricao: "Fatia com cobertura de chocolate",    preco: 8.00,  categoria: "Doces",    emoji: "🍰", imagem: "bolo-de-cenoura.webp" },
  { id: 10, nome: "Cookie",              descricao: "Gotas de chocolate",                  preco: 4.90,  categoria: "Doces",    emoji: "🍪", imagem: "" }
];
