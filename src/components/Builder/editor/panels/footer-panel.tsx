"use client";

import { Add, Close } from "@material-symbols-svg/react";
import { AutoTextarea } from "@/components/auto-textarea";
import { BuilderField } from "@/components/builder/shared/fields";
import { SocialsInput } from "@/components/builder/shared/socials-input";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import type { Office } from "@/lib/landing-pages/schema";
import { Accordion, AccordionListContext } from "../controls/editor-controls";

type FooterDetailPanelProps = {
  form: LpEditorForm;
  office: Office;
};

/** Rodapé: contato, endereços, redes e política de privacidade. */
export function FooterDetailPanel({ form, office }: FooterDetailPanelProps) {
  const rhf = form.form;

  return (
    <AccordionListContext.Provider value={true}>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        <Accordion title="Contato" flush domId="acc-ftr-contato" defaultOpen>
          <FormField
            control={rhf.control}
            name="office.whatsappDisplay"
            render={({ field }) => (
              <BuilderField label="WhatsApp">
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => form.onPhone(e.target.value)}
                    placeholder="(67) 99999-9999"
                    inputMode="tel"
                  />
                </FormControl>
                <FormMessage />
              </BuilderField>
            )}
          />
          <FormField
            control={rhf.control}
            name="office.email"
            render={({ field }) => (
              <BuilderField label="E-mail">
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    inputMode="email"
                  />
                </FormControl>
                <FormMessage />
              </BuilderField>
            )}
          />
          {(office.extraContacts ?? []).map((c, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-lg border border-border p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Contato {i + 2}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remover contato"
                  onClick={() => form.removeContact(i)}
                >
                  <Close size={14} />
                </Button>
              </div>
              <Input
                aria-label={`WhatsApp ${i + 2}`}
                value={c.whatsappDisplay}
                onChange={(e) => form.setContactPhone(i, e.target.value)}
                placeholder="(67) 99999-9999"
                inputMode="tel"
              />
              <Input
                aria-label={`E-mail ${i + 2}`}
                value={c.email}
                onChange={(e) => form.setContactEmail(i, e.target.value)}
                placeholder="contato@escritorio.com"
                inputMode="email"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={form.addContact}
          >
            <Add size={16} /> Adicionar telefone/e-mail
          </Button>
        </Accordion>

        <Accordion title="Endereço" flush domId="acc-ftr-endereco">
          <FormField
            control={rhf.control}
            name="office.address"
            render={({ field }) => (
              <BuilderField
                label="Endereço (opcional)"
                hint="Rua, número, bairro, cidade, CEP. Pode usar várias linhas."
              >
                <FormControl>
                  <AutoTextarea
                    {...field}
                    value={field.value ?? ""}
                    aria-label="Endereço"
                    className="min-h-[68px] resize-y"
                    placeholder={
                      "Rua Quinze de Novembro, 697, Centro\nPiraju - SP, CEP 18800-023"
                    }
                  />
                </FormControl>
                <FormMessage />
              </BuilderField>
            )}
          />
          <FormField
            control={rhf.control}
            name="office.city"
            render={({ field }) => (
              <BuilderField label="Cidade / Estado (opcional)">
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Cidade / Estado"
                  />
                </FormControl>
                <FormMessage />
              </BuilderField>
            )}
          />
          <FormField
            control={rhf.control}
            name="office.mapsUrl"
            render={({ field }) => (
              <BuilderField
                label="Link do Google Maps (opcional)"
                hint="Se preenchido, gera o link 'Ver mais' abaixo do endereço."
              >
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="https://maps.app.goo.gl/..."
                    inputMode="url"
                  />
                </FormControl>
                <FormMessage />
              </BuilderField>
            )}
          />
          {(office.extraAddresses ?? []).map((a, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-lg border border-border p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Endereço {i + 2}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remover endereço"
                  onClick={() => form.removeAddress(i)}
                >
                  <Close size={14} />
                </Button>
              </div>
              <AutoTextarea
                aria-label={`Endereço ${i + 2}`}
                className="min-h-[56px] resize-y"
                value={a.address}
                onChange={(e) =>
                  form.setAddressField(i, "address", e.target.value)
                }
                placeholder="Rua, número, bairro, CEP"
              />
              <Input
                aria-label={`Cidade / Estado ${i + 2}`}
                value={a.city}
                onChange={(e) =>
                  form.setAddressField(i, "city", e.target.value)
                }
                placeholder="Cidade / Estado"
              />
              <Input
                aria-label={`Link do Google Maps ${i + 2}`}
                value={a.mapsUrl}
                onChange={(e) =>
                  form.setAddressField(i, "mapsUrl", e.target.value)
                }
                placeholder="https://maps.app.goo.gl/... (opcional)"
                inputMode="url"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={form.addAddress}
          >
            <Add size={16} /> Adicionar endereço
          </Button>
        </Accordion>

        <Accordion title="Redes sociais" flush domId="acc-ftr-redes">
          <SocialsInput
            socials={office.socials}
            onChange={form.setSocialField}
            onAdd={form.addSocial}
            onRemove={form.removeSocial}
          />
        </Accordion>

        <Accordion
          title="Política de privacidade"
          flush
          domId="acc-ftr-politica"
        >
          <FormField
            control={rhf.control}
            name="office.privacyPolicy"
            render={({ field }) => (
              <BuilderField
                label="Texto da política"
                hint="Aparece como link no rodapé. Se deixar vazio, usamos um modelo LGPD padrão (com o nome e e-mail do escritório)."
              >
                <FormControl>
                  <AutoTextarea
                    {...field}
                    value={field.value ?? ""}
                    aria-label="Política de privacidade"
                    className="min-h-[120px]"
                    placeholder="Cole aqui a política de privacidade do escritório, ou deixe vazio para usar o modelo padrão."
                  />
                </FormControl>
                <FormMessage />
              </BuilderField>
            )}
          />
        </Accordion>
      </div>
    </AccordionListContext.Provider>
  );
}
