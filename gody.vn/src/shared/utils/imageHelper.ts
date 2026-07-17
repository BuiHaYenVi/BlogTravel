export const getImageUrl = (path: string | null | undefined) => {
  // Trả về placeholder nếu không có path hoặc path là chuỗi "null"/"undefined" hoặc bị lỗi parse JSON
  if (!path || path === 'null' || path === 'undefined' || path.startsWith('[') || path.startsWith('{')) {
    return 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800';
  }
  
  // Nếu đã là URL tuyệt đối hoặc base64 data URL thì trả về luôn
  if (path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }
  
  // Lấy base URL từ env (VITE_API_URL=http://localhost:90/Project_DuLichMXH/public/api)
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const baseUrl = apiUrl.replace(/\/api$/, ''); // -> http://localhost:90/Project_DuLichMXH/public
  
  // Xử lý các trường hợp path đặc biệt
  let cleanPath = path;
  
  // Nếu path không bắt đầu bằng / và cũng không chứa 'uploads/', 
  // có thể đây là avatar cũ chỉ lưu tên file. Ta giả định nó nằm trong uploads/avatars/
  if (!cleanPath.startsWith('/') && !cleanPath.includes('uploads/')) {
    cleanPath = `/uploads/avatars/${cleanPath}`;
  } else if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }
  
  // Tránh trường hợp double /public/public
  const finalUrl = `${baseUrl}${cleanPath}`.replace(/([^:]\/)\/+/g, '$1');
  
  return finalUrl;
};
