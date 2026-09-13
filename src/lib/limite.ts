import "server-only";
/**
 * Limite de uso do terminal.
 *
 * Com UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN configurados, o contador fica no Redis
 * e vale para todas as instâncias. Sem eles, cai para memória: cada instância serverless conta
 * sozinha — serve de freio, não de garantia. O teto de gasto de verdade fica no painel da Anthropic.
 */
import { createHash } from "node:crypto";
import { LIMITE_POR_HORA } from "@/conteudo/terminal";

const HORA_MS = 60 * 60 * 1000;
const LIMITE_DIARIO = Number(process.env.IA_LIMITE_DIARIO ?? 300);

export interface Consumo {
  permitido: boolean;
  restantes: number;
  motivo?: "visitante" | "diario";
}

const memoria = new Map<string, number[]>();
let diario = { dia: "", total: 0 };

function chaveVisitante(ip: string): string {
  // o IP nunca é guardado em claro
  return createHash("sha256").update(`terminal:${ip}`).digest("hex").slice(0, 24);
}

function consumirMemoria(chave: string): Consumo {
  const agora = Date.now();
  const hoje = new Date(agora).toISOString().slice(0, 10);
  if (diario.dia !== hoje) diario = { dia: hoje, total: 0 };
  if (diario.total >= LIMITE_DIARIO) return { permitido: false, restantes: 0, motivo: "diario" };

  const recentes = (memoria.get(chave) ?? []).filter((t) => agora - t < HORA_MS);
  if (recentes.length >= LIMITE_POR_HORA) {
    memoria.set(chave, recentes);
    return { permitido: false, restantes: 0, motivo: "visitante" };
  }
  recentes.push(agora);
  memoria.set(chave, recentes);
  diario.total++;
  // não deixa o mapa crescer sem fim numa instância que vive muito
  if (memoria.size > 5000) {
    for (const [k, v] of memoria) if (v.every((t) => agora - t >= HORA_MS)) memoria.delete(k);
  }
  return { permitido: true, restantes: LIMITE_POR_HORA - recentes.length };
}

async function consumirRedis(chave: string, url: string, token: string): Promise<Consumo> {
  const hora = Math.floor(Date.now() / HORA_MS);
  const dia = new Date().toISOString().slice(0, 10);
  const kVisitante = `terminal:v:${chave}:${hora}`;
  const kDia = `terminal:d:${dia}`;
  const resposta = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", kVisitante],
      ["EXPIRE", kVisitante, 3600],
      ["INCR", kDia],
      ["EXPIRE", kDia, 90000],
    ]),
    cache: "no-store",
  });
  if (!resposta.ok) throw new Error(`redis ${resposta.status}`);
  const [visitante, , total] = (await resposta.json()) as { result: number }[];
  if (total.result > LIMITE_DIARIO) return { permitido: false, restantes: 0, motivo: "diario" };
  if (visitante.result > LIMITE_POR_HORA) return { permitido: false, restantes: 0, motivo: "visitante" };
  return { permitido: true, restantes: Math.max(0, LIMITE_POR_HORA - visitante.result) };
}

export async function consumir(ip: string): Promise<Consumo> {
  const chave = chaveVisitante(ip);
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      return await consumirRedis(chave, url, token);
    } catch (erro) {
      console.error("limite: Redis indisponível, usando memória", erro);
    }
  }
  return consumirMemoria(chave);
}
