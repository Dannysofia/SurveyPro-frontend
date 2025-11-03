// Utilidades para construir estadísticas de encuestas a partir de respuestas normalizadas

export function computeGlobalSummary(survey, responses) {
  const totalResponses = Array.isArray(responses) ? responses.length : 0;
  const questionCount = Array.isArray(survey?.questions) ? survey.questions.length : 0;
  return { totalResponses, questionCount };
}

export function buildQuestionStats(survey, responses) {
  const byQ = {};
  const questions = Array.isArray(survey?.questions) ? survey.questions : [];
  for (const q of questions) {
    if (q.type === 'open') {
      const rows = [];
      let totalAnswered = 0;
      for (const r of responses || []) {
        const v = r?.answers?.[q.id];
        if (v != null && String(v).trim() !== '') {
          totalAnswered++;
          rows.push({ responseId: r.id, submittedAt: r.submittedAt, value: String(v) });
        }
      }
      byQ[q.id] = { type: q.type, totalAnswered, rows };
    } else if (q.type === 'single') {
      const counts = new Map();
      let totalAnswered = 0;
      for (const opt of q.options || []) counts.set(String(opt.id), 0);
      for (const r of responses || []) {
        const v = r?.answers?.[q.id];
        if (v != null && String(v) !== '') {
          totalAnswered++;
          const key = String(v);
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      }
      const table = (q.options || []).map((opt) => {
        const c = counts.get(String(opt.id)) || 0;
        const pct = totalAnswered > 0 ? (c / totalAnswered) * 100 : 0;
        return { value: opt.text, count: c, percentage: pct, optionId: opt.id };
      });
      const chart = {
        labels: table.map((t) => t.value),
        values: table.map((t) => Number(t.percentage.toFixed(2))),
      };
      byQ[q.id] = { type: q.type, totalAnswered, table, chart };
    } else if (q.type === 'multiple') {
      const counts = new Map();
      let respondents = 0; // número de respuestas que contestaron algo en esta pregunta
      for (const opt of q.options || []) counts.set(String(opt.id), 0);
      for (const r of responses || []) {
        const arr = r?.answers?.[q.id];
        if (Array.isArray(arr) && arr.length) {
          respondents++;
          const seen = new Set();
          for (const id of arr) {
            const key = String(id);
            if (seen.has(key)) continue; // evitar doble conteo si viniera repetido
            seen.add(key);
            counts.set(key, (counts.get(key) || 0) + 1);
          }
        }
      }
      const table = (q.options || []).map((opt) => {
        const c = counts.get(String(opt.id)) || 0;
        const pct = respondents > 0 ? (c / respondents) * 100 : 0;
        return { value: opt.text, count: c, percentage: pct, optionId: opt.id };
      });
      const chart = {
        labels: table.map((t) => t.value),
        values: table.map((t) => Number(t.percentage.toFixed(2))),
      };
      byQ[q.id] = { type: q.type, respondents, table, chart };
    }
  }
  return byQ;
}

