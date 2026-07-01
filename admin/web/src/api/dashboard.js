import request from './request';

export function getStats() {
  return request.get('/dashboard/stats');
}

export default { getStats };
