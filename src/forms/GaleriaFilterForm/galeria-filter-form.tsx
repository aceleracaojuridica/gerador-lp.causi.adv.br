"use client";

import { useMemo } from "react";
import type { GalleryLandingPageDto } from "@/app/actions/gallery";
import { Field, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  EntityCombobox,
  EntityComboboxContent,
  EntityComboboxInputTrigger,
} from "@/components/ui-patterns/entity-combobox";
import {
  EntityItem,
  EntityItemDescription,
  EntityItemTextGroup,
  EntityItemTitle,
} from "@/components/ui-patterns/entity-item";
import {
  GALLERY_IMAGE_FILTER_OPTIONS,
  type GalleryImageFilter,
} from "@/lib/landing-pages/gallery-filters";
import type {
  GaleriaFilterFormProps,
  GaleriaFilterValues,
} from "./galeria-filter-form.types";

type LpFilterOption = GalleryLandingPageDto & {
  isAll?: boolean;
};

function lpFilterLabel(lp: LpFilterOption): string {
  if (lp.isAll) return "Todas as páginas";
  return `/${lp.slug}`;
}

function lpFilterDescription(lp: LpFilterOption): string {
  if (lp.isAll) return "Exibir imagens de todas as landing pages";
  const parts = [lp.name.trim(), lp.officeSubdomain.trim()].filter(Boolean);
  return parts.join(" · ");
}

function updateValues(
  current: GaleriaFilterValues,
  patch: Partial<GaleriaFilterValues>,
  onValuesChange: (values: GaleriaFilterValues) => void,
) {
  onValuesChange({ ...current, ...patch });
}

export function GaleriaFilterForm({
  id,
  values,
  landingPages,
  allLpsValue,
  onValuesChange,
  onSubmit,
}: GaleriaFilterFormProps) {
  const lpOptions = useMemo<LpFilterOption[]>(
    () => [
      {
        slug: allLpsValue,
        name: "Todas as páginas",
        officeSubdomain: "",
        isAll: true,
      },
      ...landingPages,
    ],
    [allLpsValue, landingPages],
  );

  const selectedLp = useMemo(
    () => lpOptions.find((lp) => lp.slug === values.lpSlug) ?? lpOptions[0],
    [lpOptions, values.lpSlug],
  );

  return (
    <form
      id={id}
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <Field>
        <FieldLabel>Página</FieldLabel>
        <EntityCombobox
          items={lpOptions}
          value={selectedLp}
          onValueChange={(lp) =>
            lp && updateValues(values, { lpSlug: lp.slug }, onValuesChange)
          }
          getLabel={(lp) =>
            lp.isAll
              ? "Todas as páginas"
              : `${lp.name} /${lp.slug} ${lp.officeSubdomain}`.trim()
          }
          getKey={(lp) => lp.slug}
          searchPlaceholder="Buscar por nome ou slug…"
          emptyMessage="Nenhuma página encontrada"
        >
          <EntityComboboxInputTrigger
            triggerVariant="input"
            size="sm"
            placeholder="Todas as páginas"
          >
            {(lp: LpFilterOption) => (
              <span className="min-w-0 truncate">{lpFilterLabel(lp)}</span>
            )}
          </EntityComboboxInputTrigger>
          <EntityComboboxContent>
            {(lp: LpFilterOption) => (
              <EntityItem>
                <EntityItemTextGroup>
                  <EntityItemTitle>{lpFilterLabel(lp)}</EntityItemTitle>
                  <EntityItemDescription>
                    {lpFilterDescription(lp)}
                  </EntityItemDescription>
                </EntityItemTextGroup>
              </EntityItem>
            )}
          </EntityComboboxContent>
        </EntityCombobox>
      </Field>

      <Field>
        <FieldLabel>Origem</FieldLabel>
        <ToggleGroup
          type="single"
          variant="secondary"
          value={values.origem}
          onValueChange={(val) =>
            val &&
            updateValues(
              values,
              { origem: val as GalleryImageFilter },
              onValuesChange,
            )
          }
          size="sm"
          stretch
          spacing={1.2}
          className="w-full flex-wrap"
        >
          {GALLERY_IMAGE_FILTER_OPTIONS.map(({ value, label }) => (
            <ToggleGroupItem key={value} value={value} aria-label={label}>
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
    </form>
  );
}
