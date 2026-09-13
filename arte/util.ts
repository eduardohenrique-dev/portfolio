import { VAZIO } from "../src/arte/paleta";

/** Letra do desenho → índice da paleta. */
export const CORES_TEXTO: Record<string, number> = { F: 0, S: 1, L: 2, A: 3, V: 4, R: 5, C: 6, B: 7 };

/** Converte um desenho em texto num buffer de índices. */
export function desenhoParaIndices(desenho: readonly string[]): { largura: number; altura: number; dados: Uint8Array } {
  const altura = desenho.length;
  const largura = Math.max(...desenho.map((l) => l.length));
  const dados = new Uint8Array(largura * altura).fill(VAZIO);
  desenho.forEach((linha, y) => {
    for (let x = 0; x < linha.length; x++) {
      const ch = linha[x];
      if (ch === "." || ch === " ") continue;
      const i = CORES_TEXTO[ch];
      if (i === undefined) throw new Error(`letra '${ch}' fora da paleta`);
      dados[y * largura + x] = i;
    }
  });
  return { largura, altura, dados };
}
