/**
 * Compositor da cena — código puro, roda no build (prévias, OG image) e no navegador.
 *
 * Cada camada tem uma arte base em 8 índices e mapas de nível 0–7:
 *  - sol[v]: onde a luz da janela bate (uma variante por posição do sol)
 *  - luz: alcance da luminária
 *  - emissivo: o que não escurece à noite (tela, lâmpada)
 *
 * Por pixel: exposição = −escuridão + sol + luminária. A parte fracionária
 * vira dithering Bayer; a inteira anda passos na rampa CLAREAR/ESCURECER.
 * Resultado: luz com falloff pontilhado e sempre 8 cores.
 */
import { BAYER4, CLAREAR, ESCURECER, VAZIO } from "./paleta";

export interface CamadaCena {
  largura: number;
  altura: number;
  base: Uint8Array;
  sol: Uint8Array[];
  luz: Uint8Array;
  emissivo: Uint8Array;
  /** 1 onde o pixel é vão de janela e recebe o céu */
  janela?: Uint8Array;
}

export interface EstadoLuz {
  /** 0 = dia, 2 = noite fechada */
  escuridao: number;
  /** força do sol, 0..1 */
  sol: number;
  /** variante do mapa de sol (posição do sol no céu) */
  solVariante: number;
  /** luminária, 0..1 */
  luminaria: number;
}

const PESO_SOL = 1;
const PESO_LUMINARIA = 3;

export function comporIndices(
  camada: CamadaCena,
  estado: EstadoLuz,
  saida: Uint8Array,
  ceu: Uint8Array | null = null,
  desloc = 0,
): void {
  const { largura, altura, base, luz, emissivo, janela } = camada;
  // variante fracionária = a mancha de sol "anda" entre as duas posições
  const ultima = camada.sol.length - 1;
  const v0 = Math.min(ultima, Math.max(0, Math.floor(estado.solVariante)));
  const v1 = Math.min(ultima, v0 + 1);
  const fv = Math.min(1, Math.max(0, estado.solVariante - v0));
  const solA = camada.sol[v0];
  const solB = camada.sol[v1];
  const kSol = (estado.sol * PESO_SOL) / 7;
  const kLuz = (estado.luminaria * PESO_LUMINARIA) / 7;
  for (let y = 0; y < altura; y++) {
    const linhaBayer = BAYER4[(y + desloc) & 3];
    for (let x = 0; x < largura; x++) {
      const p = y * largura + x;
      let i = base[p];
      if (i === VAZIO) {
        saida[p] = janela && ceu && janela[p] ? ceu[p] : VAZIO;
        continue;
      }
      const nivelSol = solA ? solA[p] + ((solB ? solB[p] : 0) - solA[p]) * fv : 0;
      let e = -estado.escuridao + nivelSol * kSol + luz[p] * kLuz;
      const emi = emissivo[p];
      if (emi === 7) {
        if (e < 0) e = 0;
      } else if (emi === 4) {
        // lâmpada: acesa não escurece; apagada fica um passo abaixo
        e = estado.luminaria >= 0.5 ? Math.max(e, 1) : e - 1;
      }
      let passos = Math.floor(e + (linhaBayer[(x + desloc) & 3] + 0.5) / 16);
      while (passos > 0) {
        i = CLAREAR[i];
        passos--;
      }
      while (passos < 0) {
        i = ESCURECER[i];
        passos++;
      }
      saida[p] = i;
    }
  }
}

/**
 * Mistura dois conjuntos de cores por pixel com limiar Bayer:
 * durante a troca de horário, cada pixel escolhe a paleta antiga ou a nova —
 * nunca uma cor intermediária.
 */
export function limiarBayer(x: number, y: number): number {
  return (BAYER4[y & 3][x & 3] + 0.5) / 16;
}
