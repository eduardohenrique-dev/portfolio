/**
 * Carrega a folha de sprites e os mapas de luz uma única vez e converte para índices da paleta.
 * O PNG é indexado; o navegador entrega RGBA, então cada cor volta para o índice mais próximo.
 */
import { ATLAS } from "./atlas.gerado";
import type { CamadaCena } from "./compositor";
import { PALETAS, VAZIO } from "./paleta";

export interface Folha {
  largura: number;
  altura: number;
  dados: Uint8Array;
}

export interface Folhas {
  sprites: Folha;
  luz: Folha;
}

export type NomeRegiao = keyof typeof ATLAS.regioes;
export type Composicao = keyof typeof ATLAS.cenas;

let promessa: Promise<Folhas> | null = null;

async function decodificar(url: string): Promise<ImageData> {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`não carregou ${url}`);
  const bitmap = await createImageBitmap(await resposta.blob(), {
    colorSpaceConversion: "none",
    premultiplyAlpha: "none",
  });
  const tela = document.createElement("canvas");
  tela.width = bitmap.width;
  tela.height = bitmap.height;
  const ctx = tela.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas 2d indisponível");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, tela.width, tela.height);
}

function paraIndices(img: ImageData): Uint8Array {
  const referencia = PALETAS.entardecer;
  const cache = new Map<number, number>();
  const saida = new Uint8Array(img.width * img.height);
  const d = img.data;
  for (let p = 0, i = 0; p < saida.length; p++, i += 4) {
    if (d[i + 3] < 128) {
      saida[p] = VAZIO;
      continue;
    }
    const chave = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    let indice = cache.get(chave);
    if (indice === undefined) {
      let menor = Infinity;
      indice = 0;
      for (let k = 0; k < referencia.length; k++) {
        const [r, g, b] = referencia[k];
        const dist = (d[i] - r) ** 2 + (d[i + 1] - g) ** 2 + (d[i + 2] - b) ** 2;
        if (dist < menor) {
          menor = dist;
          indice = k;
        }
      }
      cache.set(chave, indice);
    }
    saida[p] = indice;
  }
  return saida;
}

function paraNiveis(img: ImageData): Uint8Array {
  const saida = new Uint8Array(img.width * img.height);
  for (let p = 0, i = 0; p < saida.length; p++, i += 4) saida[p] = Math.round((img.data[i] / 255) * 7);
  return saida;
}

export function carregarFolhas(): Promise<Folhas> {
  if (!promessa) {
    promessa = Promise.all([decodificar(ATLAS.sprites.arquivo), decodificar(ATLAS.luz.arquivo)]).then(([s, l]) => ({
      sprites: { largura: s.width, altura: s.height, dados: paraIndices(s) },
      luz: { largura: l.width, altura: l.height, dados: paraNiveis(l) },
    }));
    promessa.catch(() => {
      promessa = null;
    });
  }
  return promessa;
}

export function recortar(folha: Folha, [x, y, w, h]: readonly number[]): Uint8Array {
  const saida = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) {
    const origem = (y + j) * folha.largura + x;
    saida.set(folha.dados.subarray(origem, origem + w), j * w);
  }
  return saida;
}

type RefMapa = { regiao: string; dx: number; dy: number } | null;

function expandirMapa(luz: Folha, ref: RefMapa, largura: number, altura: number): Uint8Array {
  const saida = new Uint8Array(largura * altura);
  if (!ref) return saida;
  const regiao = (ATLAS.regioesLuz as Record<string, readonly number[]>)[ref.regiao];
  const [, , w, h] = regiao;
  const recorte = recortar(luz, regiao);
  for (let j = 0; j < h; j++) saida.set(recorte.subarray(j * w, j * w + w), (ref.dy + j) * largura + ref.dx);
  return saida;
}

const cacheCenas = new Map<Composicao, CamadaCena[]>();

export function camadasDaCena(folhas: Folhas, composicao: Composicao): CamadaCena[] {
  const pronto = cacheCenas.get(composicao);
  if (pronto) return pronto;
  const cena = ATLAS.cenas[composicao];
  const camadas = cena.camadas.map((c) => {
    const base = recortar(folhas.sprites, ATLAS.regioes[c.base as NomeRegiao]);
    return {
      largura: cena.largura,
      altura: cena.altura,
      base,
      sol: c.sol.map((ref) => expandirMapa(folhas.luz, ref as RefMapa, cena.largura, cena.altura)),
      luz: expandirMapa(folhas.luz, c.luz as RefMapa, cena.largura, cena.altura),
      emissivo: expandirMapa(folhas.luz, c.emissivo as RefMapa, cena.largura, cena.altura),
      janela: c.janela ? expandirMapa(folhas.luz, c.janela as RefMapa, cena.largura, cena.altura) : undefined,
    } satisfies CamadaCena;
  });
  cacheCenas.set(composicao, camadas);
  return camadas;
}

/** Cores RGBA empacotadas (little-endian) de cada paleta, para escrever direto no ImageData. */
export const RGBA: Uint32Array[] = (["tarde", "entardecer", "anoitecer", "noite"] as const).map((h) => {
  const tabela = new Uint32Array(256);
  PALETAS[h].forEach(([r, g, b], i) => {
    tabela[i] = (255 << 24) | (b << 16) | (g << 8) | r;
  });
  tabela[VAZIO] = 0;
  return tabela;
});
