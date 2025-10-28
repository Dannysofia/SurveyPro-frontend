// Servicios HTTP para encuestas (solo llamadas a API)
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

export async function updateQuestion(questionId, payload) {
  return api
    .put(`/encuestas/preguntas/${questionId}`, payload)
    .then((r) => r.data);
}

export async function deleteQuestion(questionId) {
  return api.delete(`/encuestas/preguntas/${questionId}`).then((r) => r.data);
}

export async function updateOption(optionId, payload) {
  return api
    .put(`/encuestas/opciones/${optionId}`, payload)
    .then((r) => r.data);
}

export async function deleteOption(optionId) {
  return api.delete(`/encuestas/opciones/${optionId}`).then((r) => r.data);
}
