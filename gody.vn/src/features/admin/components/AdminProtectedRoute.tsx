import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/useAuthStore';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Kiểm tra quyền Admin dựa trên Role Slug hoặc Level
  const isAdmin = user && (
    user.role === 'admin' || 
    user.role === 'super-admin' || 
    user.role === 'super_admin' || 
    (user.role_level ?? 0) >= 50 ||
    user.role_id === 1 || 
    user.role_id === 2
  );

  if (!isAuthenticated) {
    return null; 
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">403</h1>
          <p className="text-slate-500 font-medium mb-8">Xin lỗi, bạn không có quyền truy cập vào khu vực quản trị.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/20 hover:scale-105 transition-all active:scale-95"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
