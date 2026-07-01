import type { Headline } from "@/lib/landing-pages/schema";

// Renderiza pre + <span destaque> + post. `accentVar` controla a cor do trecho
// em destaque: "accent" (fundos claros) ou "accent-soft" (fundos escuros).
//
// Garante o ESPAÇO entre as partes mesmo quando a copy não traz: insere um
// espaço entre pre/em e entre em/post quando necessário (sem duplicar espaço e
// sem separar pontuação que deve ficar colada, ex.: "do seu lado.").
export function HeadlineText({
  h,
  accentVar = "accent",
}: {
  h: Headline;
  accentVar?: "accent" | "accent-soft";
}) {
  const color =
    accentVar === "accent-soft" ? "var(--lp-accent-soft)" : "var(--lp-accent)";

  const pre = h.pre ?? "";
  const em = h.em ?? "";
  const post = h.post ?? "";

  const spaceBeforeEm =
    pre.length > 0 && em.length > 0 && !/\s$/.test(pre) && !/^\s/.test(em);
  const spaceAfterEm =
    post.length > 0 &&
    em.length > 0 &&
    !/\s$/.test(em) &&
    !/^[\s.,;:!?)]/.test(post); // não separa pontuação

  return (
    <>
      {pre}
      {spaceBeforeEm ? " " : ""}
      <span style={{ color }}>{em}</span>
      {spaceAfterEm ? " " : ""}
      {post}
    </>
  );
}
