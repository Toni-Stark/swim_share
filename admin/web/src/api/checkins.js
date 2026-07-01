import request from './request';

export function getCheckIns(params) {
  return request.get('/checkins', { params });
}

export function getCheckInStats() {
  return request.get('/checkins/stats');
}

export default { getCheckIns, getCheckInStats };
