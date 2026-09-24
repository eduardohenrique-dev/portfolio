"use client";
/**
 * O quarto em canvas. Três camadas com parallax em passos de pixel inteiro,
 * luz recalculada a cada troca de horário e animações pequenas (vapor, gato respirando).
 */
import { useEffect, useRef, useState } from "react";
import { ATLAS } from "@/arte/atlas.gerado";
import { CEUS, desenharCeu } from "@/arte/ceu";
import { type CamadaCena, comporIndices } from "@/arte/compositor";
import { camadasDaCena, carregarFolhas, type Composicao, type NomeRegiao, recortar, RGBA } from "@/arte/folha";
import { alternarLuminaria, assinar, type Estado, lerEstado, luzAtual } from "@/arte/horario";
import { BAYER4, VAZIO } from "@/arte/paleta";
import { gsap, prefereMenosMovimento, ScrollTrigger } from "@/componentes/movimento/gsap";

interface Props {
  composicao: Composicao | "responsiva";
  rotulo: string;
  /** horário usado quando o visitante prefere menos movimento */
  horarioParado: number;
  interativa?: boolean;
  /** seletor da seção cuja rolagem move as camadas */
  gatilhoParallax?: string;
  /** monta a cena camada por camada ao aparecer */
  entrada?: boolean;
  className?: string;
}

const PARALLAX_PONTEIRO = [0, 1, 2];
const PARALLAX_ROLAGEM = [0, 4, 9];

