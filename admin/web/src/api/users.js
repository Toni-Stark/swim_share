import request from './request';

export function getUsers(params) {
  return request.get('/users', { params });
}

export function getUserDetail(openid) {
  return request.get(`/users/${openid}`);
}

export function updateUser(openid, data) {
  return request.put(`/users/${openid}`, data);
}

export function deleteUser(openid) {
  return request.delete(`/users/${openid}`);
}

export default { getUsers, getUserDetail, updateUser, deleteUser };
