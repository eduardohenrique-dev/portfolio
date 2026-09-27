"use client";
/**
 * Serviços como mapa de fases de videogame: cinco paradas numa ilha em pixel art, ligadas por uma trilha.
 * - Ao entrar na tela (ScrollTrigger), a ilha abre, a trilha se desenha e os marcos se montam.
 * - Escolher uma parada faz o personagem andar pela trilha até ela, em quadros de caminhada, e o marco
 *   ganha vida: a luneta vira, o cavalete pinta, a engrenagem roda, a antena pisca, o foguete decola.
 * - As paradas são abas (setas do teclado andam entre elas); no celular, deslizar no mapa (Observer) também.
 * - Com menos movimento: o personagem vai direto, sem caminhar, e o marco fica parado no quadro aceso.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ATLAS } from "@/arte/atlas.gerado";
import type { NomeRegiao } from "@/arte/folha";
import { Sprite } from "@/componentes/arte/Sprite";
import { gsap, Observer, prefereMenosMovimento, useGSAP } from "@/componentes/movimento/gsap";
import type { Servico } from "@/conteudo/servicos";

interface Props {
  servicos: Servico[];
  titulo: string;
  texto: string;
}

type Composicao = keyof typeof ATLAS.servicos;

/** Do maior para o menor: a primeira que casar decide a composição e a escala inteira. */
const TELAS: [string, Composicao, number][] = [
  ["(min-width: 1024px)", "larga", 3],
  ["(min-width: 768px)", "larga", 2],
  ["(min-width: 640px)", "alta", 3],
];

function lerTela(): string {
  for (const [consulta, composicao, escala] of TELAS) if (window.matchMedia(consulta).matches) return `${composicao}:${escala}`;
  return "alta:2";
}

function assinarTela(aviso: () => void) {
  const consultas = TELAS.map(([consulta]) => window.matchMedia(consulta));
  consultas.forEach((m) => m.addEventListener("change", aviso));
  return () => consultas.forEach((m) => m.removeEventListener("change", aviso));
}

/** Velocidade da caminhada, em pixels do mapa por segundo. */
const PASSO = 120;
/** A cada quantos pixels andados o personagem troca de quadro. */
const PASSADA = 3;

