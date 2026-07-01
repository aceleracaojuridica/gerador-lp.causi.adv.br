"use client";

import { useSession } from "@/hooks/use-session";
import {
  canDeleteGalleryImage,
  canDeleteLp,
  canEditLp,
  canManageAllLps,
} from "@/lib/landing-pages/permissions";

/** Permissões de LP no cliente (derivadas da sessão Causi). */
export function useLpPermissions(createdByUserId?: string) {
  const session = useSession();

  return {
    canManageAll: canManageAllLps(session),
    canDelete: canDeleteLp(session),
    canEdit: createdByUserId
      ? canEditLp(session, createdByUserId)
      : canManageAllLps(session),
    canDeleteImage: (uploadedByUserId: string, inUse: boolean) =>
      canDeleteGalleryImage(session, uploadedByUserId, inUse),
    session,
  };
}
