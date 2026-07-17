import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, Lock, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../../services/api/authApi';
import BackButton from '../../../shared/components/common/BackButton';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const otp = searchParams.get('otp') || '';
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch {
      alert('Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <BackButton />
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 group mb-8">
          <div className="p-3 bg-pastel-emerald rounded-2xl group-hover:scale-105 transition-transform duration-300 shadow-md">
            <Compass className="text-white h-8 w-8" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-gray-900 group-hover:text-pastel-orange transition-colors">
            Blog<span className="text-pastel-emerald group-hover:text-pastel-orange transition-colors">Travel</span>
          </span>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">Tạo lại mật khẩu</h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-100/50 sm:rounded-4xl sm:px-10 border border-gray-100 relative overflow-hidden">
          { success ? (
            <div className="text-center py-8 animate-fade-in">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Thành công!</h3>
              <p className="text-gray-500">Mật khẩu đã được cập nhật. Đang chuyển hướng...</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit }>
              <div>
                <label className="block text-sm font-bold text-gray-700">Mật khẩu mới</label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={ password }
                    onChange={ (e) => setPassword(e.target.value) }
                    className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pastel-orange focus:border-transparent outline-none font-medium bg-gray-50 focus:bg-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={ loading }
                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md font-bold text-white bg-pastel-orange hover:bg-orange-500 transition-all disabled:opacity-70"
              >
                { loading ? 'Đang lưu...' : 'Xác nhận tạo mới' }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

