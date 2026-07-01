export const ACCESS_DENIED_ERROR = "Acesso negado ao gerador de landing pages.";

export const LP_ERRORS = {
  FORBIDDEN_ACTION: "Você não tem permissão para esta ação.",
  DELETE_LP_OWNER_ONLY:
    "Somente o proprietário da conta pode excluir landing pages.",
  EDIT_LP_OWN_ONLY: "Você só pode editar landing pages que você criou.",
  DELETE_IMAGE_OWNER_UPLOAD:
    "Você não pode remover imagens enviadas pelo proprietário da conta.",
  IMAGE_IN_USE: "Esta imagem está sendo usada em landing pages.",
  IMAGE_FK:
    "Não é possível remover: a imagem ainda está vinculada a uma landing page.",
} as const;

export function isAccessDeniedError(message: string): boolean {
  return message === ACCESS_DENIED_ERROR;
}

type DbErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export type LpToastMessage = {
  title: string;
  description: string;
};

/**
 * Converte erros do Supabase/Postgres em mensagens amigáveis para toast.
 */
export function mapLpDbError(error: unknown): LpToastMessage {
  const err = error as DbErrorLike;
  const message = err?.message ?? "";
  const code = err?.code ?? "";

  if (
    code === "42501" ||
    /permission denied|row-level security/i.test(message)
  ) {
    if (/landing_pages.*delete|delete.*landing/i.test(message)) {
      return {
        title: "Exclusão não permitida",
        description: LP_ERRORS.DELETE_LP_OWNER_ONLY,
      };
    }
    if (/lp_account_images/i.test(message)) {
      return {
        title: "Exclusão não permitida",
        description: LP_ERRORS.DELETE_IMAGE_OWNER_UPLOAD,
      };
    }
    return {
      title: "Acesso negado",
      description: LP_ERRORS.FORBIDDEN_ACTION,
    };
  }

  if (code === "P0001" && message.startsWith("LP_IMAGE_IN_USE:")) {
    const names = message.replace("LP_IMAGE_IN_USE:", "").trim();
    return {
      title: "Imagem em uso",
      description: names
        ? `Esta imagem está sendo usada em: ${names}.`
        : LP_ERRORS.IMAGE_IN_USE,
    };
  }

  if (code === "23503") {
    return {
      title: "Não é possível remover",
      description: LP_ERRORS.IMAGE_FK,
    };
  }

  if (message.includes("slug-conflict")) {
    return {
      title: "Slug indisponível",
      description: "Este endereço já está em uso por outra landing page.",
    };
  }

  return {
    title: "Algo deu errado",
    description: message || "Tente novamente em instantes.",
  };
}

export function mapLpMessageError(message: string): LpToastMessage {
  if (message === ACCESS_DENIED_ERROR) {
    return {
      title: "Acesso negado",
      description: message,
    };
  }
  if (message === LP_ERRORS.EDIT_LP_OWN_ONLY) {
    return { title: "Edição não permitida", description: message };
  }
  return mapLpDbError({ message });
}
