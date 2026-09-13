"use client";
/**
 * GSAP registrado uma vez. Todos os plugins são gratuitos desde 2025.
 * Sem ScrollSmoother/Lenis de propósito: rolagem suavizada gera posição subpixel e borra sprite.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip, Observer, useGSAP);

export const COM_MOVIMENTO = "(prefers-reduced-motion: no-preference)";
export const SEM_MOVIMENTO = "(prefers-reduced-motion: reduce)";

export function prefereMenosMovimento(): boolean {
  return typeof window !== "undefined" && window.matchMedia(SEM_MOVIMENTO).matches;
}

export { Flip, gsap, Observer, ScrollTrigger, SplitText, useGSAP };
