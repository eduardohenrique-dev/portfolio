"use client";
/**
 * Terminal com IA de verdade: POST /api/pergunta devolve texto em streaming.
 * Se a rede cair antes de chegar ao servidor, responde em modo offline aqui mesmo.
 */
import { useEffect, useRef, useState } from "react";
import { TAMANHO_MAXIMO_PERGUNTA } from "@/conteudo/terminal";
import { responderOffline } from "@/lib/offline";

interface Props {
  titulo: string;
  texto: string;
  boasVindas: string;
  sugestoes: string[];
}

type Modo = "ia" | "offline";

interface Entrada {
  id: number;
  papel: "visitante" | "terminal";
  texto: string;
  modo?: Modo;
  motivo?: string;
  pronta: boolean;
}

const MOTIVOS: Record<string, string> = {
  "sem-chave": "a chave da API ainda não foi configurada",
  limite: "você usou as perguntas desta hora",
  "limite-diario": "a cota do dia acabou",
  erro: "a API não respondeu",
  demora: "a API demorou demais",
  recusa: "a API recusou a pergunta",
  vazio: "a API voltou sem texto",
  rede: "sem conexão com o servidor",
};

export function Terminal({ titulo, texto, boasVindas, sugestoes }: Props) {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [restantes, setRestantes] = useState<number | null>(null);
  const registro = useRef<HTMLDivElement>(null);
  const contador = useRef(0);

  useEffect(() => {
    const el = registro.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entradas]);

  async function enviar(textoPergunta: string) {
    const limpa = textoPergunta.trim().slice(0, TAMANHO_MAXIMO_PERGUNTA);
    if (!limpa || ocupado) return;
    setPergunta("");
    setOcupado(true);
    const idVisitante = ++contador.current;
    const idResposta = ++contador.current;
    const historico = entradas
      .filter((e) => e.pronta && e.modo !== "offline")
      .slice(-6)
      .map((e) => ({ papel: e.papel, texto: e.texto }));
    setEntradas((atual) => [
      ...atual,
      { id: idVisitante, papel: "visitante", texto: limpa, pronta: true },
      { id: idResposta, papel: "terminal", texto: "", pronta: false },
    ]);
    const atualizar = (parcial: Partial<Entrada>) =>
      setEntradas((atual) => atual.map((e) => (e.id === idResposta ? { ...e, ...parcial } : e)));

    try {
      const resposta = await fetch("/api/pergunta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: limpa, historico }),
      });
      if (!resposta.ok || !resposta.body) throw new Error(String(resposta.status));
      const modo = (resposta.headers.get("X-Modo") as Modo) ?? "ia";
      const motivo = resposta.headers.get("X-Motivo") ?? undefined;
      const r = resposta.headers.get("X-Restantes");
      if (r !== null) setRestantes(Number(r));
      atualizar({ modo, motivo });

      const leitor = resposta.body.getReader();
      const decodificador = new TextDecoder();
      let acumulado = "";
      let quadro = 0;
      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        acumulado += decodificador.decode(value, { stream: true });
        // agrupa atualizações por quadro para não re-renderizar a cada token
        if (!quadro) {
          quadro = requestAnimationFrame(() => {
            quadro = 0;
            atualizar({ texto: acumulado });
          });
        }
      }
      cancelAnimationFrame(quadro);
      atualizar({ texto: acumulado + decodificador.decode(), pronta: true });
    } catch {
      atualizar({ texto: responderOffline(limpa), modo: "offline", motivo: "rede", pronta: true });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section id="terminal" aria-labelledby="titulo-terminal" className="mx-auto max-w-pagina px-5 py-20 md:px-10 md:py-24">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <h2 id="titulo-terminal" className="pixel text-pixel-2 text-creme md:text-pixel-3">
            {titulo}
          </h2>
          <p className="mt-4 max-w-texto text-bruma">{texto}</p>
        </div>

        <div className="moldura flex min-w-0 flex-col bg-fundo lg:col-span-8">
          <div className="flex items-center justify-between gap-4 border-b-4 border-linha px-4 py-2">
            <span className="pixel text-pixel-2 text-creme">terminal</span>
            <span className="pixel text-pixel-2 text-bruma" aria-live="polite">
              {restantes === null ? "claude" : `${restantes} perguntas nesta hora`}
            </span>
          </div>

          <div
            ref={registro}
            role="log"
            aria-live="polite"
            aria-busy={ocupado}
            aria-label="Conversa com o terminal"
            className="terminal-registro flex h-96 flex-col gap-5 overflow-y-auto px-4 py-5"
            tabIndex={0}
          >
            <p className="text-bruma">
              <span className="pixel mr-2 text-pixel-2 text-salvia">sistema</span>
              {boasVindas}
            </p>
            {entradas.map((e) => (
              <div key={e.id} className="flex flex-col gap-1">
                <p className="pixel text-pixel-2">
                  {e.papel === "visitante" ? (
                    <span className="text-ambar">você</span>
                  ) : e.modo === "offline" ? (
                    <span className="text-rosa">offline</span>
                  ) : (
                    <span className="text-salvia">claude</span>
                  )}
                </p>
                {e.papel === "terminal" && e.modo === "offline" && e.motivo && (
                  <p className="text-miudo text-rosa">Resposta pronta, sem IA: {MOTIVOS[e.motivo] ?? e.motivo}.</p>
                )}
                <p className={e.papel === "visitante" ? "text-creme" : "whitespace-pre-line text-creme"}>
                  {e.texto}
                  {!e.pronta && <span className="cursor-terminal" aria-hidden="true" />}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 border-t-4 border-linha px-4 pt-4">
            {sugestoes.map((s) => (
              <button key={s} type="button" className="sugestao" disabled={ocupado} onClick={() => enviar(s)}>
                {s}
              </button>
            ))}
          </div>

          <form
            className="flex items-center gap-3 px-4 py-4"
            onSubmit={(ev) => {
              ev.preventDefault();
              enviar(pergunta);
            }}
          >
            <label htmlFor="pergunta" className="pixel text-pixel-2 text-ambar">
              <span aria-hidden="true">&gt;</span>
              <span className="sr-only">Sua pergunta</span>
            </label>
            <input
              id="pergunta"
              name="pergunta"
              value={pergunta}
              onChange={(ev) => setPergunta(ev.target.value)}
              maxLength={TAMANHO_MAXIMO_PERGUNTA}
              autoComplete="off"
              placeholder="Escreva uma pergunta"
              className="campo w-0 min-w-0 flex-1"
            />
            <button type="submit" className="botao" disabled={ocupado || !pergunta.trim()}>
              {ocupado ? "..." : "enviar"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
