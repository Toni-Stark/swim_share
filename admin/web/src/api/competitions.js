import request from './request';

export function getCompetitions(params) {
  return request.get('/competitions', { params });
}

export function createCompetition(data) {
  return request.post('/competitions', data);
}

export function updateCompetition(id, data) {
  return request.put(`/competitions/${id}`, data);
}

export function deleteCompetition(id) {
  return request.delete(`/competitions/${id}`);
}

export function getRegistrations(id) {
  return request.get(`/competitions/${id}/registrations`);
}

export function reviewRegistration(competitionId, regId, status) {
  return request.put(`/competitions/${competitionId}/registrations/${regId}`, { status });
}

export default { getCompetitions, createCompetition, updateCompetition, deleteCompetition, getRegistrations, reviewRegistration };
