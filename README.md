# Portfólio · Eduardo Henrique

One-page em pixel art, no fim de uma tarde que vira noite conforme a página rola.
Next.js 16, Tailwind v4, GSAP e a API do Claude.

## Decisões

**Next.js (e não Vite).** A página é gerada estática no build: todo o texto chega no HTML, o LCP é
um parágrafo (não um canvas) e buscador lê tudo sem executar JS. O terminal precisa de uma rota no
servidor para esconder a chave da API — o Route Handler resolve isso no mesmo projeto.

**Arte e fonte feitas em código.** O quarto isométrico é rasterizado em `arte/` (2:1, profundidade
por pixel, sombra por raio até a janela e até a lâmpada). A fonte pixel **Ibituruna** também é gerada
aqui, a partir de glifos 5×7, em grade de 12px. Ver [ARTE.md](ARTE.md) para a lista de sprites e o
fluxo para redesenhar no Aseprite.

**Paleta fechada de 8 índices.** O horário não inventa cor: troca o valor de cada índice (palette
swap). A cena e os tokens do Tailwind leem a mesma tabela (`src/arte/paleta.ts`). A troca acontece em
passos com dithering Bayer — nenhum pixel recebe cor intermediária.

**Sem smooth scroll.** Lenis/ScrollSmoother deixam a rolagem em posição subpixel e borram sprite.

**Regras do pixel.** `image-rendering: pixelated`, escala inteira em pixels de *dispositivo* (a cena
calcula a escala com `devicePixelRatio` e alinha o canto ao pixel físico), grade de 4px no CSS, fonte
pixel só em 12/24/36/48px com entrelinha que deixa a linha de base num pixel inteiro, movimento em
`steps()`.

## Movimento

| Onde | O quê | Plugin |
|---|---|---|
| Abertura | nome letra por letra em `steps(2)`; a cena monta camada por camada; o fim de tarde passa enquanto a seção fica presa | SplitText, ScrollTrigger |
| Página toda | a rolagem move o relógio (16:40 → 23:10); cada seção ancora um horário; paleta, luz da cena e HUD trocam em passos | ScrollTrigger |
| Projetos | o objeto da prateleira cresce até virar o painel | Flip |
| Trajetória | seção presa, trilha horizontal, personagem anda em quadros e para quando a rolagem para | ScrollTrigger, Observer |
| Contato | cartão-postal vira achatando em passos | core |

Com `prefers-reduced-motion`, a página fica parada no entardecer (também pelo CSS, sem depender de
JS), a trajetória vira lista e as trocas acontecem sem animação.

## Terminal com IA

`POST /api/pergunta` → API do Claude em streaming, com o prompt de sistema montado a partir do mesmo
conteúdo que a página exibe (`src/conteudo/`). Sem fato na base, o modelo diz que não sabe.

- **Só com chave:** a página é estática e confere `ANTHROPIC_API_KEY` no build. Sem a chave, o terminal
  só teria respostas prontas, então a seção não é renderizada e saem junto as frases que apontam para
  ela (parágrafo do "Quem sou", item do inventário, marco da trajetória e colofão). Cadastrou a chave,
  faça um novo deploy e tudo volta.
- **Limite:** 6 perguntas por hora por visitante (IP com hash) e teto diário (`IA_LIMITE_DIARIO`, padrão 300).
- **Fallback:** sem chave, com cota esgotada, erro, demora (> 15 s) ou recusa, a rota responde com uma
  resposta pronta e o terminal mostra que é offline e por quê. Sem rede, o navegador faz o mesmo.
- **Custo:** modelo `claude-opus-5` com esforço `low`, prompt de sistema em cache e `max_tokens` 2048.
  Dá para trocar por `ANTHROPIC_MODEL` (ex.: `claude-haiku-4-5`).

### Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|---|---|
| `ANTHROPIC_API_KEY` | para o terminal | sem ela no build, a seção do terminal não aparece |
| `ANTHROPIC_MODEL` | não | padrão `claude-opus-5` |
| `IA_LIMITE_DIARIO` | não | teto de perguntas por dia (padrão 300) |
| `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` | não | limite compartilhado entre instâncias; sem elas o limite é por instância |
| `NEXT_PUBLIC_URL_SITE` | não | URL canônica; na Vercel usa o domínio de produção automaticamente |

O limite em memória segura abuso casual, não um ataque. O teto de gasto de verdade é o limite
mensal configurado no Console da Anthropic.

## Comandos

```bash
npm install
npm run dev              # http://localhost:3000
npm run arte             # regenera sprites, mapas de luz, fonte, OG image e ícones
npm run arte:contraste   # confere AA dos pares de cor nos 4 horários
npm run arte:previa -- <pasta> 3   # prévias ampliadas da cena
npm run typecheck
npm run build
```

## Onde mexer

```
src/conteudo/     todos os textos e fatos (página e terminal leem daqui)
src/arte/         paleta, compositor de luz, céu, carregamento da folha, relógio da página
src/componentes/  cena em canvas, sprites, HUD e seções
src/app/api/      rota do terminal
src/lib/          limite de uso e modo offline
arte/             geração da arte e da fonte (roda no build local, não na Vercel)
```

## Qualidade medida

Build de produção local, Lighthouse 13.4 (13/09/2026):

| | Performance | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| Mobile | 97 | 100 | 100 | 100 |
| Desktop | 100 | 100 | 100 | 100 |

Contraste AA validado por script em todos os horários. Testado em 390px (sem rolagem lateral) e 1440px,
com teclado e com movimento reduzido.

## Créditos

Texto em Inter Tight (SIL OFL). GSAP (licença gratuita da GSAP). Os ícones do inventário são
referências simplificadas às marcas das tecnologias, redesenhadas na paleta do site.
