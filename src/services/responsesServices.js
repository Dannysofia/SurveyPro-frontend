// Servicios HTTP para respuestas de encuestas
// Usa la instancia axios de src/api.js
import { api } from "@/api";

// Lista de respuestas por encuesta
export async function listSurveyResponses(surveyId, params = {}) {
  // Preferir la nueva vista agrupada si existe
  return api
    .get(`/encuestas/${encodeURIComponent(surveyId)}/respuestas/vista`, {
      params,
    })
    .then((r) => r.data)
    .catch(async () => {
      // Fallback: listado clásico por respuestas
      try {
        const { data } = await api.get(
          `/encuestas/${encodeURIComponent(surveyId)}/respuestas`,
          { params }
        );
        return data;
      } catch {
        // Último fallback: /respuestas?survey_id=:id
        const { data } = await api.get(`/respuestas`, {
          params: { survey_id: surveyId, ...params },
        });
        return data;
      }
    });
}

// Detalle de una respuesta específica
export async function getSurveyResponseDetail(surveyId, responseId) {
  return api
    .get(
      `/encuestas/${encodeURIComponent(surveyId)}/respuestas/${encodeURIComponent(
        responseId
      )}`
    )
    .then((r) => r.data)
    .catch(async () => {
      // Fallback: /respuestas/:responseId (algunos backends no tienen detalle por encuesta)
      try {
        const { data } = await api.get(
          `/respuestas/${encodeURIComponent(responseId)}`
        );
        return data;
      } catch (e) {
        // Si tampoco existe, devuelve objeto vacío para no romper la vista
        return {};
      }
    });
}

// Registrar (enviar) una respuesta
export async function submitSurveyResponse(surveyId, payload) {
  // payload esperado: { answers_by_question_id: { [qid]: value } }
  // Ajusta el shape si tu backend requiere otro formato
  return api
    .post(`/encuestas/${encodeURIComponent(surveyId)}/respuestas`, payload)
    .then((r) => r.data);
}
