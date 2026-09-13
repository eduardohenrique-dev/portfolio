/**
 * Gera prévias ampliadas da cena nos quatro horários, para revisão visual.
 * Uso: npx tsx arte/previa.ts <pasta-saida>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CEUS, desenharCeu } from "../src/arte/ceu";
import { comporIndices, type EstadoLuz } from "../src/arte/compositor";
import { HORARIOS, PALETAS, VAZIO } from "../src/arte/paleta";
import { exportarCena } from "./cena/exportar";
import { IBITURUNA } from "./cena/sprites";
import { ampliar, pngIndexado } from "./png";
import { desenhoParaIndices } from "./util";

const pasta = process.argv[2] ?? "previa";
const fator = Number(process.argv[3] ?? 3);
mkdirSync(pasta, { recursive: true });

export const ESTADOS: EstadoLuz[] = [
  { escuridao: 0, sol: 1, solVariante: 0, luminaria: 0 },
  { escuridao: 0, sol: 1, solVariante: 1, luminaria: 0 },
  { escuridao: 1, sol: 0, solVariante: 1, luminaria: 1 },
  { escuridao: 1, sol: 0, solVariante: 1, luminaria: 1 },
];

const montanha = desenhoParaIndices(IBITURUNA);

for (const composicao of ["larga", "alta"] as const) {
  const { largura, altura, camadas, meta } = exportarCena(composicao);
  HORARIOS.forEach((horario, h) => {
    const ceuRet = new Uint8Array(meta.ceu.w * meta.ceu.h);
    desenharCeu(ceuRet, meta.ceu.w, meta.ceu.h, CEUS[h], montanha, { horizonte: meta.horizonte, montanhaX: meta.montanhaX });
    const ceu = new Uint8Array(largura * altura);
    for (let y = 0; y < meta.ceu.h; y++)
      for (let x = 0; x < meta.ceu.w; x++) ceu[(meta.ceu.y + y) * largura + meta.ceu.x + x] = ceuRet[y * meta.ceu.w + x];

    const quadro = new Uint8Array(largura * altura).fill(VAZIO);
    const tmp = new Uint8Array(largura * altura);
    for (const camada of camadas) {
      comporIndices(camada, ESTADOS[h], tmp, ceu);
      for (let p = 0; p < tmp.length; p++) if (tmp[p] !== VAZIO) quadro[p] = tmp[p];
    }
    const png = pngIndexado(largura * fator, altura * fator, ampliar(largura, altura, quadro, fator), PALETAS[horario]);
    writeFileSync(join(pasta, `cena-${composicao}-${h}-${horario}.png`), png);
  });
}
console.log(`prévias em ${pasta}`);
