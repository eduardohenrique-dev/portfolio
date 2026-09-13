/**
 * Céu visto pela janela, desenhado por código a cada horário.
 * Faixas de cor com transição em dithering Bayer (nunca gradiente suave),
 * sol baixando, a silhueta do Pico da Ibituruna e as luzes da cidade à noite.
 */
import { BAYER4, INDICE, VAZIO } from "./paleta";

const { fundo: F, superficie: S, linha: L, ambar: A, rosa: R, creme: C, bruma: B } = INDICE;

export interface EstadoCeu {
  faixas: number[];
  montanha: number;
  /** sol: [x relativo, y relativo, raio] ou null */
  sol: [number, number, number] | null;
  corSol: number;
  lua: boolean;
  estrelas: number;
  luzesCidade: boolean;
}

export const CEUS: EstadoCeu[] = [
  // tarde
  { faixas: [C, C, A], montanha: R, sol: [0.38, 0.26, 3], corSol: A, lua: false, estrelas: 0, luzesCidade: false },
  // entardecer
  { faixas: [B, R, A], montanha: L, sol: [0.58, 0.6, 4], corSol: C, lua: false, estrelas: 0, luzesCidade: false },
  // anoitecer
  { faixas: [S, L, R], montanha: S, sol: null, corSol: A, lua: false, estrelas: 3, luzesCidade: true },
  // noite
  { faixas: [F, F, S], montanha: F, sol: null, corSol: C, lua: true, estrelas: 9, luzesCidade: true },
];

export interface Silhueta {
  largura: number;
  altura: number;
  dados: Uint8Array;
}

function aleatorio(semente: number) {
  let s = semente >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function desenharCeu(
  saida: Uint8Array,
  largura: number,
  altura: number,
  estado: EstadoCeu,
  montanha: Silhueta | null,
  opcoes: { horizonte: number; montanhaX: number; desloc?: number },
): void {
  const { horizonte, montanhaX, desloc = 0 } = opcoes;
  const n = estado.faixas.length - 1;
  for (let y = 0; y < altura; y++) {
    const pos = (y / (altura - 1)) * n;
    const baixo = Math.min(n - 1, Math.floor(pos));
    const frac = pos - baixo;
    for (let x = 0; x < largura; x++) {
      const limiar = (BAYER4[y & 3][x & 3] + 0.5) / 16;
      saida[y * largura + x] = frac > limiar ? estado.faixas[baixo + 1] : estado.faixas[baixo];
    }
  }

  const rnd = aleatorio(7);
  for (let k = 0; k < estado.estrelas; k++) {
    const x = Math.floor(rnd() * largura);
    const y = Math.floor(rnd() * altura * 0.55);
    saida[y * largura + x] = k % 3 === 0 ? C : B;
  }

  if (estado.lua) {
    const cx = Math.round(largura * 0.7);
    const cy = Math.round(altura * 0.22);
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        const dentro = dx * dx + dy * dy <= 9;
        const sombra = (dx + 2) * (dx + 2) + (dy - 1) * (dy - 1) <= 7;
        if (dentro && !sombra) {
          const x = cx + dx;
          const y = cy + dy;
          if (x >= 0 && y >= 0 && x < largura && y < altura) saida[y * largura + x] = C;
        }
      }
  }

  if (estado.sol) {
    const [rx, ry, raio] = estado.sol;
    const cx = Math.round(largura * rx);
    const cy = Math.round(altura * ry);
    for (let dy = -raio - 1; dy <= raio + 1; dy++)
      for (let dx = -raio - 1; dx <= raio + 1; dx++) {
        const d2 = dx * dx + dy * dy;
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= largura || y >= altura) continue;
        if (d2 <= raio * raio) saida[y * largura + x] = estado.corSol;
        else if (d2 <= (raio + 1) * (raio + 1) && ((x + y) & 1) === 0) saida[y * largura + x] = estado.corSol;
      }
  }

  if (montanha) {
    const ox = montanhaX - Math.round(montanha.largura * 0.62) + desloc;
    const oy = horizonte - montanha.altura + 1;
    for (let y = 0; y < montanha.altura; y++)
      for (let x = 0; x < montanha.largura; x++) {
        if (montanha.dados[y * montanha.largura + x] === VAZIO) continue;
        const sx = ox + x;
        const sy = oy + y;
        if (sx < 0 || sx >= largura || sy < 0 || sy >= altura) continue;
        saida[sy * largura + sx] = estado.montanha;
      }
    // a cidade abaixo do horizonte
    for (let y = horizonte + 1; y < altura; y++)
      for (let x = 0; x < largura; x++) saida[y * largura + x] = estado.montanha;
    if (estado.luzesCidade) {
      const r = aleatorio(31);
      for (let k = 0; k < largura; k++) {
        const x = Math.floor(r() * largura);
        const y = horizonte + 1 + Math.floor(r() * Math.max(1, altura - horizonte - 1));
        if (r() < 0.45 && y < altura) saida[y * largura + x] = k % 4 === 0 ? C : A;
      }
    }
  }
}
