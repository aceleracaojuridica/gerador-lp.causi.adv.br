"use client";

import { AutoTextarea } from "@/components/auto-textarea";
import { BuilderField } from "@/components/builder/shared/fields";
import { Badge } from "@/components/ui/badge";
import { FormControl, FormField, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import type { SeoMeta } from "@/lib/landing-pages/schema";
import {
  SEO_DESC_IDEAL,
  SEO_DESC_MAX,
  SEO_TITLE_IDEAL,
  SEO_TITLE_MAX,
  seoCharStatus,
} from "@/lib/landing-pages/seo";
import { FieldGroup } from "../controls/editor-controls";

function SeoCharHint({
  status,
  ok,
  long,
  short,
}: {
  status: "ok" | "short" | "long";
  ok: string;
  long: string;
  short: string;
}) {
  const charCls =
    status === "ok"
      ? "text-emerald-600"
      : status === "long"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <p className={`mt-0.5 text-[0.7rem] ${charCls}`}>
      {status === "ok" ? ok : status === "long" ? long : short}
    </p>
  );
}

/** Painel de edição do SEO: título, descrição, keywords, OG image, indexação. */
export function SeoPanel({ form }: { form: LpEditorForm }) {
  const rhf = form.form;
  const seo: Partial<SeoMeta> = form.schema.seo ?? {};
  const rawSeo: Partial<SeoMeta> = form.copy.seo ?? {};

  const titleLen = (rawSeo.title ?? seo.title ?? "").length;
  const descLen = (rawSeo.description ?? seo.description ?? "").length;
  const titleStatus = seoCharStatus(titleLen, SEO_TITLE_IDEAL, SEO_TITLE_MAX);
  const descStatus = seoCharStatus(descLen, SEO_DESC_IDEAL, SEO_DESC_MAX);
  const indexable = rawSeo.indexable ?? seo.indexable ?? false;

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        Gerados automaticamente pela IA. Edite aqui para personalizar o que
        aparece nos resultados de busca e no compartilhamento em redes sociais.
      </p>

      <FieldGroup title="Título e descrição">
        <FormField
          control={rhf.control}
          name="copy.seo.title"
          render={({ field }) => (
            <BuilderField
              label={`Título (${titleLen}/${SEO_TITLE_MAX} chars)`}
              hint="Aparece na aba do navegador e nos resultados de busca."
            >
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? rawSeo.title ?? seo.title ?? ""}
                  aria-label="Título SEO"
                  maxLength={SEO_TITLE_MAX + 10}
                />
              </FormControl>
              <SeoCharHint
                status={titleStatus}
                ok="Comprimento ideal"
                long="Muito longo — será cortado"
                short="Pode ser mais descritivo"
              />
              <FormMessage />
            </BuilderField>
          )}
        />
        <FormField
          control={rhf.control}
          name="copy.seo.description"
          render={({ field }) => (
            <BuilderField
              label={`Descrição (${descLen}/${SEO_DESC_MAX} chars)`}
              hint="Aparece abaixo do título nos resultados de busca."
            >
              <FormControl>
                <AutoTextarea
                  {...field}
                  value={
                    field.value ?? rawSeo.description ?? seo.description ?? ""
                  }
                  aria-label="Descrição SEO"
                  className="min-h-[80px] resize-y"
                />
              </FormControl>
              <SeoCharHint
                status={descStatus}
                ok="Comprimento ideal"
                long="Muito longa — será cortada"
                short="Pode ser mais descritiva"
              />
              <FormMessage />
            </BuilderField>
          )}
        />
        <FormField
          control={rhf.control}
          name="copy.seo.keywords"
          render={({ field }) => (
            <BuilderField
              label="Palavras-chave"
              hint="Separadas por vírgula. Ex: direito trabalhista, advogado SP"
            >
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? rawSeo.keywords ?? seo.keywords ?? ""}
                  aria-label="Keywords SEO"
                  placeholder="direito trabalhista, advogado, São Paulo"
                />
              </FormControl>
              <FormMessage />
            </BuilderField>
          )}
        />
      </FieldGroup>

      <FieldGroup title="Indexação e redes sociais">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              Indexável nos buscadores
            </p>
            <p className="text-xs text-muted-foreground">
              Desative para LPs de tráfego pago (Google/Meta Ads).
            </p>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 cursor-pointer"
            onClick={() => form.setSeoField("indexable", !indexable)}
          >
            {indexable ? "Indexável" : "Noindex"}
          </Badge>
        </div>
        <FormField
          control={rhf.control}
          name="copy.seo.ogImage"
          render={({ field }) => (
            <BuilderField
              label="Imagem de compartilhamento (OG)"
              hint="Aparece ao compartilhar em WhatsApp, Instagram etc. 1200×630px."
            >
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? rawSeo.ogImage ?? seo.ogImage ?? ""}
                  aria-label="OG Image URL"
                  placeholder="https://..."
                  inputMode="url"
                />
              </FormControl>
              <FormMessage />
            </BuilderField>
          )}
        />
      </FieldGroup>
    </div>
  );
}
