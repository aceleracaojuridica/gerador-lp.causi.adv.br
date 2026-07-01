"use client";

import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  CityCombobox,
  StateCombobox,
} from "@/components/ui-patterns/location-combobox";

interface LocationFieldsProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  stateName: FieldPath<TFieldValues>;
  cityName: FieldPath<TFieldValues>;
  countryCode?: string;
}

/**
 * Campos compostos de localização (estado + cidade) com reset de cidade quando o estado muda.
 */
export function LocationFields<TFieldValues extends FieldValues>({
  control,
  setValue,
  stateName,
  cityName,
  countryCode = "BR",
}: LocationFieldsProps<TFieldValues>) {
  const stateCode = useWatch({ control, name: stateName });

  return (
    <div className="grid sm:grid-cols-2 gap-4 sm:gap-3">
      <Controller
        name={stateName}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Estado</FieldLabel>
            <StateCombobox
              countryCode={countryCode}
              value={(field.value as string | null | undefined) ?? null}
              onValueChange={(val) => {
                field.onChange(val ?? "");
                setValue(cityName, "" as never, {
                  shouldDirty: true,
                });
              }}
              showClear
              placeholder="Selecione um Estado"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={cityName}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Cidade</FieldLabel>
            <CityCombobox
              countryCode={countryCode}
              stateCode={(stateCode as string | undefined) || undefined}
              value={(field.value as string | null | undefined) ?? null}
              onValueChange={(val) => field.onChange(val ?? "")}
              showClear
              placeholder="Selecione uma Cidade"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  );
}
