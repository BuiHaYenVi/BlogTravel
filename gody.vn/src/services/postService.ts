import httpClient from './api/httpClient';

export const postService = {
  getPosts: (page = 1, limit = 20, search = '') => 
    httpClient.get(`/admin/blogs`, { params: { page, limit, search } }), // or /admin/posts depending on backend
  
  getPostById: (id: string | number) => 
    httpClient.get(`/admin/blogs/${id}`),

  getPostComments: (id: string | number) =>
    httpClient.get(`/admin/blogs/${id}/comments`),

  deleteComment: (commentId: string | number) =>
    httpClient.delete(`/admin/comments/${commentId}`),

  deletePost: (id: string | number) => 
    httpClient.delete(`/admin/blogs/${id}`),

  updatePostStatus: (id: string | number, status: string) => 
    httpClient.put(`/admin/blogs/${id}/status`, { status }),
};