export function Cena({ composicao, rotulo, horarioParado, interativa = false, gatilhoParallax, entrada = false, className }: Props) {
  const moldura = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const telas = useRef<(HTMLCanvasElement | null)[]>([]);
  const [comp, setComp] = useState<Composicao | null>(composicao === "responsiva" ? null : composicao);
  const [escala, setEscala] = useState(0);
  const [posicao, setPosicao] = useState({ left: 0, top: 0 });
  const escalaRef = useRef(0);
  const [pronta, setPronta] = useState(false);
  const [ligada, setLigada] = useState(false);

  // composição responsiva: cena larga no desktop, alta no celular
  useEffect(() => {
    if (composicao !== "responsiva") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const atualizar = () => setComp(mq.matches ? "larga" : "alta");
    atualizar();
    mq.addEventListener("change", atualizar);
    return () => mq.removeEventListener("change", atualizar);
  }, [composicao]);

  // escala inteira em pixels de dispositivo: nítido em qualquer devicePixelRatio
  useEffect(() => {
    const el = moldura.current;
    if (!comp || !el) return;
    const { largura, altura } = ATLAS.cenas[comp];
    const medir = () => {
      const r = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const dispositivo = Math.max(1, Math.floor(Math.min(r.width / largura, r.height / altura) * dpr));
      const e = dispositivo / dpr;
      // centraliza e encaixa o canto do palco num pixel inteiro do dispositivo
      const encaixar = (inicioAbsoluto: number, folga: number) => {
        const alvo = (inicioAbsoluto + folga) * dpr;
        return folga + (Math.round(alvo) - alvo) / dpr;
      };
      const left = encaixar(r.left + window.scrollX, (r.width - largura * e) / 2);
      const top = encaixar(r.top + window.scrollY, (r.height - altura * e) / 2);
      escalaRef.current = e;
      setEscala(e);
      setPosicao((p) => (p.left === left && p.top === top ? p : { left, top }));
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [comp]);

  useEffect(() => {
    if (!comp) return;
    const cena = ATLAS.cenas[comp];
    const { largura, altura, meta } = cena;
    const n = largura * altura;
    const reduzido = prefereMenosMovimento();
    let vivo = true;
    let camadas: CamadaCena[] = [];
    let trabalho1 = new Uint8Array(0);
    let quadros: Record<string, { dados: Uint8Array; w: number; h: number }[]> = {};
    const indices = new Uint8Array(n);
    const ceuNovo = new Uint8Array(n);
    const ceuAntigo = new Uint8Array(n);
    const ceuMisto = new Uint8Array(n);
    const contextos: CanvasRenderingContext2D[] = [];
    const imagens: ImageData[] = [];
    const vistas: Uint32Array[] = [];
    let montanha: { largura: number; altura: number; dados: Uint8Array } | null = null;
    let deslocMontanha = 0;
    let quadroVapor = 0;
    let quadroGato = 0;
    let estado: Estado = lerEstado();
    let pendente: Set<number> | null = null;
    let raf = 0;
    let visivel = true;
    const ponteiro = [0, 0, 0];
    const rolagem = [0, 0, 0];

    function prepararCeu(destino: Uint8Array, indice: number) {
      const r = meta.ceu;
      const tmp = new Uint8Array(r.w * r.h);
      desenharCeu(tmp, r.w, r.h, CEUS[indice], montanha, { horizonte: meta.horizonte, montanhaX: meta.montanhaX, desloc: deslocMontanha });
      for (let y = 0; y < r.h; y++) destino.set(tmp.subarray(y * r.w, (y + 1) * r.w), (r.y + y) * largura + r.x);
    }

    function aplicarAnimacoes() {
      trabalho1.set(camadas[1].base);
      for (const a of meta.animacoes) {
        const q = a.nome === "vapor" ? quadros.vapor[quadroVapor] : quadros.gato[quadroGato];
        if (!q) continue;
        for (let j = 0; j < q.h; j++)
          for (let i = 0; i < q.w; i++) {
            const x = a.x + i;
            const y = a.y + j;
            if (x < 0 || y < 0 || x >= largura || y >= altura) continue;
            const p = y * largura + x;
            if (a.nome === "gato") trabalho1[p] = VAZIO;
            const v = q.dados[j * q.w + i];
            if (v !== VAZIO) trabalho1[p] = v;
          }
      }
    }

    function desenhar(quais: Iterable<number>) {
      const fixo = reduzido ? horarioParado : undefined;
      const novo = fixo ?? estado.indice;
      const antigo = fixo ?? estado.anterior;
      const t = fixo !== undefined ? 1 : estado.transicao;
      const luz = luzAtual(estado, fixo);
      const lista = [...quais];
      let ceu = ceuNovo;
      if (lista.includes(0)) {
        prepararCeu(ceuNovo, novo);
        if (t < 1) {
          prepararCeu(ceuAntigo, antigo);
          const r = meta.ceu;
          for (let y = r.y; y < r.y + r.h; y++)
            for (let x = r.x; x < r.x + r.w; x++) {
              const p = y * largura + x;
              ceuMisto[p] = (BAYER4[y & 3][x & 3] + 0.5) / 16 < t ? ceuNovo[p] : ceuAntigo[p];
            }
          ceu = ceuMisto;
        }
      }
      const tabelaNova = RGBA[novo];
      const tabelaAntiga = RGBA[antigo];
      for (const c of lista) {
        const camada = c === 1 ? { ...camadas[1], base: trabalho1 } : camadas[c];
        comporIndices(camada, luz, indices, c === 0 ? ceu : null);
        const vista = vistas[c];
        if (t >= 1) {
          for (let p = 0; p < n; p++) vista[p] = tabelaNova[indices[p]];
        } else {
          for (let y = 0; y < altura; y++) {
            const linha = BAYER4[y & 3];
            for (let x = 0; x < largura; x++) {
              const p = y * largura + x;
              vista[p] = ((linha[x & 3] + 0.5) / 16 < t ? tabelaNova : tabelaAntiga)[indices[p]];
            }
          }
        }
        contextos[c].putImageData(imagens[c], 0, 0);
      }
    }

    function agendar(quais: number[]) {
      pendente ??= new Set();
      for (const q of quais) pendente.add(q);
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const lista = pendente;
        pendente = null;
        if (vivo && lista && camadas.length) desenhar(lista);
      });
    }

    function posicionar() {
      const e = escalaRef.current;
      telas.current.forEach((tela, c) => {
        if (!tela) return;
        const dx = ponteiro[c];
        const dy = rolagem[c];
        tela.style.transform = `translate3d(${dx * e}px, ${dy * e}px, 0)`;
      });
    }

    let cancelarAssinatura = () => {};
    let intervalo = 0;
    const limpezas: (() => void)[] = [];

    carregarFolhas()
      .then((folhas) => {
        if (!vivo) return;
        camadas = camadasDaCena(folhas, comp);
        trabalho1 = new Uint8Array(camadas[1].base);
        const r = (nome: string) => {
          const regiao = ATLAS.regioes[nome as NomeRegiao];
          return { dados: recortar(folhas.sprites, regiao), w: regiao[2], h: regiao[3] };
        };
        quadros = { vapor: [0, 1, 2].map((i) => r(`vapor-${i}`)), gato: [0, 1].map((i) => r(`gato-${i}`)) };
        const m = r("ibituruna");
        montanha = { largura: m.w, altura: m.h, dados: m.dados };
        telas.current.forEach((tela, c) => {
          if (!tela) return;
          const ctx = tela.getContext("2d");
          if (!ctx) return;
          contextos[c] = ctx;
          imagens[c] = ctx.createImageData(largura, altura);
          vistas[c] = new Uint32Array(imagens[c].data.buffer);
        });
        aplicarAnimacoes();
        cancelarAssinatura = assinar((e) => {
          estado = e;
          setLigada(luzAtual(e, reduzido ? horarioParado : undefined).luminaria >= 0.5);
          agendar([0, 1, 2]);
        });
        desenhar([0, 1, 2]);
        setPronta(true);

        if (!reduzido) {
          intervalo = window.setInterval(() => {
            if (!visivel || document.hidden) return;
            quadroVapor = (quadroVapor + 1) % 3;
            if (quadroVapor === 0) quadroGato = (quadroGato + 1) % 2;
            aplicarAnimacoes();
            agendar([1]);
          }, 260);
        }
      })
      .catch((erro) => console.error("cena: não carregou a arte", erro));

    const io = new IntersectionObserver(([entrada]) => {
      visivel = entrada.isIntersecting;
    });
    if (moldura.current) io.observe(moldura.current);
    limpezas.push(() => io.disconnect());

    if (interativa && !reduzido && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const aoMover = (ev: PointerEvent) => {
        const el = moldura.current;
        if (!el || !visivel) return;
        const caixa = el.getBoundingClientRect();
        const nx = Math.max(-1, Math.min(1, (ev.clientX - (caixa.left + caixa.width / 2)) / (caixa.width / 2)));
        let mudou = false;
        PARALLAX_PONTEIRO.forEach((forca, c) => {
          const alvo = Math.round(nx * forca);
          if (alvo !== ponteiro[c]) {
            ponteiro[c] = alvo;
            mudou = true;
          }
        });
        const montanhaAlvo = Math.round(-nx * 2);
        if (montanhaAlvo !== deslocMontanha) {
          deslocMontanha = montanhaAlvo;
          agendar([0]);
        }
        if (mudou) posicionar();
      };
      window.addEventListener("pointermove", aoMover, { passive: true });
      limpezas.push(() => window.removeEventListener("pointermove", aoMover));
    }

    if (gatilhoParallax && !reduzido) {
      const gatilho = ScrollTrigger.create({
        trigger: gatilhoParallax,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => {
          let mudou = false;
          PARALLAX_ROLAGEM.forEach((forca, c) => {
            const alvo = -Math.round(self.progress * forca);
            if (alvo !== rolagem[c]) {
              rolagem[c] = alvo;
              mudou = true;
            }
          });
          if (mudou) posicionar();
        },
      });
      limpezas.push(() => gatilho.kill());
    }

    const aoRedimensionar = () => posicionar();
    window.addEventListener("resize", aoRedimensionar);
    limpezas.push(() => window.removeEventListener("resize", aoRedimensionar));

    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      window.clearInterval(intervalo);
      cancelarAssinatura();
      for (const limpar of limpezas) limpar();
    };
  }, [comp, horarioParado, interativa, gatilhoParallax]);

  // montagem da cena: camadas descem em passos, uma depois da outra
  useEffect(() => {
    if (!pronta || !entrada || prefereMenosMovimento()) return;
    const alvos = telas.current.filter(Boolean);
    const e = escalaRef.current || 1;
    const animacao = gsap.from(alvos, {
      y: -12 * e,
      autoAlpha: 0,
      duration: 0.5,
      ease: "steps(5)",
      stagger: 0.14,
      clearProps: "opacity,visibility",
    });
    return () => {
      animacao.kill();
    };
  }, [pronta, entrada]);

  const dims = comp ? ATLAS.cenas[comp] : null;
  const alvo = comp ? ATLAS.cenas[comp].meta.alvoLuminaria : null;

  return (
    <div ref={moldura} className={`cena ${className ?? ""}`} data-composicao={composicao}>
      {dims && (
        <div
          className="cena-palco"
          style={{
            width: dims.largura * escala,
            height: dims.altura * escala,
            left: posicao.left,
            top: posicao.top,
            visibility: escala > 0 ? "visible" : "hidden",
          }}
        >
          <div ref={palco} role="img" aria-label={rotulo} className="cena-camadas" style={{ opacity: pronta ? 1 : 0 }}>
            {[0, 1, 2].map((c) => (
              <canvas
                key={`${comp}-${c}`}
                ref={(el) => {
                  telas.current[c] = el;
                }}
                width={dims.largura}
                height={dims.altura}
                className="cena-camada"
              />
            ))}
          </div>
          {interativa && alvo && (
            <button
              type="button"
              className="cena-luminaria"
              aria-pressed={ligada}
              aria-label={ligada ? "Apagar a luminária" : "Acender a luminária"}
              data-cursor-acao={ligada ? "apagar a luminária" : "acender a luminária"}
              onClick={alternarLuminaria}
              style={{ left: alvo.x * escala, top: alvo.y * escala, width: alvo.w * escala, height: alvo.h * escala }}
            />
          )}
        </div>
      )}
    </div>
  );
}
