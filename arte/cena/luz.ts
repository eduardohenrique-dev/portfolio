/**
 * Mapas de luz calculados no build, com sombra de verdade:
 * cada pixel sabe sua posição no mundo, então dá para lançar um raio até
 * a janela (sol) ou até a lâmpada e ver se algum móvel está no caminho.
 * O resultado é um mapa de nível 0–7 por pixel, que o compositor pontilha.
 */
import { VAZIO } from "../../src/arte/paleta";
import { type CaixaRegistrada, FACE, NORMAIS, raioCaixa, type Tela } from "../iso";
import type { Quarto } from "./quarto";

/** Uma unidade em x/y equivale a 2px de altura; z vem em px. */
const ESCALA_Z = 0.5;

const ESTRUTURA = new Set(["piso", "parede-esquerda", "parede-fundo", "quina", "vao-lateral"]);

type Vec = [number, number, number];

/** Direção PARA o sol (coordenadas reais). Uma por variante. */
export const DIRECOES_SOL: Vec[] = [
  [-0.45, -0.25, 0.86], // tarde: mancha no assoalho, logo abaixo da janela
  [-0.75, -0.35, 0.56], // entardecer: sol mais baixo, a mancha se alonga até a cadeira
];

function normalizar([x, y, z]: Vec): Vec {
  const m = Math.hypot(x, y, z);
  return [x / m, y / m, z / m];
}

function bloqueadores(tela: Tela, excluir: Set<number>): CaixaRegistrada[] {
  return tela.caixas.filter((c) => c.sombra && !ESTRUTURA.has(c.nome) && !excluir.has(c.id));
}

function bloqueado(p: Vec, d: Vec, limite: number, caixas: CaixaRegistrada[], proprio: number): boolean {
  for (const c of caixas) {
    if (c.id === proprio) continue;
    const real = { ...c, z0: c.z0 * ESCALA_Z, z1: c.z1 * ESCALA_Z };
    const t = raioCaixa(p[0], p[1], p[2], d[0], d[1], d[2], real);
    if (t > 0.02 && t < limite) return true;
  }
  return false;
}

/** Deslocamentos (y, z em px) para suavizar a borda da mancha em 1–2px. */
const AMOSTRAS: [number, number][] = [
  [0, 0],
  [-0.3, 0],
  [0.3, 0],
  [0, -0.6],
  [0, 0.6],
];

export function mapaSol(q: Quarto, direcao: Vec): Uint8Array {
  const { tela, janela } = q;
  const s = normalizar(direcao);
  const caixas = bloqueadores(tela, new Set());
  const saida = new Uint8Array(tela.w * tela.h);
  for (let p = 0; p < saida.length; p++) {
    if (tela.cor[p] === VAZIO) continue;
    const face = tela.face[p];
    if (!face) continue;
    const px = tela.mx[p];
    if (px <= 0.01) continue; // na parede da janela ou dentro dela
    const [nx, ny, nz] = NORMAIS[face];
    const lambert = nx * s[0] + ny * s[1] + nz * s[2];
    if (lambert <= 0.05) continue;
    const py = tela.my[p];
    const pz = tela.mz[p] * ESCALA_Z;
    const lambda = -px / s[0];
    let dentro = 0;
    for (const [oy, oz] of AMOSTRAS) {
      const hy = py + lambda * s[1] + oy;
      const hz = (pz + lambda * s[2]) / ESCALA_Z + oz;
      // o caixilho em cruz também faz sombra
      const meioY = Math.floor((janela.y0 + janela.y1) / 2);
      const meioZ = Math.floor((janela.z0 + janela.z1) / 2);
      const noCaixilho = Math.floor(hy) === meioY || (hz >= meioZ && hz < meioZ + 2);
      if (hy >= janela.y0 && hy < janela.y1 && hz >= janela.z0 && hz < janela.z1 && !noCaixilho) dentro++;
    }
    if (dentro === 0) continue;
    const origem: Vec = [px + nx * 0.05, py + ny * 0.05, pz + nz * 0.05];
    if (bloqueado(origem, s, lambda, caixas, tela.obj[p])) continue;
    saida[p] = Math.round((7 * dentro) / AMOSTRAS.length);
  }
  return saida;
}

function mapaPontual(
  q: Quarto,
  fonte: Vec,
  alcance: number,
  cone: (dir: Vec) => number,
  excluir: Set<number>,
  ganho: number,
): Uint8Array {
  const { tela } = q;
  const L: Vec = [fonte[0], fonte[1], fonte[2] * ESCALA_Z];
  const caixas = bloqueadores(tela, excluir);
  const saida = new Uint8Array(tela.w * tela.h);
  for (let p = 0; p < saida.length; p++) {
    if (tela.cor[p] === VAZIO) continue;
    const face = tela.face[p];
    if (!face) continue;
    const P: Vec = [tela.mx[p], tela.my[p], tela.mz[p] * ESCALA_Z];
    const d: Vec = [L[0] - P[0], L[1] - P[1], L[2] - P[2]];
    const dist = Math.hypot(...d);
    if (dist > alcance || dist < 0.001) continue;
    const dir: Vec = [d[0] / dist, d[1] / dist, d[2] / dist];
    const [nx, ny, nz] = NORMAIS[face];
    const lambert = face === FACE.sprite ? 0.8 : Math.max(0, nx * dir[0] + ny * dir[1] + nz * dir[2]);
    const fatorCone = cone(dir);
    if (fatorCone <= 0) continue;
    const queda = (1 - dist / alcance) ** 1.6;
    const origem: Vec = [P[0] + nx * 0.05, P[1] + ny * 0.05, P[2] + nz * 0.05];
    if (bloqueado(origem, dir, dist, caixas, tela.obj[p])) continue;
    saida[p] = Math.min(7, Math.round(7 * ganho * queda * (0.3 + 0.7 * lambert) * fatorCone));
  }
  return saida;
}

export function mapaLuminaria(q: Quarto): Uint8Array {
  // cúpula virada para baixo: dir aponta do pixel para a lâmpada, então dir.z > 0 = pixel abaixo
  const lampada = mapaPontual(
    q,
    q.lampada,
    24,
    (dir) => Math.min(1, Math.max(0.06, 0.2 + dir[2] * 1.4)),
    new Set(q.caixasLuminaria),
    1.7,
  );
  // brilho da tela: fraco, só na frente do monitor
  const tela = mapaPontual(q, q.telaMonitor, 12, (dir) => (dir[1] < -0.2 ? 1 : 0), new Set(), 0.9);
  for (let p = 0; p < lampada.length; p++) lampada[p] = Math.max(lampada[p], tela[p]);
  return lampada;
}
