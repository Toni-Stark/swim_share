import request from './request';

export function getConfigs() {
  return request.get('/config');
}

export function updateConfig(key, value) {
  return request.put(`/config/${key}`, { value });
}

export default { getConfigs, updateConfig };
