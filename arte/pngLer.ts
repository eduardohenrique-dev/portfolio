/**
 * Leitor PNG mínimo (8 bits: indexado, RGB ou RGBA) para importar sprites exportados do Aseprite
 * (ou qualquer PNG que precise virar índices da paleta).
 */
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { VAZIO, type Rgb } from "../src/arte/paleta";

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

/** Devolve os pixels em RGBA, 4 bytes por pixel. */
export function lerPngRgba(caminho: string): { largura: number; altura: number; rgba: Uint8Array } {
  const buf = readFileSync(caminho);
  let pos = 8;
  let largura = 0;
  let altura = 0;
  let profundidade = 0;
  let tipoCor = 0;
  let paleta: Rgb[] = [];
  let alfaPaleta: number[] = [];
  const partes: Buffer[] = [];
  while (pos < buf.length) {
    const tamanho = buf.readUInt32BE(pos);
    const tipo = buf.toString("ascii", pos + 4, pos + 8);
    const dados = buf.subarray(pos + 8, pos + 8 + tamanho);
    if (tipo === "IHDR") {
      largura = dados.readUInt32BE(0);
      altura = dados.readUInt32BE(4);
      profundidade = dados[8];
      tipoCor = dados[9];
    } else if (tipo === "PLTE") {
      paleta = [];
      for (let i = 0; i < dados.length; i += 3) paleta.push([dados[i], dados[i + 1], dados[i + 2]]);
    } else if (tipo === "tRNS") {
      alfaPaleta = [...dados];
    } else if (tipo === "IDAT") {
      partes.push(dados);
    }
    pos += 12 + tamanho;
  }
  if (profundidade !== 8) throw new Error(`${caminho}: exporte com 8 bits por canal (achei ${profundidade})`);
  const canais = tipoCor === 3 ? 1 : tipoCor === 2 ? 3 : tipoCor === 6 ? 4 : 0;
  if (!canais) throw new Error(`${caminho}: tipo de cor ${tipoCor} não suportado (use Indexed ou RGBA)`);

  const bruto = inflateSync(Buffer.concat(partes));
  const linha = largura * canais;
  const pixels = new Uint8Array(altura * linha);
  for (let y = 0; y < altura; y++) {
    const filtro = bruto[y * (linha + 1)];
    const origem = y * (linha + 1) + 1;
    for (let x = 0; x < linha; x++) {
      const bruto_x = bruto[origem + x];
      const a = x >= canais ? pixels[y * linha + x - canais] : 0;
      const b = y > 0 ? pixels[(y - 1) * linha + x] : 0;
      const c = x >= canais && y > 0 ? pixels[(y - 1) * linha + x - canais] : 0;
      const valor = filtro === 0 ? bruto_x : filtro === 1 ? bruto_x + a : filtro === 2 ? bruto_x + b : filtro === 3 ? bruto_x + ((a + b) >> 1) : bruto_x + paeth(a, b, c);
      pixels[y * linha + x] = valor & 255;
    }
  }

  const rgba = new Uint8Array(largura * altura * 4);
  for (let p = 0; p < largura * altura; p++) {
    if (tipoCor === 3) {
      const cor = paleta[pixels[p]] ?? [0, 0, 0];
      rgba.set([cor[0], cor[1], cor[2], alfaPaleta[pixels[p]] ?? 255], p * 4);
    } else {
      const o = p * canais;
      rgba.set([pixels[o], pixels[o + 1], pixels[o + 2], canais === 4 ? pixels[o + 3] : 255], p * 4);
    }
  }
  return { largura, altura, rgba };
}

function criarMaisProximo(referencia: readonly Rgb[]) {
  const cache = new Map<number, number>();
  return (r: number, g: number, bl: number) => {
    const chave = (r << 16) | (g << 8) | bl;
    const pronto = cache.get(chave);
    if (pronto !== undefined) return pronto;
    let melhor = 0;
    let menor = Infinity;
    referencia.forEach(([rr, gg, bb], i) => {
      const d = (r - rr) ** 2 + (g - gg) ** 2 + (bl - bb) ** 2;
      if (d < menor) {
        menor = d;
        melhor = i;
      }
    });
    cache.set(chave, melhor);
    return melhor;
  };
}

/** Cada pixel vira o índice mais próximo da paleta de referência (transparente vira VAZIO). */
export function lerPngIndices(caminho: string, referencia: readonly Rgb[]): { largura: number; altura: number; dados: Uint8Array } {
  const { largura, altura, rgba } = lerPngRgba(caminho);
  const maisProximo = criarMaisProximo(referencia);
  const dados = new Uint8Array(largura * altura);
  for (let p = 0; p < dados.length; p++) {
    const o = p * 4;
    dados[p] = rgba[o + 3] < 128 ? VAZIO : maisProximo(rgba[o], rgba[o + 1], rgba[o + 2]);
  }
  return { largura, altura, dados };
}
