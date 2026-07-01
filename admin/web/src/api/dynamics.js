import request from './request';

export function getDynamics(params) {
  return request.get('/dynamics', { params });
}

export function getDynamicDetail(id) {
  return request.get(`/dynamics/${id}`);
}

export function deleteDynamic(id) {
  return request.delete(`/dynamics/${id}`);
}

export default { getDynamics, getDynamicDetail, deleteDynamic };
