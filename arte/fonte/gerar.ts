/**
 * Gera o OTF da fonte a partir dos glifos em pixel.
 * O contorno é a união dos pixels (arestas compartilhadas se cancelam),
 * então cada glifo vira poucos polígonos limpos — sem costura entre quadradinhos.
 */
import opentype from "opentype.js";
import { RESPIRO } from "./glifos";
import { glifos, type Glifo, LINHAS_EM } from "./texto";

const UNIDADE = 100; // unidades por pixel
const LINHA_BASE = 9; // linhas 0..8 ficam acima da linha de base

type Ponto = [number, number];

function tracar(g: Glifo): Ponto[][] {
  const arestas = new Map<string, [number, number, number, number]>();
  const adicionar = (ax: number, ay: number, bx: number, by: number) => {
    const inversa = `${bx},${by},${ax},${ay}`;
    if (arestas.has(inversa)) arestas.delete(inversa);
    else arestas.set(`${ax},${ay},${bx},${by}`, [ax, ay, bx, by]);
  };
  g.linhas.forEach((linha, r) => {
    for (let x = 0; x < linha.length; x++) {
      if (linha[x] !== "#") continue;
      const y0 = LINHA_BASE - 1 - r;
      const y1 = LINHA_BASE - r;
      // anti-horário (y para cima): contorno externo anti-horário, furos horários
      adicionar(x, y0, x + 1, y0);
      adicionar(x + 1, y0, x + 1, y1);
      adicionar(x + 1, y1, x, y1);
      adicionar(x, y1, x, y0);
    }
  });

  const porInicio = new Map<string, [number, number, number, number][]>();
  for (const a of arestas.values()) {
    const k = `${a[0]},${a[1]}`;
    const lista = porInicio.get(k) ?? [];
    lista.push(a);
    porInicio.set(k, lista);
  }

  const lacos: Ponto[][] = [];
  for (;;) {
    let inicio: [number, number, number, number] | undefined;
    for (const lista of porInicio.values()) {
      if (lista.length) {
        inicio = lista.pop();
        break;
      }
    }
    if (!inicio) break;
    const laco: Ponto[] = [[inicio[0], inicio[1]]];
    let atual = inicio;
    for (let guarda = 0; guarda < 10000; guarda++) {
      const fim: Ponto = [atual[2], atual[3]];
      if (fim[0] === laco[0][0] && fim[1] === laco[0][1]) break;
      laco.push(fim);
      const lista = porInicio.get(`${fim[0]},${fim[1]}`);
      const proximo = lista?.pop();
      if (!proximo) break;
      atual = proximo;
    }
    // remove pontos colineares
    const limpo = laco.filter((p, i) => {
      const a = laco[(i - 1 + laco.length) % laco.length];
      const c = laco[(i + 1) % laco.length];
      return (p[0] - a[0]) * (c[1] - p[1]) - (p[1] - a[1]) * (c[0] - p[0]) !== 0;
    });
    if (limpo.length >= 3) lacos.push(limpo);
  }
  return lacos;
}

export function gerarFonte(): ArrayBuffer {
  const lista: opentype.Glyph[] = [
    new opentype.Glyph({ name: ".notdef", unicode: 0, advanceWidth: 6 * UNIDADE, path: new opentype.Path() }),
  ];
  const mapa = glifos();
  for (const [ch, g] of mapa) {
    const path = new opentype.Path();
    for (const laco of tracar(g)) {
      laco.forEach(([x, y], i) => {
        if (i === 0) path.moveTo(x * UNIDADE, y * UNIDADE);
        else path.lineTo(x * UNIDADE, y * UNIDADE);
      });
      path.close();
    }
    const codigo = ch.codePointAt(0)!;
    lista.push(
      new opentype.Glyph({
        name: `uni${codigo.toString(16).toUpperCase().padStart(4, "0")}`,
        unicode: codigo,
        advanceWidth: (g.largura + RESPIRO) * UNIDADE,
        path,
      }),
    );
  }
  const fonte = new opentype.Font({
    familyName: "Ibituruna",
    styleName: "Regular",
    unitsPerEm: LINHAS_EM * UNIDADE,
    ascender: LINHA_BASE * UNIDADE,
    descender: -(LINHAS_EM - LINHA_BASE) * UNIDADE,
    description: "Fonte pixel do portfólio de Eduardo Henrique. Grade de 12px: use em 12, 24, 36 ou 48px.",
    glyphs: lista,
  });
  return fonte.toArrayBuffer();
}
