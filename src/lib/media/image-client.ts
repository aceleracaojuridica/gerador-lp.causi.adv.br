import imageCompression from "browser-image-compression";

export const AVATAR_IMAGE_DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const AVATAR_IMAGE_MAX_DIMENSION = 512;

const AVATAR_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ValidateAvatarImageFileOptions = {
  maxFileSize?: number;
  allowedTypes?: string[];
};

function isCanvasExportQualitySupported(type: string): boolean {
  return type === "image/jpeg" || type === "image/webp";
}

function getCanvasExportQuality(type: string): number | undefined {
  if (!isCanvasExportQualitySupported(type)) {
    return undefined;
  }

  return 0.92;
}

function normalizePersonPhotoType(type: string): string {
  if (AVATAR_IMAGE_TYPES.includes(type)) {
    return type;
  }

  return "image/jpeg";
}

/**
 * Valida a imagem original antes de abrir o editor de avatar.
 */
export function validateAvatarImageFile(
  file: File,
  {
    maxFileSize = AVATAR_IMAGE_DEFAULT_MAX_FILE_SIZE,
    allowedTypes = AVATAR_IMAGE_TYPES,
  }: ValidateAvatarImageFileOptions = {},
): string | null {
  if (!allowedTypes.includes(file.type)) {
    return "Formato de imagem inválido. Use JPG, PNG ou WEBP.";
  }

  if (file.size > maxFileSize) {
    const sizeInMegabytes = Math.floor(maxFileSize / (1024 * 1024));
    return `O tamanho máximo permitido é ${sizeInMegabytes}MB.`;
  }

  return null;
}

/**
 * Exporta um canvas para File preservando o MIME final desejado.
 */
export async function canvasToImageFile({
  canvas,
  fileName,
  fileType,
}: {
  canvas: HTMLCanvasElement;
  fileName: string;
  fileType: string;
}): Promise<File> {
  const normalizedType = normalizePersonPhotoType(fileType);
  const quality = getCanvasExportQuality(normalizedType);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Falha ao exportar a imagem editada."));
          return;
        }

        resolve(result);
      },
      normalizedType,
      quality,
    );
  });

  return new File([blob], fileName, {
    type: normalizedType,
    lastModified: Date.now(),
  });
}

/**
 * Normaliza a imagem editada para no máximo 512x512 preservando o formato original.
 */
export async function optimizeAvatarImage({
  canvas,
  sourceFile,
}: {
  canvas: HTMLCanvasElement;
  sourceFile: File;
}): Promise<File> {
  const intermediateFile = await canvasToImageFile({
    canvas,
    fileName: sourceFile.name,
    fileType: sourceFile.type,
  });

  return imageCompression(intermediateFile, {
    fileType: intermediateFile.type,
    maxWidthOrHeight: AVATAR_IMAGE_MAX_DIMENSION,
    initialQuality: getCanvasExportQuality(intermediateFile.type) ?? 1,
    useWebWorker: true,
  });
}

export const PERSON_PHOTO_MAX_FILE_SIZE = AVATAR_IMAGE_DEFAULT_MAX_FILE_SIZE;
export const PERSON_PHOTO_MAX_DIMENSION = AVATAR_IMAGE_MAX_DIMENSION;

export function validatePersonPhotoFile(file: File): string | null {
  return validateAvatarImageFile(file);
}

export async function optimizePersonPhoto(args: {
  canvas: HTMLCanvasElement;
  sourceFile: File;
}): Promise<File> {
  return optimizeAvatarImage(args);
}
