import request from './request';

export function getHonors() { return request.get('/honors'); }
export function createHonor(data) { return request.post('/honors', data); }
export function updateHonor(id, data) { return request.put(`/honors/${id}`, data); }
export function deleteHonor(id) { return request.delete(`/honors/${id}`); }
export function seedHonors() { return request.post('/honors/seed'); }

export function getUserHonors(openid) { return request.get(`/honors/user/${openid}`); }
export function grantHonor(openid, data) { return request.post(`/honors/user/${openid}`, data); }
export function revokeHonor(openid, honorId) { return request.delete(`/honors/user/${openid}/${honorId}`); }

export default { getHonors, createHonor, updateHonor, deleteHonor, seedHonors, getUserHonors, grantHonor, revokeHonor };
