export type MediaBucket = "media" | "classroom";

/** Tipo de entidade associada a um arquivo. Usado nos metadados do Storage. */
export type MediaEntityType =
  | "user"
  | "person"
  | "conversation"
  | "course"
  | "lesson"
  | "certificate_template"
  | "user_certificate";

/**
 * Metadados padronizados salvos em `storage.objects.user_metadata` (jsonb).
 *
 * - `account_id`: ID da conta (bigint como JSON number). Obrigatório para o bucket `media`.
 * - `entity_type`: Tipo da entidade associada ao arquivo.
 * - `entity_id`: ID da entidade (bigint como JSON number ou uuid como string).
 * - `original_name`: Nome original do arquivo sanitizado, preservado para UX.
 */
export interface MediaMetadata {
  account_id?: number;
  entity_type: MediaEntityType;
  entity_id: number | string;
  original_name: string;
}

export type MediaCleanupStatus =
  | "not-requested"
  | "deleted"
  | "pending-manual-cleanup"
  | "not-found"
  | "skipped";

export type MediaMutationErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "UPLOAD_ERROR"
  | "PERSISTENCE_ERROR";

export interface MediaAsset {
  bucket: MediaBucket;
  path: string;
  publicUrl: string;
}

export interface MediaCleanupResult {
  status: MediaCleanupStatus;
  previousPath: string | null;
  message?: string;
}

export type MediaFieldErrors = Record<string, string[]>;

export type MediaMutationResult<TData> =
  | {
      success: true;
      data: TData;
    }
  | {
      success: false;
      code: MediaMutationErrorCode;
      message: string;
      fieldErrors?: MediaFieldErrors;
      cleanup?: MediaCleanupResult;
    };
