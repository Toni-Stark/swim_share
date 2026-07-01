import request from './request';

export function login(password) {
  return request.post('/auth/login', { password });
}

export default { login };
