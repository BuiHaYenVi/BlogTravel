import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../../../services/api/authApi';
import BackButton from '../../../shared/components/common/BackButton';

const ForgotPasswordPage = () => { const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
    } catch {
      setMessage('Có lỗi xảy ra, vui lòng thử lại.');
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
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">Quên mật khẩu?</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Nhập email của bạn để nhận liên kết khôi phục.</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-100/50 sm:rounded-4xl sm:px-10 border border-gray-100 relative overflow-hidden">
          { message ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Kiểm tra Email</h3>
              <p className="text-gray-500 mb-8">{message }</p>
              <Link to="/login" className="text-pastel-orange font-bold hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={ handleSubmit }>
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700">Email của bạn</label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={ email }
                    onChange={ (e) => setEmail(e.target.value) }
                    className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pastel-orange focus:border-transparent transition-all outline-none font-medium text-gray-900 bg-gray-50 focus:bg-white"
                    placeholder="Traveler@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={ loading }
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-pastel-orange hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-orange transition-all hover:shadow-lg disabled:opacity-70"
              >
                { loading ? 'Đang gửi...' : 'Gửi liên kết khôi phục' }
              </button>
              
              <div className="text-center">
                <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-pastel-orange">
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

