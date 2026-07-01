export type Period = "today" | "yesterday" | "week" | "month" | "custom";

/** Tipo de retorno padrão para Server Actions. */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; code: string; message: string };
