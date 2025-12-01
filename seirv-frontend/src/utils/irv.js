// src/utils/irv.js
export function getIRVLevelClass(irvLevel) {
  const level = irvLevel?.toLowerCase();
  if (level === 'bajo') return 'irv-level-bajo';
  if (level === 'medio') return 'irv-level-medio';
  if (level === 'alto') return 'irv-level-alto';
  return 'irv-level-sin-recalls';
}

export function getIRVLevelText(irvLevel) {
  const level = irvLevel?.toLowerCase();
  const map = {
    bajo: 'Riesgo Bajo',
    medio: 'Riesgo Medio',
    alto: 'Riesgo Alto',
    'sin recalls': 'Sin Recalls',
    'n/a': 'Sin Recalls',
  };
  return map[level] || 'Sin Recalls';
}
