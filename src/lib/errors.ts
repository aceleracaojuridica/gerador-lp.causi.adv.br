export const ACCESS_DENIED_ERROR = "Acesso negado ao gerador de landing pages.";

export function isAccessDeniedError(message: string): boolean {
  return message === ACCESS_DENIED_ERROR;
}
