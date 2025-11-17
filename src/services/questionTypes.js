// Servicios para gestión de tipos de preguntas
import { api } from "@/api";

let cachedTypes = null; // cache en memoria para evitar llamadas repetidas

// Trae los tipos de pregunta desde el backend
export async function fetchQuestionTypes() {
  if (cachedTypes) return cachedTypes;
  const { data } = await api.get("/tipos-pregunta");
  cachedTypes = Array.isArray(data) ? data : [];
  return cachedTypes;
}

// Mapea el type_key del backend a los tipos usados en UI ('open'|'single'|'multiple')
export function mapTypeKeyToUi(type_key) {
  const k = String(type_key || "").toLowerCase();
  if (k.includes("open") || k === "abierta") return "open";
  if (k.includes("single") || k.includes("única") || k.includes("unica"))
    return "single";
  if (k.includes("multiple")) return "multiple";
  return "open"; // fallback seguro
}
