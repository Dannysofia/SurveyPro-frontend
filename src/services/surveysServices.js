// Servicios HTTP para encuestas (solo llamadas a API, sin mapeos UI)
// Usa la instancia axios de src/api.js
import { api } from "@/api";

export async function listSurveys(params = {}) {
  return api.get("/encuestas", { params }).then((r) => r.data);
}

export async function getSurveyById(id) {
  return api.get(`/encuestas/${id}`).then((r) => r.data);
}

export async function getSurveyDetail(id) {
  return api.get(`/encuestas/${id}/detalle`).then((r) => r.data);
}

export async function createSurveyApi(payload) {
  return api.post("/encuestas", payload).then((r) => r.data);
}

export async function updateSurvey(id, payload) {
  return api.put(`/encuestas/${id}`, payload).then((r) => r.data);
}

export async function deleteSurvey(id) {
  return api.delete(`/encuestas/${id}`).then((r) => r.data);
}

export async function createQuestion(surveyId, payload) {
  return api
    .post(`/encuestas/${surveyId}/preguntas`, payload)
    .then((r) => r.data);
}

export async function createOption(questionId, payload) {
  return api
    .post(`/encuestas/preguntas/${questionId}/opciones`, payload)
    .then((r) => r.data);
}
