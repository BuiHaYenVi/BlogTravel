import httpClient from './api/httpClient';

export const blogService = {
  getBlogs: (page = 1, limit = 10, search = '', status = 'All') => 
    httpClient.get(`/admin/blogs`, { params: { page, limit, search, status } }),

  getBlogById: (id: string | number) => 
    httpClient.get(`/admin/blogs/${id}`),

  getBlogComments: (id: string | number) =>
    httpClient.get(`/admin/blogs/${id}/comments`),

  deleteComment: (commentId: string | number) =>
    httpClient.delete(`/admin/comments/${commentId}`),

  updateBlogStatus: (id: string | number, status: string) => 
    httpClient.put(`/admin/blogs/${id}/status`, { status }),

  deleteBlog: (id: string | number) => 
    httpClient.delete(`/admin/blogs/${id}`),

  updateBlog: (id: string | number, data: any) =>
    httpClient.put(`/admin/blogs/${id}`, data),
    
  pinBlog: (id: string | number) =>
    httpClient.put(`/admin/blogs/${id}/pin`),

  unpinBlog: (id: string | number) =>
    httpClient.put(`/admin/blogs/${id}/unpin`),
};
