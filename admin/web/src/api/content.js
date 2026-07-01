import request from './request';

export function getAds() {
  return request.get('/content/ads');
}

export function createAd(data) {
  return request.post('/content/ads', data);
}

export function updateAd(id, data) {
  return request.put(`/content/ads/${id}`, data);
}

export function deleteAd(id) {
  return request.delete(`/content/ads/${id}`);
}

export function getOfficial() {
  return request.get('/content/official');
}

export function createOfficial(data) {
  return request.post('/content/official', data);
}

export function updateOfficial(id, data) {
  return request.put(`/content/official/${id}`, data);
}

export function deleteOfficial(id) {
  return request.delete(`/content/official/${id}`);
}

export default { getAds, createAd, updateAd, deleteAd, getOfficial, createOfficial, updateOfficial, deleteOfficial };
