"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { saveConfigAction } from "@/app/actions/config";
import { useSession } from "@/hooks/use-session";
import { isAccessDeniedError } from "@/lib/errors";
import { showLpUpgradeToast } from "@/lib/toast";
import {
  type GlobalConfigFormProps,
  type GlobalConfigFormValues,
  globalConfigFormDefaultValues,
} from "../global-config-form.types";
import { globalConfigFormSchema } from "../schema";

/**
 * Cada secao de configuracoes edita apenas parte dos campos, mas o form
 * carrega o GlobalConfig inteiro para nao sobrescrever as demais secoes
 * ao salvar (saveConfigAction sempre grava o objeto completo).
 */
export function useGlobalConfigForm({ initialData }: GlobalConfigFormProps) {
  const router = useRouter();
  const session = useSession();
  const defaultValues = useMemo(
    () => globalConfigFormDefaultValues(initialData),
    [initialData],
  );
  const form = useForm<GlobalConfigFormValues>({
    resolver: zodResolver(globalConfigFormSchema),
    defaultValues,
  });

  async function handleSubmit(values: GlobalConfigFormValues) {
    const result = await saveConfigAction(values);

    if (!result.ok) {
      if (isAccessDeniedError(result.error)) {
        showLpUpgradeToast(session);
      } else {
        toast.error(result.error);
      }
      return;
    }

    form.reset(values);
    router.refresh();
    toast.success("Configuracoes salvas com sucesso.");
  }

  return { form, defaultValues, onSubmit: form.handleSubmit(handleSubmit) };
}
