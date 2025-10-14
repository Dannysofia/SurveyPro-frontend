// Servicio para obtener y cachear los tipos de pregunta desde el backend.
// Usa el cliente axios configurado en src/api.js
import { api } from '@/api';

let cachedTypes = null; // cache en memoria para evitar llamadas repetidas

// Estructura esperada del backend: [{ type_id, type_key, label }]
export async function fetchQuestionTypes() {
  if (cachedTypes) return cachedTypes;
  const { data } = await api.get('/tipos-pregunta');
  cachedTypes = Array.isArray(data) ? data : [];
  return cachedTypes;
}

// Devuelve un mapa helper: key -> type_id
export async function getTypeIdByKeyMap() {
  const types = await fetchQuestionTypes();
  const map = new Map();
  for (const t of types) {
    if (t?.type_key && t?.type_id) map.set(String(t.type_key).toLowerCase(), t.type_id);
  }
  return map;
}

// Mapea el type_key del backend a los tipos usados en UI ('open'|'single'|'multiple')
export function mapTypeKeyToUi(type_key) {
  const k = String(type_key || '').toLowerCase();
  if (k.includes('open') || k === 'abierta') return 'open';
  if (k.includes('single') || k.includes('única') || k.includes('unica')) return 'single';
  if (k.includes('multiple')) return 'multiple';
  return 'open'; // fallback seguro
}

