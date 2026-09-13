/**
 * Sprites 2D pequenos da cena. Letras = papéis da paleta:
 * F fundo · S superfície · L linha · A âmbar · V sálvia (verde) · R rosa · C creme · B bruma · . vazio
 */
export const CORES = { F: 0, S: 1, L: 2, A: 3, V: 4, R: 5, C: 6, B: 7 } as const;

export const GATO_DORMINDO = [
  // quadro 0 (inspira)
  [
    "................",
    "..F...F.........",
    ".FSF.FSF........",
    ".FSSFSSF........",
    "FSSSSSSSFFFFFF..",
    "FSLSSSLSSSSSSSF.",
    "FSSSCSSSSSSSSSSF",
    ".FSCCCSSSSSSSLSF",
    "..FFFFFFFFFFFFF.",
  ],
  // quadro 1 (expira: as costas baixam 1px)
  [
    "................",
    "..F...F.........",
    ".FSF.FSF........",
    ".FSSFSSF........",
    "FSSSSSSSF.......",
    "FSLSSSLSSFFFFFF.",
    "FSSSCSSSSSSSSSSF",
    ".FSCCCSSSSSSSLSF",
    "..FFFFFFFFFFFFF.",
  ],
] as const;

export const CANECA = [
  ".CCCC...",
  "CFFFFC..",
  "CBBBBCB.",
  "CCCCCB.B",
  "CCCCCBB.",
  "BCCCCB..",
  ".BBBB...",
] as const;

export const VAPOR = [
  ["..B.", ".B..", "..B.", ".B.."],
  [".B..", "..B.", "..B.", ".B.."],
  ["....", ".B..", "..B.", "..B."],
] as const;

/** Luminária articulada, base no centro-inferior; C = lâmpada (emissiva). */
export const LUMINARIA = [
  "......LLLL..",
  ".....LRRRRL.",
  "....LRRRRRRL",
  "....LRAAAARL",
  ".....LCCCCL.",
  "....LB......",
  "...LB.......",
  "..LB........",
  ".LB.........",
  ".LB.........",
  "..LB........",
  "...LB.......",
  "....LB......",
  ".....LB.....",
  "......LB....",
  ".....SBBS...",
  "....SSSSSSS.",
  "....LLLLLLL.",
] as const;

export const PLANTA_GRANDE = [
  "......V.........",
  ".....VCV...V....",
  "..V..VVV..VCV...",
  ".VCV.VVV..VVV.V.",
  ".VVV..VV.VVV.VCV",
  "..VVV.VVVVV..VVV",
  "V..VVVVVVV..VVV.",
  "VV..VVVVVV.VVV..",
  ".VVV.VVVVVVVV...",
  "..VVVVVVVVVV..V.",
  "V...VVVVVVV..VV.",
  "VVV..VVVVVVVVV..",
  ".VVVV.VVVVV.....",
  "...VVVVVVV......",
  ".....VVVV.......",
] as const;

export const SUCULENTA = [
  "..V.V..",
  ".VCVCV.",
  "VVVVVVV",
  ".RRRRR.",
  ".RRRRR.",
  "..RRR..",
] as const;

export const CONTROLE = [
  ".SSSSSSS.",
  "SBSSSSCSS",
  "SSBSSCSCS",
  "SBSSSSCSS",
  ".SS...SS.",
] as const;

export const FONE = [
  "..LLLLL..",
  ".L.....L.",
  "L.......L",
  "RS.....SR",
  "RS.....SR",
] as const;

export const PUFE = [
  "......LLLLLL......",
  "....LLAAAAAALL....",
  "...LAACCCAAAAAL...",
  "..LACCCCCAAAAAAL..",
  ".LAACCCAAAAAAAAAL.",
  ".LAAAAAAAAAAAAARL.",
  "LAAAAAAAAAAAAAARRL",
  "LRAAAAAAAAAAAARRRL",
  "LLRRAAAAAAAARRRRLL",
  ".LLLRRRRRRRRRRLLL.",
  "...LLLLLLLLLLLL...",
] as const;

/** Silhueta do Pico da Ibituruna, de Governador Valadares, vista da janela. */
export const IBITURUNA = [
  "..............................LL..............",
  "............................LLLLL.............",
  "...........................LLLLLLLL...........",
  "..........................LLLLLLLLLL..........",
  ".........................LLLLLLLLLLLLL........",
  "......................LLLLLLLLLLLLLLLLL.......",
  "...................LLLLLLLLLLLLLLLLLLLLLL.....",
  "..............LLLLLLLLLLLLLLLLLLLLLLLLLLLLL...",
  "..........LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL.",
  "......LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL",
  "..LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL",
  "LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL",
] as const;
