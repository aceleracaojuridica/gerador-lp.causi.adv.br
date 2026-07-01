"use client";

import { Add } from "@material-symbols-svg/react";
import { useState } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";
import {
  isValidPhoneNumber,
  parsePhoneNumber as parsePhoneNumberFromInput,
} from "react-phone-number-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui-patterns/phone-input";

interface IgnoredContactsFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  inputId?: string;
}

function normalizePhoneToE164(inputValue: string): string | null {
  if (!isValidPhoneNumber(inputValue)) return null;
  const parsed = parsePhoneNumberFromInput(inputValue);
  if (!parsed?.isValid()) return null;
  return parsed.number;
}

function formatIgnoredContactForDisplay(value: string): string {
  try {
    const parsed = parsePhoneNumberFromInput(value);
    if (!parsed?.isValid()) return value;

    if (parsed.country === "BR") {
      const national = parsed.formatNational();
      return national.replace(/^(\(\d{2}\)\s\d)(\d{4}-\d{4})$/, "$1 $2");
    }

    return parsed.formatInternational();
  } catch {
    return value;
  }
}

export function IgnoredContactsField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({ control, name, inputId }: IgnoredContactsFieldProps<TFieldValues, TName>) {
  const [inputValue, setInputValue] = useState("");
  const { field } = useController({ control, name });
  const contacts = (field.value as string[]) ?? [];
  const normalizedInput = normalizePhoneToE164(inputValue);
  const canAdd = Boolean(
    normalizedInput && !contacts.includes(normalizedInput),
  );

  function addIgnoredContact() {
    if (!normalizedInput || contacts.includes(normalizedInput)) {
      return;
    }

    field.onChange([...contacts, normalizedInput]);
    setInputValue("");
  }

  function removeIgnoredContact(value: string) {
    field.onChange(contacts.filter((contact) => contact !== value));
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium leading-none">
        Ignorar contatos
      </label>
      <p className="text-xs text-muted-foreground">
        Adicione os números de contato (com DDI + DDD) que não devem ser
        inseridos no Causi
      </p>

      <div className="relative flex-1">
        <PhoneInput
          id={inputId}
          international
          limitMaxLength
          countryCallingCodeEditable={false}
          defaultCountry="BR"
          placeholder="Informe um telefone"
          value={inputValue}
          onChange={(value) => setInputValue(value ?? "")}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addIgnoredContact();
            }
          }}
          className="w-full [&_.PhoneInputInput]:pr-10"
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute top-1/2 right-1 z-20 h-6 w-6 -translate-y-1/2 border-muted-foreground/20 bg-background p-0 pointer-events-auto"
          onClick={addIgnoredContact}
          disabled={!canAdd}
        >
          <Add className="size-4 text-primary/40" />
        </Button>
      </div>

      {contacts.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {contacts.map((contact) => (
            <Badge
              key={contact}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeIgnoredContact(contact)}
            >
              {formatIgnoredContactForDisplay(contact)}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
