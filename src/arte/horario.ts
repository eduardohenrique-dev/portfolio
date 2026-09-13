/**
 * O relógio da página. A rolagem move o relógio de 16:40 a 23:10; o relógio decide o horário
 * (tarde, entardecer, anoitecer, noite) e a troca de horário acontece em passos, com dithering.
 */
import type { EstadoLuz } from "./compositor";
import { HORARIOS, PALETAS_HEX } from "./paleta";

export const MINUTO_INICIAL = 16 * 60 + 40;
export const MINUTO_FINAL = 23 * 60 + 10;

/** Luz de cada horário. */
export const LUZ: EstadoLuz[] = [
  { escuridao: 0, sol: 1, solVariante: 0, luminaria: 0 },
  { escuridao: 0, sol: 1, solVariante: 1, luminaria: 0 },
  { escuridao: 1, sol: 0, solVariante: 1, luminaria: 1 },
  { escuridao: 1, sol: 0, solVariante: 1, luminaria: 1 },
];

/** A lâmpada acende piscando: cada posição é um passo da transição. */
const PISCA = [0, 1, 0, 0, 1, 1, 1];

const PASSOS = 6;
const DURACAO_MS = 480;

export function indiceDoMinuto(minutos: number): number {
  if (minutos < 17 * 60 + 30) return 0;
  if (minutos < 18 * 60 + 40) return 1;
  if (minutos < 20 * 60) return 2;
  return 3;
}

export interface Estado {
  minutos: number;
  indice: number;
  anterior: number;
  /** progresso da troca de horário, em passos: 0, 1/6 … 1 */
  transicao: number;
  luminariaForcada: boolean | null;
}

type Ouvinte = (estado: Estado) => void;

const ouvintes = new Set<Ouvinte>();
let estado: Estado = { minutos: MINUTO_INICIAL, indice: 0, anterior: 0, transicao: 1, luminariaForcada: null };
let quadro = 0;

function emitir() {
  for (const o of ouvintes) o(estado);
}

export function lerEstado(): Estado {
  return estado;
}

export function assinar(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  ouvinte(estado);
  return () => ouvintes.delete(ouvinte);
}

function aplicarTokens(indice: number) {
  const raiz = document.documentElement;
  const nomes = ["fundo", "superficie", "linha", "ambar", "salvia", "rosa", "creme", "bruma"];
  PALETAS_HEX[HORARIOS[indice]].forEach((hex, i) => raiz.style.setProperty(`--c-${nomes[i]}`, hex));
  raiz.dataset.horario = HORARIOS[indice];
}

function animarTransicao() {
  cancelAnimationFrame(quadro);
  const inicio = performance.now();
  const passo = () => {
    const t = Math.min(1, Math.floor(((performance.now() - inicio) / DURACAO_MS) * PASSOS) / PASSOS);
    if (t !== estado.transicao) {
      estado = { ...estado, transicao: t };
      emitir();
    }
    if (t < 1) quadro = requestAnimationFrame(passo);
  };
  quadro = requestAnimationFrame(passo);
}

/** Fixa um horário sem transição (movimento reduzido ou primeira pintura). */
export function fixarHorario(indice: number) {
  cancelAnimationFrame(quadro);
  estado = { ...estado, indice, anterior: indice, transicao: 1 };
  aplicarTokens(indice);
  emitir();
}

export function definirMinutos(minutos: number) {
  const m = Math.max(MINUTO_INICIAL, Math.min(MINUTO_FINAL, minutos));
  const passo10 = Math.floor(m / 10) * 10;
  const indice = indiceDoMinuto(passo10);
  if (indice === estado.indice) {
    if (passo10 !== estado.minutos) {
      estado = { ...estado, minutos: passo10 };
      emitir();
    }
    return;
  }
  // se a troca anterior ainda não chegou na metade, o visual ainda é o horário de antes
  const visual = estado.transicao >= 0.5 ? estado.indice : estado.anterior;
  estado = { ...estado, minutos: passo10, anterior: visual, indice, transicao: 0, luminariaForcada: null };
  aplicarTokens(indice);
  emitir();
  animarTransicao();
}

export function alternarLuminaria() {
  const atual = luzAtual(estado).luminaria >= 0.5;
  estado = { ...estado, luminariaForcada: !atual };
  emitir();
}

export function luzAtual(e: Estado, indiceFixo?: number): EstadoLuz {
  if (indiceFixo !== undefined) {
    const base = { ...LUZ[indiceFixo] };
    if (e.luminariaForcada !== null) base.luminaria = e.luminariaForcada ? 1 : 0;
    return base;
  }
  const a = LUZ[e.anterior];
  const b = LUZ[e.indice];
  const t = e.transicao;
  const mistura = (x: number, y: number) => x + (y - x) * t;
  let luminaria = mistura(a.luminaria, b.luminaria);
  if (a.luminaria === 0 && b.luminaria === 1) luminaria = PISCA[Math.round(t * (PISCA.length - 1))];
  if (e.luminariaForcada !== null) luminaria = e.luminariaForcada ? 1 : 0;
  return {
    escuridao: mistura(a.escuridao, b.escuridao),
    sol: mistura(a.sol, b.sol),
    solVariante: mistura(a.solVariante, b.solVariante),
    luminaria,
  };
}

export function formatarHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
