const VALID_CYCLES = new Set(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']);
const VALID_MODALITIES = new Set(['Virtual', 'Presencial', 'Hibrido']);

export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function cleanText(value) {
  return String(value || '').trim();
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function validatePassword(password) {
  if (String(password || '').length < 6) {
    throw httpError(400, 'La contrasena debe tener al menos 6 caracteres.');
  }
}

export function validateCycle(cycle) {
  if (!VALID_CYCLES.has(String(cycle || ''))) {
    throw httpError(400, 'Selecciona un ciclo academico valido.');
  }
}

export function validateModality(modality) {
  if (!VALID_MODALITIES.has(String(modality || ''))) {
    throw httpError(400, 'Selecciona una modalidad valida.');
  }
}

export function validateMaxMembers(maxMembers) {
  const value = Number(maxMembers);
  if (!Number.isInteger(value) || value < 2 || value > 50) {
    throw httpError(400, 'El maximo de integrantes debe estar entre 2 y 50.');
  }
  return value;
}

export function validateRequired(value, message) {
  const text = cleanText(value);
  if (!text) throw httpError(400, message);
  return text;
}
