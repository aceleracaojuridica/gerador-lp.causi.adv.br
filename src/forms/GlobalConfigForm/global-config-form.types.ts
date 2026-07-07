import type { z } from "zod";
import {
  type GlobalConfig,
  normalizeGlobalConfig,
} from "@/lib/landing-pages/global-config";
import type { globalConfigFormSchema } from "./schema";

export type GlobalConfigFormValues = z.infer<typeof globalConfigFormSchema>;

export type GlobalConfigFormProps = {
  initialData: GlobalConfig;
};

export function globalConfigFormDefaultValues(
  initialData: GlobalConfig,
): GlobalConfigFormValues {
  return normalizeGlobalConfig(initialData);
}
