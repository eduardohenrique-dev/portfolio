"use client";
/**
 * Liga a rolagem ao relógio da página. Com menos movimento, fixa o entardecer.
 *
 * O relógio não é linear: cada seção ancora um horário. Assim o entardecer acontece
 * enquanto a cena da abertura ainda está na tela, a luminária acende no meio da página
 * e o contato já é noite.
 */
import { definirMinutos, fixarHorario, indiceDoMinuto, MINUTO_FINAL, MINUTO_INICIAL } from "@/arte/horario";
import { prefereMenosMovimento, ScrollTrigger, useGSAP } from "./gsap";

const h = (hora: number, minuto = 0) => hora * 60 + minuto;

function topo(id: string): number | null {
  const el = document.getElementById(id);
  return el ? el.getBoundingClientRect().top + window.scrollY : null;
}

function calcularAncoras(): [number, number][] {
  const alturaTela = window.innerHeight;
  const abertura = document.getElementById("inicio");
  const fimAbertura = abertura ? abertura.offsetHeight - alturaTela : 0;
  const candidatos: [number | null, number][] = [
    [0, MINUTO_INICIAL],
    [Math.max(fimAbertura, alturaTela * 0.6), h(17, 50)],
    [topo("projetos"), h(18)],
    [topo("inventario"), h(18, 40)],
    [topo("demos"), h(19, 20)],
    [topo("terminal"), h(20, 10)],
    [(topo("contato") ?? 0) - alturaTela * 0.4, h(22)],
    [ScrollTrigger.maxScroll(window), MINUTO_FINAL],
  ];
  const ancoras: [number, number][] = [];
  for (const [posicao, minutos] of candidatos) {
    if (posicao === null) continue;
    const anterior = ancoras.at(-1);
    if (anterior && posicao <= anterior[0]) continue; // mantém a função crescente
    ancoras.push([posicao, minutos]);
  }
  return ancoras;
}

function minutosDaRolagem(ancoras: [number, number][]): number {
  const y = window.scrollY;
  for (let i = 1; i < ancoras.length; i++) {
    const [y0, m0] = ancoras[i - 1];
    const [y1, m1] = ancoras[i];
    if (y <= y1) return m0 + ((y - y0) / (y1 - y0)) * (m1 - m0);
  }
  return MINUTO_FINAL;
}

export function MovimentoRaiz() {
  useGSAP(() => {
    if (prefereMenosMovimento()) {
      fixarHorario(1);
      return;
    }
    let ancoras = calcularAncoras();
    // recarregou no meio da página: começa no horário certo, sem transição
    fixarHorario(indiceDoMinuto(minutosDaRolagem(ancoras)));
    definirMinutos(minutosDaRolagem(ancoras));

    const aoRecalcular = () => {
      ancoras = calcularAncoras();
      definirMinutos(minutosDaRolagem(ancoras));
    };
    ScrollTrigger.addEventListener("refresh", aoRecalcular);
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: () => definirMinutos(minutosDaRolagem(ancoras)),
    });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    // abrir um projeto ou trocar o item do inventário muda a altura da página:
    // o pin da trajetória e as âncoras do relógio precisam ser medidos de novo
    let alturaAnterior = document.body.scrollHeight;
    let espera = 0;
    const observador = new ResizeObserver(() => {
      const altura = document.body.scrollHeight;
      if (altura === alturaAnterior) return;
      alturaAnterior = altura;
      window.clearTimeout(espera);
      espera = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    });
    observador.observe(document.body);

    return () => {
      observador.disconnect();
      window.clearTimeout(espera);
      ScrollTrigger.removeEventListener("refresh", aoRecalcular);
    };
  });
  return null;
}
