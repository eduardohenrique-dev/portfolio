# Arte

## Caminho escolhido

Nada de pack de terceiros. A arte atual é **desenhada em código** e o build gera uma folha única de
sprites (`public/arte/sprites.<hash>.png`, PNG indexado, ~10 KB). Junto vai o caminho para trocar
qualquer sprite por arte feita à mão no Aseprite, sem mexer em código:

1. Abra `arte/aseprite/referencia/<nome>.png` — é o sprite atual, no tamanho exato.
2. Carregue a paleta `arte/aseprite/paleta-entardecer.gpl` e trabalhe em modo **Indexed**.
3. Redesenhe e exporte como `arte/aseprite/<nome>.png` (mesmo tamanho, PNG 8 bits, fundo transparente).
4. Rode `npm run arte`. O build usa o seu arquivo no lugar do gerado e avisa no terminal.

A paleta de referência é a do **entardecer**: o site troca os valores dos índices sozinho nos
outros horários. Qualquer cor fora da paleta vira a cor mais próxima dela.

## Paleta

8 índices, sempre na mesma ordem. Os valores mudam com o horário.

| Índice | Papel | Tarde | Entardecer | Anoitecer | Noite |
|---|---|---|---|---|---|
| 0 | fundo | `#2A2030` | `#241C2E` | `#1E1A2A` | `#1A1826` |
| 1 | superfície | `#3A2C3D` | `#33283B` | `#2C2539` | `#262336` |
| 2 | linha | `#5A4557` | `#503F59` | `#473D56` | `#3D3752` |
| 3 | âmbar (luz) | `#F0B45C` | `#EBA75A` | `#E7A858` | `#E3A857` |
| 4 | sálvia | `#9AAE7E` | `#8CA582` | `#83A183` | `#7E9E82` |
| 5 | rosa | `#DB8C7E` | `#D48088` | `#CE7D86` | `#C97B84` |
| 6 | creme | `#F6E8D0` | `#F3E7D2` | `#F0E5D2` | `#EFE4D2` |
| 7 | bruma | `#B3A1AB` | `#AA99AE` | `#A094AA` | `#978EA5` |

A noite é a paleta do briefing com um ajuste: a bruma subiu de `#8B8299` para `#978EA5`, porque a
original dava 4,18:1 sobre a superfície (texto secundário precisa de 4,5:1). A tarde puxa os escuros
para o ameixa e as luzes para o dourado; o anoitecer esfria tudo. `npm run arte:contraste` confere os
pares nos quatro horários.

**Luz é rampa, não mistura.** Clarear um pixel anda um passo em `0→1→2→5→3→6` (e `4→3`, `7→6`);
escurecer anda o caminho de volta. A cena nunca tem mais de 8 cores.

## Regras para desenhar

- Sem antialias, sem cor fora da paleta, sem semitransparência.
- Contorno de 1px só na silhueta de fora do diorama; dentro, a separação é por valor.
- A luz do dia entra pela janela, à esquerda; a da noite vem da luminária.
- Transição entre duas cores: pontilhado (Bayer 4×4), nunca degradê.
- Isométrico 2:1: cada passo na diagonal anda 2px na horizontal e 1px na vertical.

## Lista de sprites

| Nome | Tamanho | O que é | Onde aparece |
|---|---|---|---|
| `cena-larga-0` · `-1` · `-2` | 320×200 | quarto (desktop): 0 estrutura e janela, 1 móveis, 2 frente (planta, pufe) | abertura |
| `cena-alta-0` · `-1` · `-2` | 180×200 | quarto (mobile e contato), paredes altas, janela grande | abertura no celular, contato |
| `cartucho` | 30×36 | cartucho com VS no rótulo | EINERD Scrims |
| `fichario` | 26×42 | fichário rosa com HQ | EINERD HQ |
| `caderno` | 30×40 | caderno espiral com COACH e fitinha | LoL Coach Pilot |
| `andarilho-0` … `-4` | 12×18 | personagem: parado, passo, junto, passo, junto (virado para a direita) | quem sou, trajetória |
| `marco` | 12×16 | placa de madeira | trajetória |
| `hud-sol`, `hud-por-do-sol`, `hud-lua` | 11×11 | ícone do relógio | HUD |
| `icone-*` (16) | 16×16 | typescript, react, nextjs, vite, tailwind, supabase, postgresql, nodejs, vercel, prisma, vitest, grid, fullcalendar, dndkit, claude, gsap | inventário |
| `postal` | 120×76 | Ibituruna no fim de tarde, Rio Doce, parapente | contato |
| `selo` | 28×32 | selo com o gato | contato |
| `gato-0`, `gato-1` | 16×9 | gato dormindo: inspira, expira | cena (animação), quem sou |
| `vapor-0` … `-2` | 4×4 | fumaça da caneca | cena (animação) |
| `caneca` | 8×7 | caneca | prateleira |
| `suculenta` | 7×6 | vaso pequeno | prateleira |
| `controle` | 9×5 | controle de videogame | prateleira |
| `ibituruna` | 46×12 | silhueta do pico vista da janela | céu da cena |

Fora da folha (gerados direto): cursores `public/cursores/seta.png` e `mao.png` (12×12 ampliados 2×),
favicon 16×16 (`src/app/icon.png`, `apple-icon.png`) e a OG image 1200×630 (`public/og.png`).

O personagem é genérico (cabelo escuro, moletom sálvia). Se quiser que ele pareça você, os cinco
quadros de `andarilho` são o lugar.

## A cena por dentro

Cada camada do quarto tem, além da arte, mapas de nível 0–7 em `public/arte/luz.<hash>.png`:

- `sol0`, `sol1`: onde a luz da janela bate no começo e no fim da tarde (com sombra dos móveis);
- `luz`: alcance da luminária e o brilho fraco do monitor;
- `emissivo`: o que não escurece à noite (tela; lâmpada e luzinhas só com a luminária acesa);
- `janela`: pixels do vão onde o céu é desenhado.

Esses mapas são calculados a partir da geometria do quarto em `arte/cena/`. Se você redesenhar uma
camada da cena mantendo os objetos no mesmo lugar, os mapas continuam valendo. Se mudar a
posição dos móveis, ajuste também `arte/cena/quarto.ts` para a luz acompanhar.
