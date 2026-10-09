/**
 * Utilitário de normalização de telefone para o ReservaZen.
 * Regra determinística:
 * 1. Remove qualquer caractere que não seja dígito numérico (0-9).
 * 2. Se possuir 12 ou 13 dígitos e iniciar com '55' (DDI do Brasil), remove o prefixo '55'.
 * 3. Se o resultado for vazio ou inexistente, retorna null.
 * 4. Caso contrário, retorna a sequência de dígitos normalizada.
 *
 * Exemplos:
 * - "(21) 99999-9999" -> "21999999999"
 * - "21 99999-9999"   -> "21999999999"
 * - "21999999999"     -> "21999999999"
 * - "+55 (21) 99999-9999" -> "21999999999"
 * - "+55 (21) 3333-4444"  -> "2133334444"
 * - "" / null / undefined -> null
 */
export function normalizePhone(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;

  // Se tiver 12 ou 13 dígitos e iniciar com 55 (DDI Brasil), remove 55
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return digits.substring(2);
  }

  return digits;
}
