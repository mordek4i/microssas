import { supabase } from './supabase';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida formato e tamanho da imagem antes do envio.
 */
export function validateImageFile(file: File): FileValidationResult {
  const mime = file.type.toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase();

  const isMimeValid = ALLOWED_MIME_TYPES.includes(mime);
  const isExtValid = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');

  if (!isMimeValid && !isExtValid) {
    return {
      valid: false,
      error: 'Formato inválido. Selecione um arquivo JPG, JPEG, PNG ou WEBP.'
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Arquivo muito grande. O limite máximo permitido é de 5MB.'
    };
  }

  return { valid: true };
}

/**
 * Comprime a imagem para WebP utilizando a Canvas API nativa do navegador.
 * Reduz drasticamente o consumo de banda sem perda perceptível de qualidade.
 */
export async function compressImageToWebP(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85
): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return resolve(file);
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Envia uma imagem para o bucket 'business-assets' no Supabase Storage.
 * Caminho no Storage: {business_id}/{type}.webp
 */
export async function uploadBusinessAsset(
  businessId: number,
  file: File,
  type: 'logo' | 'cover'
): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Arquivo inválido.');
  }

  // Dimensões recomendadas por tipo de imagem
  const maxWidth = type === 'logo' ? 600 : 1920;
  const maxHeight = type === 'logo' ? 600 : 1080;
  const quality = type === 'logo' ? 0.9 : 0.85;

  const compressedBlob = await compressImageToWebP(file, maxWidth, maxHeight, quality);
  const filePath = `${businessId}/${type}.webp`;

  const { error: uploadError } = await supabase.storage
    .from('business-assets')
    .upload(filePath, compressedBlob, {
      contentType: 'image/webp',
      upsert: true
    });

  if (uploadError) {
    console.error(`Erro ao fazer upload de ${type} no Storage:`, uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('business-assets')
    .getPublicUrl(filePath);

  // Adiciona timestamp para evitar cache no navegador ao substituir
  return `${data.publicUrl}?t=${Date.now()}`;
}

/**
 * Remove uma imagem do bucket 'business-assets' no Supabase Storage.
 */
export async function deleteBusinessAsset(
  businessId: number,
  type: 'logo' | 'cover'
): Promise<void> {
  const filePath = `${businessId}/${type}.webp`;

  const { error: deleteError } = await supabase.storage
    .from('business-assets')
    .remove([filePath]);

  if (deleteError) {
    console.error(`Erro ao remover ${type} do Storage:`, deleteError);
    throw deleteError;
  }
}
