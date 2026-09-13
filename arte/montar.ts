/**
 * Monta tudo que a arte gera:
 *  - public/arte/sprites.<hash>.png  folha única de sprites (PNG indexado, abre no Aseprite)
 *  - public/arte/luz.<hash>.png      mapas de luz da cena (níveis 0–7 como índice)
 *  - src/arte/atlas.gerado.ts        regiões e metadados
 *  - src/app/fontes/ibituruna.otf    fonte pixel
 *  - public/og.png, src/app/icon.png, src/app/apple-icon.png, cursores
 *
 * Uso: npm run arte
 */
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CEUS, desenharCeu } from "../src/arte/ceu";
import { comporIndices } from "../src/arte/compositor";
import { INDICE, PALETAS, VAZIO, type Rgb } from "../src/arte/paleta";
import { type CenaExportada, exportarCena } from "./cena/exportar";
import { CANECA, CONTROLE, GATO_DORMINDO, IBITURUNA, SUCULENTA, VAPOR } from "./cena/sprites";
import { gerarFonte } from "./fonte/gerar";
import { desenharTexto, medirTexto } from "./fonte/texto";
import { ampliar, pngIndexado } from "./png";
import { ICONES } from "./sprites/icones";
import {
  andarilho,
  caderno,
  cartucho,
  cursorMao,
  cursorSeta,
  favicon,
  fichario,
  iconeLua,
  iconePorDoSol,
  iconeSol,
  marco,
  postal,
  selo,
} from "./sprites/objetos";
import { Pincel } from "./sprites/pincel";
import { desenhoParaIndices } from "./util";

const RAIZ = join(import.meta.dirname, "..");
const PASTA_ARTE = join(RAIZ, "public", "arte");

interface Imagem {
  largura: number;
  altura: number;
  dados: Uint8Array;
}

function deDesenho(linhas: readonly string[]): Imagem {
  return desenhoParaIndices(linhas);
}

function empacotar(itens: [string, Imagem][], larguraMax: number) {
  const ordenados = [...itens].sort((a, b) => b[1].altura - a[1].altura || b[1].largura - a[1].largura);
  const regioes: Record<string, [number, number, number, number]> = {};
  let x = 0;
  let y = 0;
  let alturaLinha = 0;
  let largura = 0;
  for (const [nome, img] of ordenados) {
    if (x + img.largura > larguraMax) {
      x = 0;
      y += alturaLinha + 1;
      alturaLinha = 0;
    }
    regioes[nome] = [x, y, img.largura, img.altura];
    x += img.largura + 1;
    alturaLinha = Math.max(alturaLinha, img.altura);
    largura = Math.max(largura, x);
  }
  const altura = y + alturaLinha;
  return { regioes, largura, altura };
}

function folha(itens: [string, Imagem][], larguraMax: number, fundo: number) {
  const { regioes, largura, altura } = empacotar(itens, larguraMax);
  const dados = new Uint8Array(largura * altura).fill(fundo);
  for (const [nome, img] of itens) {
    const [rx, ry] = regioes[nome];
    for (let j = 0; j < img.altura; j++)
      for (let i = 0; i < img.largura; i++) {
        const v = img.dados[j * img.largura + i];
        if (v !== VAZIO) dados[(ry + j) * largura + rx + i] = v;
      }
  }
  return { regioes, largura, altura, dados };
}

/** Recorta um mapa de nível ao retângulo onde há valor > 0. */
function recortar(mapa: Uint8Array, largura: number, altura: number) {
  let x0 = largura;
  let y0 = altura;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < altura; y++)
    for (let x = 0; x < largura; x++)
      if (mapa[y * largura + x] > 0) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
  if (x1 < 0) return null;
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const dados = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) dados[y * w + x] = mapa[(y0 + y) * largura + x0 + x];
  return { dx: x0, dy: y0, img: { largura: w, altura: h, dados } };
}

function hash(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex").slice(0, 10);
}

function limparAntigos(prefixo: string) {
  mkdirSync(PASTA_ARTE, { recursive: true });
  for (const arquivo of readdirSync(PASTA_ARTE)) if (arquivo.startsWith(`${prefixo}.`) && arquivo.endsWith(".png")) rmSync(join(PASTA_ARTE, arquivo));
}

