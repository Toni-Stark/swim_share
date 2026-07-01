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

export default { getUsers, getUserDetail, updateUser };
