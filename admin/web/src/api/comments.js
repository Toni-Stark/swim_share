import request from './request';

export function getComments(params) {
  return request.get('/comments', { params });
}

export function deleteComment(id) {
  return request.delete(`/comments/${id}`);
}

export default { getComments, deleteComment };
