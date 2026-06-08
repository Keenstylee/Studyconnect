export function toCycle(value) {
  const map = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : map[value] || 1;
}

export function fromCycle(value) {
  const map = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return map[Number(value || 1) - 1] || 'I';
}

export function groupMode(group) {
  if (group.is_public === false) return 'Privado';
  const text = `${group.name} ${group.description} ${group.schedule}`.toLowerCase();
  if (text.includes('hibrido')) return 'Hibrido';
  if (text.includes('presencial')) return 'Presencial';
  return 'Virtual';
}
