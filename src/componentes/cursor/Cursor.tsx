"use client";
/**
 * Cursor em pixel art, como nos jogos de apontar e clicar: muda com o que está embaixo (seta, mão,
 * lupa, barra de texto), a mão afunda no clique e alguns objetos mostram o nome ao lado.
 *
 * - Só liga com mouse ((hover: hover) and (pointer: fine)), fora do alto contraste do sistema e se o
 *   visitante não trocou pelo cursor do sistema no rodapé. Toque ou caneta devolvem o do sistema.
 * - O cursor do sistema só some depois que o de pixel já está desenhado. Sem JS, ele nunca some.
 * - Nítido em 125% ou 150%: escala inteira em pixels do dispositivo e canto no pixel físico.
 * - Nada de React a cada movimento: posição, desenho e rótulo vão direto no DOM.
 *
 * Marcação: data-cursor="lupa" troca o desenho; data-cursor-acao e data-cursor-objeto formam o
 * rótulo ("abrir" + "EINERD Scrims"). Link, botão e campo de texto já ganham mão ou barra sozinhos.
 */
import { useEffect, useRef } from "react";
import { ATLAS } from "@/arte/atlas.gerado";
import { carregarFolhas, type Folha, type NomeRegiao, recortar, RGBA } from "@/arte/folha";
import { assinar, type Estado } from "@/arte/horario";
import { BAYER4 } from "@/arte/paleta";
import { assinarCursorPixel, cursorPixelLigado } from "./preferencia";

type NomeCursor = keyof typeof ATLAS.cursores;

interface Alvo {
  cursor: NomeCursor;
  acao: string;
  objeto: string;
  elemento: HTMLElement | null;
}

const MOUSE = "(hover: hover) and (pointer: fine)";
const ALTO_CONTRASTE = "(forced-colors: active)";
const CLASSE_ATIVO = "com-cursor-pixel";
/** Pixels físicos por pixel do sprite em tela 100%: dá ~32px, o tamanho do cursor do sistema. */
const TAMANHO = 2;
/** Distância entre o sprite e o rótulo, e do rótulo até a borda da janela. */
const FOLGA = 12;
const CAMPO =
  "input:not([type='button'], [type='submit'], [type='reset'], [type='checkbox'], [type='radio'], [type='range'], [type='color'], [type='file']), textarea, [contenteditable='true']";
const CLICAVEL = "a[href], button, summary, select, label[for], [role='button'], [data-cursor], [data-cursor-acao]";
const ATRIBUTOS = ["data-cursor", "data-cursor-acao", "data-cursor-objeto", "disabled", "aria-disabled"];
const NADA: Alvo = { cursor: "seta", acao: "", objeto: "", elemento: null };

function lerAlvo(el: Element | null): Alvo {
  if (!el) return NADA;
  if (el.closest(CAMPO)) return { ...NADA, cursor: "texto" };
  const alvo = el.closest<HTMLElement>(CLICAVEL);
  if (!alvo || alvo.matches(":disabled, [aria-disabled='true']")) return NADA;
  const pedido = alvo.dataset.cursor;
  return {
    cursor: pedido && pedido in ATLAS.cursores ? (pedido as NomeCursor) : "mao",
    acao: alvo.dataset.cursorAcao ?? "",
    objeto: alvo.dataset.cursorObjeto ?? "",
    elemento: alvo,
  };
}

function regiaoDe(nome: NomeCursor) {
  return ATLAS.regioes[ATLAS.cursores[nome].regiao as NomeRegiao];
}