// ——— sprites ———
const itensSprite: [string, Imagem][] = [];
const itensLuz: [string, Imagem][] = [];
const cenas: Record<string, CenaExportada> = {};
const refsCena: Record<string, unknown> = {};

for (const composicao of ["larga", "alta"] as const) {
  const cena = exportarCena(composicao);
  cenas[composicao] = cena;
  const camadas = cena.camadas.map((camada, c) => {
    const nomeBase = `cena-${composicao}-${c}`;
    itensSprite.push([nomeBase, { largura: camada.largura, altura: camada.altura, dados: camada.base }]);
    const refMapa = (tipo: string, mapa: Uint8Array | undefined) => {
      if (!mapa) return null;
      const r = recortar(mapa, camada.largura, camada.altura);
      if (!r) return null;
      const nome = `${nomeBase}-${tipo}`;
      itensLuz.push([nome, r.img]);
      return { regiao: nome, dx: r.dx, dy: r.dy };
    };
    return {
      base: nomeBase,
      sol: camada.sol.map((m, v) => refMapa(`sol${v}`, m)),
      luz: refMapa("luz", camada.luz),
      emissivo: refMapa("emissivo", camada.emissivo),
      janela: refMapa("janela", camada.janela),
    };
  });
  refsCena[composicao] = { largura: cena.largura, altura: cena.altura, camadas, meta: cena.meta };
}

for (const [nome, linhas] of Object.entries(ICONES)) itensSprite.push([`icone-${nome}`, deDesenho(linhas)]);
itensSprite.push(["cartucho", cartucho()], ["fichario", fichario()], ["caderno", caderno()]);
andarilho().forEach((q, i) => itensSprite.push([`andarilho-${i}`, q]));
itensSprite.push(["marco", marco()], ["hud-sol", iconeSol()], ["hud-por-do-sol", iconePorDoSol()], ["hud-lua", iconeLua()]);
itensSprite.push(["postal", postal(IBITURUNA)], ["selo", selo(GATO_DORMINDO[0])]);
GATO_DORMINDO.forEach((q, i) => itensSprite.push([`gato-${i}`, deDesenho(q)]));
itensSprite.push(["caneca", deDesenho(CANECA)], ["suculenta", deDesenho(SUCULENTA)], ["controle", deDesenho(CONTROLE)]);
VAPOR.forEach((q, i) => itensSprite.push([`vapor-${i}`, deDesenho(q)]));
itensSprite.push(["ibituruna", deDesenho(IBITURUNA)]);

const sprites = folha(itensSprite, 1024, VAZIO);
const pngSprites = pngIndexado(sprites.largura, sprites.altura, sprites.dados, PALETAS.entardecer);
const hashSprites = hash(pngSprites);
limparAntigos("sprites");
writeFileSync(join(PASTA_ARTE, `sprites.${hashSprites}.png`), pngSprites);

const CINZAS: Rgb[] = Array.from({ length: 8 }, (_, i) => {
  const v = Math.round((i / 7) * 255);
  return [v, v, v] as Rgb;
});
const luz = folha(itensLuz, 1024, 0);
const pngLuz = pngIndexado(luz.largura, luz.altura, luz.dados, CINZAS);
const hashLuz = hash(pngLuz);
limparAntigos("luz");
writeFileSync(join(PASTA_ARTE, `luz.${hashLuz}.png`), pngLuz);

// ——— cursores ———
mkdirSync(join(RAIZ, "public", "cursores"), { recursive: true });
for (const [nome, p] of [
  ["seta", cursorSeta()],
  ["mao", cursorMao()],
] as const) {
  writeFileSync(join(RAIZ, "public", "cursores", `${nome}.png`), pngIndexado(24, 24, ampliar(12, 12, p.dados, 2), PALETAS.noite));
}

