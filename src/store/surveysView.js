import { api } from '@/api';

export async function fetchRecentSurveys(limit = 6) {
    const { data } = await api.get(`/surveys/recent?limit=${limit}`);
    return data.items || [];
}

export async function fetchHomeSummary() {
    const { data } = await api.get('/surveys/summary');
    return data.summary || { total_surveys: 0, total_responses: 0 };
}