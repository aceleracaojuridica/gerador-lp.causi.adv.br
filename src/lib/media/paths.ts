// --- media bucket ---

type BuildUserAvatarPathOptions = {
  accountId: number;
  userId: string;
  filename: string;
  now?: () => number;
  uuid?: () => string;
};

type BuildPersonMediaPathOptions = {
  accountId: number;
  personId: number;
  filename: string;
  now?: () => number;
  uuid?: () => string;
};

type BuildConversationMediaPathOptions = {
  accountId: number;
  conversationId: number;
  filename: string;
  now?: () => number;
  uuid?: () => string;
};

// --- classroom bucket ---

type BuildCourseMediaPathOptions = {
  courseId: number;
  filename: string;
  now?: () => number;
  uuid?: () => string;
};

type BuildLessonAttachmentPathOptions = {
  lessonId: number;
  filename: string;
  now?: () => number;
  uuid?: () => string;
};

type BuildCertificateTemplatePathOptions = {
  templateId: number;
  filename: string;
  now?: () => number;
  uuid?: () => string;
};

type BuildUserCertificatePathOptions = {
  userId: string;
  courseId: number;
  now?: () => number;
  uuid?: () => string;
};

/**
 * Sanitiza segmentos de path para manter nomes ASCII, estáveis e seguros no bucket.
 */
export function sanitizePathSegment(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .split("")
    .filter((character) => character.charCodeAt(0) <= 0x7f)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/\.{2,}/g, ".");

  return normalized || "file";
}

export function getFileExtension(filename: string, fallback = "bin"): string {
  const parts = filename.split(".");
  const extension = parts.at(-1)?.trim().toLowerCase();

  if (!extension || parts.length === 1) {
    return fallback;
  }

  return sanitizePathSegment(extension);
}

function generateFileId(
  uuid: () => string = () => crypto.randomUUID(),
  now: () => number = Date.now,
): string {
  return `${uuid()}-${now()}`;
}

// ─── bucket: media ────────────────────────────────────────────────────────────

/**
 * Gera o path de avatar de usuário no bucket `media`.
 * Convenção: {accountId}/users/{userId}/{uuid}-{timestamp}.{ext}
 */
export function buildUserAvatarPath({
  accountId,
  userId,
  filename,
  now = Date.now,
  uuid = () => crypto.randomUUID(),
}: BuildUserAvatarPathOptions): string {
  const ext = getFileExtension(filename);
  return `${accountId}/users/${userId}/${generateFileId(uuid, now)}.${ext}`;
}

/**
 * Gera o path de mídia vinculada a uma pessoa do CRM no bucket `media`.
 * Convenção: {accountId}/persons/{personId}/{uuid}-{timestamp}.{ext}
 */
export function buildPersonMediaPath({
  accountId,
  personId,
  filename,
  now = Date.now,
  uuid = () => crypto.randomUUID(),
}: BuildPersonMediaPathOptions): string {
  const ext = getFileExtension(filename);
  return `${accountId}/persons/${personId}/${generateFileId(uuid, now)}.${ext}`;
}

/**
 * Gera o path de mídia vinculada a uma conversa no bucket `media`.
 * Convenção: {accountId}/conversations/{conversationId}/{uuid}-{timestamp}.{ext}
 */
export function buildConversationMediaPath({
  accountId,
  conversationId,
  filename,
  now = Date.now,
  uuid = () => crypto.randomUUID(),
}: BuildConversationMediaPathOptions): string {
  const ext = getFileExtension(filename);
  return `${accountId}/conversations/${conversationId}/${generateFileId(uuid, now)}.${ext}`;
}

// ─── bucket: classroom ────────────────────────────────────────────────────────

/**
 * Gera o path de thumbnail de curso no bucket `classroom`.
 * Convenção: courses/{courseId}/{uuid}-{timestamp}.{ext}
 */
export function buildCourseMediaPath({
  courseId,
  filename,
  now = Date.now,
  uuid = () => crypto.randomUUID(),
}: BuildCourseMediaPathOptions): string {
  const ext = getFileExtension(filename);
  return `courses/${courseId}/${generateFileId(uuid, now)}.${ext}`;
}

/**
 * Gera o path de anexo de aula no bucket `classroom`.
 * Convenção: lessons/{lessonId}/{uuid}-{timestamp}.{ext}
 */
export function buildLessonAttachmentPath({
  lessonId,
  filename,
  now = Date.now,
  uuid = () => crypto.randomUUID(),
}: BuildLessonAttachmentPathOptions): string {
  const ext = getFileExtension(filename);
  return `lessons/${lessonId}/${generateFileId(uuid, now)}.${ext}`;
}

/**
 * Gera o path de imagem de template de certificado no bucket `classroom`.
 * Convenção: certificate_templates/{templateId}/{uuid}-{timestamp}.{ext}
 */
export function buildCertificateTemplatePath({
  templateId,
  filename,
  now = Date.now,
  uuid = () => crypto.randomUUID(),
}: BuildCertificateTemplatePathOptions): string {
  const ext = getFileExtension(filename);
  return `certificate_templates/${templateId}/${generateFileId(uuid, now)}.${ext}`;
}

/**
 * Gera o path de certificado emitido no bucket `classroom`.
 * Convenção: user_certificates/{userId}/{courseId}/{uuid}-{timestamp}.pdf
 */
export function buildUserCertificatePath({
  userId,
  courseId,
  now = Date.now,
  uuid = () => crypto.randomUUID(),
}: BuildUserCertificatePathOptions): string {
  return `user_certificates/${userId}/${courseId}/${generateFileId(uuid, now)}.pdf`;
}