export function Cursor() {
  const raiz = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const rotulo = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = raiz.current;
    const canvas = tela.current;
    const etiqueta = rotulo.current;
    const ctx = canvas?.getContext("2d");
    if (!el || !canvas || !etiqueta || !ctx) return;
    const [textoAcao, textoObjeto] = Array.from(etiqueta.children) as HTMLElement[];
    const html = document.documentElement;
    const mouse = window.matchMedia(MOUSE);
    const altoContraste = window.matchMedia(ALTO_CONTRASTE);

    let vivo = true;
    let folha: Folha | null = null;
    const recortes = new Map<NomeCursor, Uint8Array>();
    let hora: Estado | null = null;
    let alvo = NADA;
    let desenho: NomeCursor = "seta";
    let apertado = false;
    let ativo = false;
    let temPosicao = false;
    let x = 0;
    let y = 0;
    let dpr = 1;
    let escala = TAMANHO;
    let larguraRotulo = 0;
    let alturaRotulo = 0;
    let quadro = 0;

    const permitido = () => mouse.matches && !altoContraste.matches && cursorPixelLigado();
    const pronto = () => folha !== null && hora !== null;

    const medirTela = () => {
      dpr = window.devicePixelRatio || 1;
      escala = Math.max(TAMANHO, Math.round(TAMANHO * dpr));
    };

    const posicionar = () => {
      if (!temPosicao) return;
      const [pontaX, pontaY] = ATLAS.cursores[desenho].ponta;
      const [, , w, h] = regiaoDe(desenho);
      // canto do sprite no pixel físico: sem isso a arte borra fora dos 100%
      const px = Math.round(x * dpr) - pontaX * escala;
      const py = Math.round(y * dpr) - pontaY * escala;
      canvas.style.transform = `translate3d(${px / dpr}px, ${py / dpr}px, 0)`;
      if (!alvo.acao && !alvo.objeto) return;
      let rx = (px + w * escala) / dpr + FOLGA;
      if (rx + larguraRotulo > window.innerWidth - FOLGA) rx = px / dpr - FOLGA - larguraRotulo;
      const meio = (py + (h * escala) / 2) / dpr;
      const ry = Math.min(Math.max(FOLGA, meio - alturaRotulo / 2), window.innerHeight - alturaRotulo - FOLGA);
      etiqueta.style.transform = `translate3d(${Math.round(rx)}px, ${Math.round(ry)}px, 0)`;
    };

    const pintar = () => {
      if (!folha || !hora) return;
      const nome: NomeCursor = alvo.cursor === "mao" && apertado ? "mao-apertando" : alvo.cursor;
      const [, , w, h] = regiaoDe(nome);
      let dados = recortes.get(nome);
      if (!dados) {
        dados = recortar(folha, regiaoDe(nome));
        recortes.set(nome, dados);
      }
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      canvas.style.width = `${(w * escala) / dpr}px`;
      canvas.style.height = `${(h * escala) / dpr}px`;
      // mesma troca pontilhada de paleta dos outros sprites quando o horário muda
      const imagem = ctx.createImageData(w, h);
      const vista = new Uint32Array(imagem.data.buffer);
      const nova = RGBA[hora.indice];
      const antiga = RGBA[hora.anterior];
      const t = hora.transicao;
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          const p = j * w + i;
          vista[p] = (t >= 1 || (BAYER4[j & 3][i & 3] + 0.5) / 16 < t ? nova : antiga)[dados[p]];
        }
      ctx.putImageData(imagem, 0, 0);
      desenho = nome;
      posicionar();
    };

    const mostrar = (visivel: boolean) => {
      el.dataset.visivel = String(visivel && ativo);
    };

    const ligar = () => {
      if (ativo || !pronto()) return;
      ativo = true;
      medirTela();
      pintar();
      html.classList.add(CLASSE_ATIVO);
    };

    const desligar = () => {
      if (!ativo) return;
      ativo = false;
      html.classList.remove(CLASSE_ATIVO);
      mostrar(false);
    };

    const trocarAlvo = (novo: Alvo) => {
      const antes = alvo;
      alvo = novo;
      if (novo.elemento !== antes.elemento) {
        observador.disconnect();
        if (novo.elemento) observador.observe(novo.elemento, { attributes: true, attributeFilter: ATRIBUTOS });
      }
      if (novo.cursor !== antes.cursor) pintar();
      if (novo.acao === antes.acao && novo.objeto === antes.objeto) return;
      const temRotulo = Boolean(novo.acao || novo.objeto);
      if (temRotulo) {
        textoAcao.textContent = novo.acao;
        textoObjeto.textContent = novo.objeto;
        larguraRotulo = etiqueta.offsetWidth;
        alturaRotulo = etiqueta.offsetHeight;
      }
      etiqueta.dataset.visivel = String(temRotulo);
      posicionar();
    };

    // o rótulo acompanha mudanças no próprio alvo (a luminária acende e o verbo vira "apagar")
    const observador = new MutationObserver(() => {
      if (alvo.elemento) trocarAlvo(lerAlvo(alvo.elemento));
    });

    /** Reavalia o que está sob o ponteiro parado: a página rolou ou um clique trocou o conteúdo. */
    const reavaliar = () => {
      if (quadro || !temPosicao) return;
      quadro = requestAnimationFrame(() => {
        quadro = 0;
        trocarAlvo(lerAlvo(document.elementFromPoint(x, y)));
      });
    };

    const aoMover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        desligar();
        return;
      }
      x = e.clientX;
      y = e.clientY;
      temPosicao = true;
      if (!ativo) {
        if (!permitido() || !pronto()) return;
        trocarAlvo(lerAlvo(e.target as Element));
        ligar();
      } else if (window.devicePixelRatio !== dpr) {
        medirTela();
        pintar();
      }
      // sobre a barra de rolagem vale o cursor do sistema
      mostrar(x < html.clientWidth && y < html.clientHeight);
      posicionar();
    };

    const aoEntrar = (e: PointerEvent) => {
      if (e.pointerType === "mouse") trocarAlvo(lerAlvo(e.target as Element));
    };

    const aoApertar = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        desligar();
        return;
      }
      if (e.button !== 0) return;
      apertado = true;
      if (alvo.cursor === "mao") pintar();
    };

    const aoSoltar = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (apertado) {
        apertado = false;
        if (alvo.cursor === "mao") pintar();
      }
      reavaliar();
    };

    const aoSair = () => mostrar(false);

    const reconsiderar = () => {
      if (!permitido()) {
        desligar();
        return;
      }
      if (!temPosicao) return;
      ligar();
      mostrar(true);
    };

    const soltarHora = assinar((estado) => {
      hora = estado;
      pintar();
    });
    carregarFolhas()
      .then((folhas) => {
        if (!vivo) return;
        folha = folhas.sprites;
        pintar();
      })
      .catch(() => {});

    const passivo = { passive: true } as const;
    window.addEventListener("pointermove", aoMover, passivo);
    window.addEventListener("pointerover", aoEntrar, passivo);
    window.addEventListener("pointerdown", aoApertar, passivo);
    window.addEventListener("pointerup", aoSoltar, passivo);
    window.addEventListener("scroll", reavaliar, passivo);
    window.addEventListener("dragstart", aoSair, passivo);
    html.addEventListener("pointerleave", aoSair, passivo);
    mouse.addEventListener("change", reconsiderar);
    altoContraste.addEventListener("change", reconsiderar);
    const soltarPreferencia = assinarCursorPixel(reconsiderar);

    return () => {
      vivo = false;
      cancelAnimationFrame(quadro);
      observador.disconnect();
      soltarHora();
      soltarPreferencia();
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerover", aoEntrar);
      window.removeEventListener("pointerdown", aoApertar);
      window.removeEventListener("pointerup", aoSoltar);
      window.removeEventListener("scroll", reavaliar);
      window.removeEventListener("dragstart", aoSair);
      html.removeEventListener("pointerleave", aoSair);
      mouse.removeEventListener("change", reconsiderar);
      altoContraste.removeEventListener("change", reconsiderar);
      html.classList.remove(CLASSE_ATIVO);
    };
  }, []);

  return (
    <div ref={raiz} className="cursor-pixel" data-visivel="false" aria-hidden="true">
      <canvas ref={tela} className="cursor-pixel-sprite" width={16} height={16} />
      <span ref={rotulo} className="cursor-pixel-rotulo moldura pixel text-pixel-1" data-visivel="false">
        <span className="text-ambar" />
        <span className="text-creme" />
      </span>
    </div>
  );
}