export function Servicos({ servicos, titulo, texto }: Props) {
  const tela = useSyncExternalStore(assinarTela, lerTela, () => "larga:3");
  const [composicao, escalaTexto] = tela.split(":") as [Composicao, string];
  const e = Number(escalaTexto);
  const mapa = ATLAS.servicos[composicao];

  const [ativo, setAtivo] = useState(0);
  // com menos movimento não há entrada animada: a primeira parada já começa acesa
  const [chegou, setChegou] = useState<number | null>(() => (typeof window !== "undefined" && prefereMenosMovimento() ? 0 : null));
  const raiz = useRef<HTMLElement>(null);
  const posicao = useRef<HTMLDivElement>(null);
  const corpo = useRef<HTMLDivElement>(null);
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  const ativoAtual = useRef(0);
  const andar = useRef<(i: number) => void>(() => {});
  const entrou = useRef(false);
  const primeiroPainel = useRef(true);

  function selecionar(i: number, focar = false) {
    const alvo = (i + servicos.length) % servicos.length;
    ativoAtual.current = alvo;
    setAtivo(alvo);
    andar.current(alvo);
    if (focar) abas.current[alvo]?.focus();
  }

  function teclado(ev: React.KeyboardEvent) {
    const destinos: Record<string, number> = {
      ArrowRight: ativo + 1,
      ArrowDown: ativo + 1,
      ArrowLeft: ativo - 1,
      ArrowUp: ativo - 1,
      Home: 0,
      End: servicos.length - 1,
    };
    if (!(ev.key in destinos)) return;
    ev.preventDefault();
    selecionar(destinos[ev.key], true);
  }

  // caminhada: o personagem segue a trilha ponto a ponto, sempre em pixel inteiro do mapa
  useGSAP(
    () => {
      const el = posicao.current;
      const cp = corpo.current;
      if (!el || !cp) return;
      const pontos = mapa.caminho;
      let s: number = mapa.paradas[ativoAtual.current].indice;
      let ultimoX: number = pontos[Math.round(s)][0];
      let tween: gsap.core.Tween | null = null;

      const pontoEm = (v: number): [number, number] => {
        const i = Math.max(0, Math.min(pontos.length - 2, Math.floor(v)));
        const t = Math.min(1, Math.max(0, v - i));
        const [x0, y0] = pontos[i];
        const [x1, y1] = pontos[i + 1];
        return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
      };

      const posicionar = (andando: boolean) => {
        const [x, y] = pontoEm(s);
        el.style.transform = `translate(${(Math.round(x) - 6) * e}px, ${(Math.round(y) - 17) * e}px)`;
        cp.dataset.quadro = String(andando ? 1 + (Math.floor(s / PASSADA) % 4) : 0);
        if (Math.abs(x - ultimoX) > 0.3) {
          cp.classList.toggle("voltando", x < ultimoX);
          ultimoX = x;
        }
      };
      posicionar(false);

      andar.current = (i: number) => {
        tween?.kill();
        const alvo: number = mapa.paradas[i].indice;
        setChegou(null);
        if (prefereMenosMovimento() || Math.abs(alvo - s) < 1) {
          s = alvo;
          posicionar(false);
          setChegou(i);
          return;
        }
        const proxy = { s };
        tween = gsap.to(proxy, {
          s: alvo,
          duration: Math.max(0.25, Math.abs(alvo - s) / PASSO),
          ease: "none",
          onUpdate: () => {
            s = proxy.s;
            posicionar(true);
          },
          onComplete: () => {
            s = alvo;
            posicionar(false);
            setChegou(i);
          },
        });
      };
      return () => {
        tween?.kill();
      };
    },
    { scope: raiz, dependencies: [composicao, e] },
  );

  // entrada: a ilha abre, a trilha se desenha, os marcos se montam e o personagem cai na primeira parada
  useGSAP(
    () => {
      if (entrou.current || prefereMenosMovimento()) return;
      const alta = composicao === "alta";
      const tl = gsap.timeline({
        scrollTrigger: { trigger: ".mapa-servicos", start: "top 80%", once: true },
        onComplete: () => {
          entrou.current = true;
          setChegou(ativoAtual.current);
        },
      });
      // clearProps: sem o recorte depois de pronto (o foguete precisa sair da caixa dele ao decolar)
      tl.fromTo(
        ".mapa-chao",
        { clipPath: "inset(0% 50% 0% 50%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.36, ease: "steps(6)", clearProps: "clipPath" },
      )
        .fromTo(
          ".mapa-trilha",
          { clipPath: alta ? "inset(0% 0% 100% 0%)" : "inset(0% 100% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "steps(14)", clearProps: "clipPath" },
        )
        .fromTo(
          ".marco-servico",
          { clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 0.2, ease: "steps(4)", stagger: 0.12, clearProps: "clipPath" },
          "-=0.35",
        )
        .fromTo(".caminhante-queda", { autoAlpha: 0, y: -10 * e }, { autoAlpha: 1, y: 0, duration: 0.24, ease: "steps(3)" });
    },
    { scope: raiz, dependencies: [composicao, e] },
  );

  // no celular, deslizar para o lado no mapa anda para a próxima parada ou volta uma
  useGSAP(
    () => {
      const alvo = raiz.current?.querySelector(".mapa-servicos");
      if (!alvo) return;
      const observador = Observer.create({
        target: alvo,
        type: "touch",
        tolerance: 40,
        lockAxis: true,
        onLeft: () => selecionar(ativoAtual.current + 1),
        onRight: () => selecionar(ativoAtual.current - 1),
      });
      return () => observador.kill();
    },
    { scope: raiz },
  );

  // o marco da parada alcançada ganha vida; o foguete decola e volta quando o personagem sai
  useEffect(() => {
    if (chegou === null) return;
    const id = servicos[chegou].id;
    const marco = raiz.current?.querySelector<HTMLElement>(`[data-marco="${id}"]`);
    if (!marco) return;
    marco.dataset.quadro = "1";
    if (prefereMenosMovimento()) {
      return () => {
        marco.dataset.quadro = "0";
      };
    }
    let quadro = 1;
    const relogio = window.setInterval(() => {
      quadro = 1 - quadro;
      marco.dataset.quadro = String(id === "publicar" ? 1 : quadro);
    }, 320);
    const voo = id === "publicar" ? marco.closest(".voo") : null;
    if (voo) gsap.to(voo, { y: -18 * e, duration: 0.6, ease: "steps(8)" });
    return () => {
      window.clearInterval(relogio);
      if (voo) gsap.to(voo, { y: 0, duration: 0.4, ease: "steps(6)", onComplete: () => void (marco.dataset.quadro = "0") });
      else marco.dataset.quadro = "0";
    };
  }, [chegou, e, servicos]);

  // o painel novo entra da esquerda para a direita, em passos
  useGSAP(
    () => {
      if (primeiroPainel.current) {
        primeiroPainel.current = false;
        return;
      }
      if (prefereMenosMovimento()) return;
      gsap.from(`#servico-painel-${servicos[ativo].id} [data-revelar-servico]`, {
        clipPath: "inset(0 100% 0 0)",
        duration: 0.24,
        ease: "steps(4)",
        stagger: 0.05,
        clearProps: "clipPath",
      });
    },
    { scope: raiz, dependencies: [ativo] },
  );

  return (
    <section ref={raiz} id="servicos" aria-labelledby="titulo-servicos" className="mx-auto max-w-pagina px-5 py-20 md:px-10 md:py-24">
      <h2 id="titulo-servicos" className="pixel text-pixel-2 text-creme md:text-pixel-3">
        {titulo}
      </h2>
      <p className="mt-4 max-w-texto text-bruma">{texto}</p>
      <div className="mapa-servicos relative mx-auto mt-12" style={{ width: mapa.largura * e, height: mapa.altura * e }}>
        <div className="mapa-chao absolute top-0 left-0" aria-hidden="true">
          <Sprite regiao={`mapa-${composicao}` as NomeRegiao} escala={e} />
        </div>
        <div className="mapa-trilha absolute top-0 left-0" aria-hidden="true">
          <Sprite regiao={`trilha-${composicao}` as NomeRegiao} escala={e} />
        </div>

        {mapa.paradas.map((p) => (
          <div key={p.id} className="marco-servico absolute" style={{ left: p.marco[0] * e, top: p.marco[1] * e }} aria-hidden="true">
            <div className="voo">
              <div data-marco={p.id} data-quadro="0">
                <Sprite regiao={`servico-${p.id}-0` as NomeRegiao} escala={e} className="quadro" />
                <Sprite regiao={`servico-${p.id}-1` as NomeRegiao} escala={e} className="quadro" />
              </div>
            </div>
          </div>
        ))}

        <div ref={posicao} className="absolute top-0 left-0" aria-hidden="true">
          <div className="caminhante-queda">
            <div ref={corpo} data-quadro="0">
              {[0, 1, 2, 3, 4].map((q) => (
                <Sprite key={q} regiao={`andarilho-${q}` as NomeRegiao} escala={e} className="quadro" />
              ))}
            </div>
          </div>
        </div>

        <div role="tablist" aria-label="Paradas do mapa" onKeyDown={teclado}>
          {servicos.map((s, i) => {
            const parada = mapa.paradas[i];
            const [px, py] = parada.ponto;
            const topo = parada.marco[1] - 2;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  abas.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`servico-aba-${s.id}`}
                aria-selected={i === ativo}
                aria-controls={`servico-painel-${s.id}`}
                tabIndex={i === ativo ? 0 : -1}
                className="absolute"
                style={{ left: (px - 20) * e, top: topo * e, width: 40 * e, height: (py + 20 - topo) * e }}
                data-cursor-acao="ir até"
                data-cursor-objeto={s.nome}
                onClick={() => selecionar(i)}
              >
                {/* o nome fica sempre 7px do mapa abaixo da parada, acompanhando a trilha */}
                <span className="absolute right-0 left-0 flex justify-center" style={{ top: (py + 7 - topo) * e }}>
                  <span className={`moldura pixel px-2 py-1 text-pixel-1 whitespace-nowrap ${i === ativo ? "text-ambar" : "text-creme"}`}>
                    {s.nome}
                  </span>
                </span>
                <span className="sr-only">: {s.area}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/*
        Mesmo desenho do painel de projeto: cabeçalho e três colunas iguais, cada uma com o seu título.
        A partir de lg, os cinco painéis ocupam a mesma célula e só o da parada escolhida aparece: o painel
        fica com a altura do mais longo, e a página não pula ao trocar de parada. Abaixo disso as colunas
        viram uma pilha e cada painel tem a própria altura (a sobra do mais longo seria só espaço vazio).
      */}
      <div className="moldura mt-12 grid p-6 md:p-10">
        {servicos.map((s, i) => (
          <div
            key={s.id}
            role="tabpanel"
            id={`servico-painel-${s.id}`}
            aria-labelledby={`servico-aba-${s.id}`}
            className={`grid grid-cols-1 content-start gap-10 [grid-area:1/1] ${i === ativo ? "" : "max-lg:hidden lg:invisible"}`}
          >
            <header className="flex flex-col gap-2">
              <h3 className="pixel text-pixel-2 text-creme md:text-pixel-3" data-revelar-servico>
                {s.nome}
              </h3>
              <p className="pixel text-pixel-2 text-ambar" data-revelar-servico>
                {s.area}
              </p>
            </header>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="flex flex-col gap-3" data-revelar-servico>
                <h4 className="pixel text-pixel-2 text-salvia">O que faço</h4>
                <p className="text-creme">{s.descricao}</p>
              </div>
              <div className="flex flex-col gap-3" data-revelar-servico>
                <h4 className="pixel text-pixel-2 text-salvia">Você recebe</h4>
                <ul className="flex flex-col gap-2">
                  {s.entregas.map((entrega) => (
                    <li key={entrega} className="entrega text-creme">
                      {entrega}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3" data-revelar-servico>
                <h4 className="pixel text-pixel-2 text-salvia">Onde já fiz</h4>
                <p className="text-creme">{s.onde}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
