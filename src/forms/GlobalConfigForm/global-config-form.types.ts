import { z } from "zod";
import {
  normalizeGlobalConfig,
  type GlobalConfig,
} from "@/lib/landing-pages/global-config";
import { globalConfigFormSchema } from "./schema";

export type GlobalConfigFormValues = z.infer<typeof globalConfigFormSchema>;

export type GlobalConfigFormProps = {
  initialData: GlobalConfig;
};

export function globalConfigFormDefaultValues(
  initialData: GlobalConfig,
): GlobalConfigFormValues {
  return normalizeGlobalConfig(initialData);
}