// ——— ícones do app ———
const fav = favicon();
writeFileSync(join(RAIZ, "src", "app", "icon.png"), pngIndexado(32, 32, ampliar(16, 16, fav.dados, 2), PALETAS.noite));
const apple = new Pincel(180, 180);
apple.ret(0, 0, 180, 180, INDICE.fundo);
const favGrande = ampliar(16, 16, fav.dados, 11);
for (let j = 0; j < 176; j++) for (let i = 0; i < 176; i++) apple.px(2 + i, 2 + j, favGrande[j * 176 + i]);
writeFileSync(join(RAIZ, "src", "app", "apple-icon.png"), pngIndexado(180, 180, apple.dados, PALETAS.noite));

// ——— fonte ———
mkdirSync(join(RAIZ, "src", "app", "fontes"), { recursive: true });
writeFileSync(join(RAIZ, "src", "app", "fontes", "ibituruna.otf"), Buffer.from(gerarFonte()));

// ——— OG image (1200×630) ———
{
  const W = 1200;
  const H = 630;
  const og = new Uint8Array(W * H).fill(INDICE.fundo);
  const cena = cenas.larga;
  const { meta } = cena;
  const ceuRet = new Uint8Array(meta.ceu.w * meta.ceu.h);
  desenharCeu(ceuRet, meta.ceu.w, meta.ceu.h, CEUS[1], deDesenho(IBITURUNA), { horizonte: meta.horizonte, montanhaX: meta.montanhaX });
  const ceu = new Uint8Array(cena.largura * cena.altura);
  for (let y = 0; y < meta.ceu.h; y++)
    for (let x = 0; x < meta.ceu.w; x++) ceu[(meta.ceu.y + y) * cena.largura + meta.ceu.x + x] = ceuRet[y * meta.ceu.w + x];
  const quadro = new Uint8Array(cena.largura * cena.altura).fill(VAZIO);
  const tmp = new Uint8Array(cena.largura * cena.altura);
  for (const camada of cena.camadas) {
    comporIndices(camada, { escuridao: 0, sol: 1, solVariante: 1, luminaria: 0 }, tmp, ceu);
    for (let p = 0; p < tmp.length; p++) if (tmp[p] !== VAZIO) quadro[p] = tmp[p];
  }
  const escala = 2;
  const grande = ampliar(cena.largura, cena.altura, quadro, escala);
  const ox = W - cena.largura * escala - 24;
  const oy = Math.round((H - cena.altura * escala) / 2);
  for (let j = 0; j < cena.altura * escala; j++)
    for (let i = 0; i < cena.largura * escala; i++) {
      const v = grande[j * cena.largura * escala + i];
      if (v !== VAZIO) og[(oy + j) * W + ox + i] = v;
    }
  const margem = 72;
  desenharTexto(og, W, H, "Eduardo", margem, 150, INDICE.creme, 8);
  desenharTexto(og, W, H, "Henrique", margem, 150 + 12 * 8, INDICE.creme, 8);
  desenharTexto(og, W, H, "Full stack e UX/UI", margem, 380, INDICE.ambar, 3);
  desenharTexto(og, W, H, "Governador Valadares, MG", margem, 380 + 12 * 3 + 6, INDICE.bruma, 3);
  if (medirTexto("Henrique") * 8 + margem > ox) console.warn("OG: texto encosta na cena");
  writeFileSync(join(RAIZ, "public", "og.png"), pngIndexado(W, H, og, PALETAS.entardecer));
}

// ——— atlas ———
const atlas = {
  sprites: { arquivo: `/arte/sprites.${hashSprites}.png`, largura: sprites.largura, altura: sprites.altura },
  luz: { arquivo: `/arte/luz.${hashLuz}.png`, largura: luz.largura, altura: luz.altura },
  regioes: { ...sprites.regioes },
  regioesLuz: { ...luz.regioes },
  cenas: refsCena,
};
writeFileSync(
  join(RAIZ, "src", "arte", "atlas.gerado.ts"),
  `// Gerado por arte/montar.ts — não editar à mão.\nexport const ATLAS = ${JSON.stringify(atlas)} as const;\n`,
);

console.log(
  `sprites ${sprites.largura}×${sprites.altura} (${(pngSprites.length / 1024).toFixed(1)} KB) · luz ${luz.largura}×${luz.altura} (${(pngLuz.length / 1024).toFixed(1)} KB)`,
);
