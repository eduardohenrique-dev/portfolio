/**
 * Encoder PNG mínimo, sem dependência. Gera PNG INDEXADO (color type 3):
 * abre no Aseprite já em modo Indexed com a paleta do site, que é o fluxo
 * certo para quem for redesenhar os sprites.
 */
import { deflateSync } from "node:zlib";
import { VAZIO, type Rgb } from "../src/arte/paleta";

const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = TABELA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(tipo: string, dados: Buffer): Buffer {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

const ASSINATURA = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/**
 * @param indices um byte por pixel; VAZIO (255) vira transparente.
 * @param cores até 255 cores; o índice logo após a última vira o transparente.
 */
export function pngIndexado(largura: number, altura: number, indices: Uint8Array, cores: readonly Rgb[]): Buffer {
  const transparente = cores.length;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 3; // indexed
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const plte = Buffer.alloc((cores.length + 1) * 3);
  cores.forEach(([r, g, b], i) => {
    plte[i * 3] = r;
    plte[i * 3 + 1] = g;
    plte[i * 3 + 2] = b;
  });

  const trns = Buffer.alloc(cores.length + 1, 255);
  trns[transparente] = 0;

  const bruto = Buffer.alloc((largura + 1) * altura);
  for (let y = 0; y < altura; y++) {
    const linha = y * (largura + 1);
    bruto[linha] = 0; // filtro "None"
    for (let x = 0; x < largura; x++) {
      const v = indices[y * largura + x];
      bruto[linha + 1 + x] = v === VAZIO ? transparente : v;
    }
  }

  return Buffer.concat([
    ASSINATURA,
    chunk("IHDR", ihdr),
    chunk("PLTE", plte),
    chunk("tRNS", trns),
    chunk("IDAT", deflateSync(bruto, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Amplia por fator inteiro — só para prévias e para a OG image. */
export function ampliar(largura: number, altura: number, indices: Uint8Array, fator: number): Uint8Array {
  const saida = new Uint8Array(largura * fator * altura * fator);
  const lf = largura * fator;
  for (let y = 0; y < altura * fator; y++) {
    const oy = Math.floor(y / fator) * largura;
    for (let x = 0; x < lf; x++) saida[y * lf + x] = indices[oy + Math.floor(x / fator)];
  }
  return saida;
}
