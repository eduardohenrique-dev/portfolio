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
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CEUS, desenharCeu } from "../src/arte/ceu";
import { comporIndices } from "../src/arte/compositor";
import { HORARIOS, INDICE, PALETAS, VAZIO, type Rgb } from "../src/arte/paleta";
import { capturaEmPixelArt, lerPngIndices } from "./pngLer";
import { type CenaExportada, exportarCena } from "./cena/exportar";
import { CANECA, CONTROLE, CORES, GATO_DORMINDO, IBITURUNA, SUCULENTA, VAPOR } from "./cena/sprites";
import { gerarFonte } from "./fonte/gerar";
import { desenharTexto, medirTexto } from "./fonte/texto";
import { ampliar, pngIndexado } from "./png";
import { CURSORES } from "./sprites/cursores";
import { ICONES } from "./sprites/icones";
import {
  andarilho,
  caixaDeck,
  caixaLoja,
  cartucho,
  cartuchoDemo,
  consoleDemos,
  FENDA,
  favicon,
  fichario,
  guia,
  iconeLua,
  iconePorDoSol,
  iconeSol,
  postal,
  selo,
  TELA,
  televisao,
} from "./sprites/objetos";
import { Pincel } from "./sprites/pincel";
import { desenhoParaIndices } from "./util";

const RAIZ = join(import.meta.dirname, "..");
const PASTA_ARTE = join(RAIZ, "public", "arte");
const NOMES_INDICE = Object.keys(INDICE);

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
itensSprite.push(["cartucho", cartucho()], ["fichario", fichario()]);
itensSprite.push(["guia", guia()], ["caixa-deck", caixaDeck()], ["caixa-loja", caixaLoja()]);
// console das demos: TV, console apagado/aceso, cartuchos e as telas (capturas reais reduzidas a pixel art)
{
  const { F, A: Am, R: Ro, C: Cr, B: Br } = CORES;
  itensSprite.push(["televisao", televisao()], ["console-apagado", consoleDemos(false)], ["console-aceso", consoleDemos(true)]);
  itensSprite.push(
    ["cartucho-scrims", cartuchoDemo("VS", Br, Am, F)],
    ["cartucho-hq", cartuchoDemo("HQ", Ro, Cr, F)],
    ["cartucho-dgames", cartuchoDemo("D", Am, Ro, Cr)],
  );
  for (const nome of ["scrims", "hq", "dgames"])
    itensSprite.push([`tela-${nome}`, capturaEmPixelArt(join(RAIZ, "arte", "telas", `${nome}.png`), TELA.largura, TELA.altura, PALETAS.entardecer, 40)]);
}
itensSprite.push(["andarilho-0", andarilho()[0]]);
itensSprite.push(["hud-sol", iconeSol()], ["hud-por-do-sol", iconePorDoSol()], ["hud-lua", iconeLua()]);
itensSprite.push(["postal", postal(IBITURUNA)], ["selo", selo(GATO_DORMINDO[0])]);
GATO_DORMINDO.forEach((q, i) => itensSprite.push([`gato-${i}`, deDesenho(q)]));
itensSprite.push(["caneca", deDesenho(CANECA)], ["suculenta", deDesenho(SUCULENTA)], ["controle", deDesenho(CONTROLE)]);
VAPOR.forEach((q, i) => itensSprite.push([`vapor-${i}`, deDesenho(q)]));
itensSprite.push(["ibituruna", deDesenho(IBITURUNA)]);
for (const [nome, cursor] of Object.entries(CURSORES)) itensSprite.push([`cursor-${nome}`, deDesenho(cursor.desenho)]);

// ——— fluxo do Aseprite ———
// referencia/<nome>.png: o sprite gerado em código, no tamanho exato, para redesenhar por cima.
// <nome>.png: se existir, substitui o sprite gerado (mesmo tamanho, paleta do entardecer).
const PASTA_ASEPRITE = join(RAIZ, "arte", "aseprite");
mkdirSync(join(PASTA_ASEPRITE, "referencia"), { recursive: true });
for (let i = 0; i < itensSprite.length; i++) {
  const [nome, img] = itensSprite[i];
  writeFileSync(join(PASTA_ASEPRITE, "referencia", `${nome}.png`), pngIndexado(img.largura, img.altura, img.dados, PALETAS.entardecer));
  const desenhado = join(PASTA_ASEPRITE, `${nome}.png`);
  if (!existsSync(desenhado)) continue;
  const novo = lerPngIndices(desenhado, PALETAS.entardecer);
  if (novo.largura !== img.largura || novo.altura !== img.altura) {
    console.warn(`aseprite: ${nome}.png tem ${novo.largura}×${novo.altura}, esperado ${img.largura}×${img.altura} — ignorado`);
    continue;
  }
  itensSprite[i] = [nome, novo];
  console.log(`aseprite: usando ${nome}.png desenhado à mão`);
}
for (const horario of HORARIOS) {
  const linhas = PALETAS[horario].map(([r, g, b], i) => `${String(r).padStart(3)} ${String(g).padStart(3)} ${String(b).padStart(3)}\t${NOMES_INDICE[i]}`);
  writeFileSync(join(PASTA_ASEPRITE, `paleta-${horario}.gpl`), `GIMP Palette\nName: Portfólio ${horario}\nColumns: 8\n#\n${linhas.join("\n")}\n`);
}

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

// ——— cursores do sistema ———
// Reserva para quando o cursor em pixel art não liga (toque, alto contraste, preferência do visitante):
// os mesmos desenhos da folha (inclusive os do Aseprite), ampliados 2× em PNG.
mkdirSync(join(RAIZ, "public", "cursores"), { recursive: true });
const spritesPorNome = new Map(itensSprite);
for (const nome of Object.keys(CURSORES)) {
  const img = spritesPorNome.get(`cursor-${nome}`);
  if (!img) continue;
  const png = pngIndexado(img.largura * 2, img.altura * 2, ampliar(img.largura, img.altura, img.dados, 2), PALETAS.noite);
  writeFileSync(join(RAIZ, "public", "cursores", `${nome}.png`), png);
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
  console: { tela: TELA, fenda: FENDA },
  cursores: Object.fromEntries(Object.entries(CURSORES).map(([nome, c]) => [nome, { regiao: `cursor-${nome}`, ponta: c.ponta }])),
};
writeFileSync(
  join(RAIZ, "src", "arte", "atlas.gerado.ts"),
  `// Gerado por arte/montar.ts — não editar à mão.\nexport const ATLAS = ${JSON.stringify(atlas)} as const;\n`,
);

console.log(
  `sprites ${sprites.largura}×${sprites.altura} (${(pngSprites.length / 1024).toFixed(1)} KB) · luz ${luz.largura}×${luz.altura} (${(pngLuz.length / 1024).toFixed(1)} KB)`,
);
