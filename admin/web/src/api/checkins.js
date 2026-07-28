import request from './request';

export function getDashboard() {
  return request.get('/checkins/dashboard');
}

export function getCheckIns(params) {
  return request.get('/checkins', { params });
}

export function getCheckInStats() {
  return request.get('/checkins/stats');
}

export default { getDashboard, getCheckIns, getCheckInStats };
