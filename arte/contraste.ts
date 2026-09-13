/**
 * Valida contraste WCAG AA dos pares de texto em todos os horários.
 * Roda com: npm run arte:contraste
 */
import { HORARIOS, INDICE, PALETAS, type NomeIndice, type Rgb } from "../src/arte/paleta";

function luminancia([r, g, b]: Rgb): number {
  const canal = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a: Rgb, b: Rgb): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// [texto, fundo, mínimo]
const PARES: [NomeIndice, NomeIndice, number][] = [
  ["creme", "fundo", 4.5],
  ["creme", "superficie", 4.5],
  ["bruma", "fundo", 4.5],
  ["bruma", "superficie", 4.5],
  ["ambar", "fundo", 4.5],
  ["ambar", "superficie", 4.5],
  ["rosa", "fundo", 4.5],
  ["salvia", "fundo", 4.5],
  ["salvia", "superficie", 4.5],
  ["fundo", "ambar", 4.5], // texto escuro sobre botão âmbar
  ["bruma", "linha", 3], // borda de campo (componente de UI, 3:1)
  ["ambar", "linha", 3],
];

let falhou = false;
for (const horario of HORARIOS) {
  const p = PALETAS[horario];
  const linhas = PARES.map(([t, f, min]) => {
    const c = contraste(p[INDICE[t]], p[INDICE[f]]);
    const ok = c >= min;
    if (!ok) falhou = true;
    return `  ${ok ? "ok " : "FALHA"} ${t.padEnd(10)} sobre ${f.padEnd(10)} ${c.toFixed(2)} (mín. ${min})`;
  });
  console.log(`${horario}\n${linhas.join("\n")}`);
}

if (falhou) {
  console.error("\nHá pares abaixo do AA.");
  process.exit(1);
}
console.log("\nTodos os pares passam.");
