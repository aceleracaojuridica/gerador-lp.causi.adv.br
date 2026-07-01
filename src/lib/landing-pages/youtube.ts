// Extrai o ID de um vídeo do YouTube a partir de um link colado (ou do próprio
// ID). Aceita watch?v=, youtu.be/, embed/, shorts/. Se não casar, devolve o que
// veio (não quebra) — o usuário leigo cola o link e a gente resolve.
export function extractYouTubeId(input: string): string {
  const s = (input || "").trim();
  if (!s) return "";
  if (/^[\w-]{11}$/.test(s)) return s; // já é um ID
  const patterns = [
    /[?&]v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/(?:embed|shorts|v)\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) return m[1];
  }
  return s;
}
