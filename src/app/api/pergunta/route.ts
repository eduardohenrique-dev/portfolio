/**
 * Terminal do portfólio: pergunta → API do Claude em streaming, com limite de uso e modo offline.
 *
 * Contrato com o navegador:
 *  - corpo: { pergunta: string, historico?: { papel: "visitante" | "terminal", texto: string }[] }
 *  - resposta: texto puro em streaming
 *  - cabeçalhos: X-Modo ("ia" | "offline"), X-Motivo (por que ficou offline), X-Restantes
 */
import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { PROMPT_SISTEMA } from "@/conteudo/conhecimento";
import { TAMANHO_MAXIMO_PERGUNTA } from "@/conteudo/terminal";
import { consumir } from "@/lib/limite";
import { responderOffline } from "@/lib/offline";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODELO = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";
const MAX_HISTORICO = 6;
const MAX_TEXTO_HISTORICO = 1500;
/** Quanto esperar o primeiro trecho antes de desistir e responder offline. */
const ESPERA_PRIMEIRO_TRECHO_MS = 15000;

interface Turno {
  papel: "visitante" | "terminal";
  texto: string;
}

function cabecalhos(extra: Record<string, string>): HeadersInit {
  return { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...extra };
}

function offline(pergunta: string, motivo: string, restantes?: number): Response {
  return new Response(responderOffline(pergunta), {
    headers: cabecalhos({ "X-Modo": "offline", "X-Motivo": motivo, ...(restantes !== undefined ? { "X-Restantes": String(restantes) } : {}) }),
  });
}

function lerCorpo(corpo: unknown): { pergunta: string; historico: Turno[] } | null {
  if (!corpo || typeof corpo !== "object") return null;
  const { pergunta, historico } = corpo as Record<string, unknown>;
  if (typeof pergunta !== "string") return null;
  const limpa = pergunta.trim();
  if (!limpa || limpa.length > TAMANHO_MAXIMO_PERGUNTA) return null;
  const turnos: Turno[] = [];
  if (Array.isArray(historico)) {
    for (const t of historico.slice(-MAX_HISTORICO)) {
      if (!t || typeof t !== "object") continue;
      const { papel, texto } = t as Record<string, unknown>;
      if ((papel === "visitante" || papel === "terminal") && typeof texto === "string" && texto.trim()) {
        turnos.push({ papel, texto: texto.slice(0, MAX_TEXTO_HISTORICO) });
      }
    }
  }
  return { pergunta: limpa, historico: turnos };
}

function montarMensagens(pergunta: string, historico: Turno[]): Anthropic.Beta.BetaMessageParam[] {
  const mensagens: Anthropic.Beta.BetaMessageParam[] = [];
  for (const t of historico) {
    const role = t.papel === "visitante" ? "user" : "assistant";
    if (mensagens.length === 0 && role === "assistant") continue; // a conversa tem de começar pelo visitante
    const anterior = mensagens.at(-1);
    if (anterior && anterior.role === role) anterior.content = `${anterior.content}\n\n${t.texto}`;
    else mensagens.push({ role, content: t.texto });
  }
  if (mensagens.at(-1)?.role === "user") mensagens.pop(); // pergunta anterior sem resposta
  mensagens.push({ role: "user", content: pergunta });
  return mensagens;
}

export async function POST(request: NextRequest): Promise<Response> {
  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return new Response("Corpo inválido.", { status: 400, headers: cabecalhos({}) });
  }
  const entrada = lerCorpo(corpo);
  if (!entrada) {
    return new Response(`Envie uma pergunta de 1 a ${TAMANHO_MAXIMO_PERGUNTA} caracteres.`, { status: 400, headers: cabecalhos({}) });
  }
  const { pergunta, historico } = entrada;

  if (!process.env.ANTHROPIC_API_KEY) return offline(pergunta, "sem-chave");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const consumo = await consumir(ip);
  if (!consumo.permitido) return offline(pergunta, consumo.motivo === "diario" ? "limite-diario" : "limite", 0);

  const cliente = new Anthropic();
  const fluxo = cliente.beta.messages.stream(
    {
      model: MODELO,
      max_tokens: 2048,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [{ type: "text", text: PROMPT_SISTEMA, cache_control: { type: "ephemeral" } }],
      messages: montarMensagens(pergunta, historico),
    },
    { signal: request.signal },
  );

  const iterador = fluxo[Symbol.asyncIterator]();
  const codificador = new TextEncoder();
  let primeiro = "";

  // espera o primeiro trecho de texto: se a API falhar logo de cara, ainda dá para responder offline
  let relogio: ReturnType<typeof setTimeout> | undefined;
  const prazo = new Promise<"prazo">((resolver) => {
    relogio = setTimeout(() => resolver("prazo"), ESPERA_PRIMEIRO_TRECHO_MS);
  });
  try {
    for (;;) {
      const proximo = iterador.next();
      proximo.catch(() => {}); // se o prazo vencer, a promessa abandonada não vira rejeição solta
      const passo = await Promise.race([proximo, prazo]);
      if (passo === "prazo") {
        fluxo.abort();
        return offline(pergunta, "demora", consumo.restantes);
      }
      if (passo.done) break;
      const evento = passo.value;
      if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
        primeiro = evento.delta.text;
        break;
      }
    }
  } catch (erro) {
    registrarErro(erro);
    return offline(pergunta, "erro", consumo.restantes);
  } finally {
    clearTimeout(relogio);
  }

  if (!primeiro) {
    const final = await fluxo.finalMessage().catch(() => null);
    const motivo = final?.stop_reason === "refusal" ? "recusa" : "vazio";
    return offline(pergunta, motivo, consumo.restantes);
  }

  const corpoResposta = new ReadableStream<Uint8Array>({
    async start(controle) {
      controle.enqueue(codificador.encode(primeiro));
      try {
        for (;;) {
          const passo = await iterador.next();
          if (passo.done) break;
          const evento = passo.value;
          if (evento.type === "content_block_delta" && evento.delta.type === "text_delta") {
            controle.enqueue(codificador.encode(evento.delta.text));
          }
        }
        const final = await fluxo.finalMessage();
        if (final.stop_reason === "max_tokens") controle.enqueue(codificador.encode("…"));
      } catch (erro) {
        registrarErro(erro);
        controle.enqueue(codificador.encode("\n\n[a conexão com a API caiu no meio da resposta]"));
      } finally {
        controle.close();
      }
    },
    cancel() {
      fluxo.abort();
    },
  });

  return new Response(corpoResposta, {
    headers: cabecalhos({ "X-Modo": "ia", "X-Restantes": String(consumo.restantes) }),
  });
}

function registrarErro(erro: unknown) {
  if (erro instanceof Anthropic.RateLimitError) console.error("terminal: limite da API da Anthropic", erro.status);
  else if (erro instanceof Anthropic.AuthenticationError) console.error("terminal: chave da API inválida", erro.status);
  else if (erro instanceof Anthropic.APIError) console.error("terminal: erro da API", erro.status, erro.message);
  else if (erro instanceof Error && erro.name === "AbortError") return;
  else console.error("terminal: erro inesperado", erro);
}
