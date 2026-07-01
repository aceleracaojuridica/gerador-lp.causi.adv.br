import type { Session } from "@/lib/session/types";

const OWNER_ACCESS_LEVEL = 100;
const SUPER_ADMIN_ACCESS_LEVEL = 999;

/** Proprietário da conta ou super admin — CRUD total em LPs e galeria. */
export function canManageAllLps(session: Session): boolean {
  return (
    session.role.accessLevel >= SUPER_ADMIN_ACCESS_LEVEL ||
    session.role.accessLevel >= OWNER_ACCESS_LEVEL
  );
}

/** Pode editar uma LP específica (criador ou gestor). */
export function canEditLp(session: Session, createdByUserId: string): boolean {
  if (canManageAllLps(session)) return true;
  return session.user.id === createdByUserId;
}

/** Pode excluir LPs (somente owner/super_admin). */
export function canDeleteLp(session: Session): boolean {
  return canManageAllLps(session);
}

/** Pode excluir imagem da galeria (própria, sem uso, ou gestor). */
export function canDeleteGalleryImage(
  session: Session,
  uploadedByUserId: string,
  inUse: boolean,
): boolean {
  if (canManageAllLps(session)) return !inUse;
  return session.user.id === uploadedByUserId && !inUse;
}
