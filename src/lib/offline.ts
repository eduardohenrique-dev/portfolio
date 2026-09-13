/**
 * Modo offline do terminal: escolhe a resposta pronta com mais palavras-chave em comum.
 * Roda no servidor (fallback da rota) e no navegador (quando a rede cai).
 */
import { RESPOSTA_OFFLINE_PADRAO, RESPOSTAS_OFFLINE } from "@/conteudo/terminal";

const DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g");

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICOS, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function responderOffline(pergunta: string): string {
  const texto = ` ${normalizar(pergunta)} `;
  let melhor = { pontos: 0, resposta: RESPOSTA_OFFLINE_PADRAO };
  for (const r of RESPOSTAS_OFFLINE) {
    let pontos = 0;
    for (const chave of r.chaves) {
      const alvo = normalizar(chave);
      if (texto.includes(` ${alvo} `)) pontos += alvo.includes(" ") ? 3 : 2;
      else if (alvo.length > 4 && texto.includes(alvo)) pontos += 1;
    }
    if (pontos > melhor.pontos) melhor = { pontos, resposta: r.texto };
  }
  return melhor.resposta;
}
