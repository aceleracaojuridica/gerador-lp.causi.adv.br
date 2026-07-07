import Link from "next/link";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import type { GlobalConfigFormValues } from "../global-config-form.types";

export function ConfigFormFooter({
  form,
  defaultValues,
}: {
  form: UseFormReturn<GlobalConfigFormValues>;
  defaultValues: GlobalConfigFormValues;
}) {
  return (
    <CardFooter className="flex flex-col gap-3 border-t sm:flex-row sm:items-center sm:justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={() => form.reset(defaultValues)}
        disabled={form.formState.isSubmitting || !form.formState.isDirty}
      >
        Desfazer alteracoes
      </Button>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando..." : "Salvar configuracoes"}
        </Button>
      </div>
    </CardFooter>
  );
}
