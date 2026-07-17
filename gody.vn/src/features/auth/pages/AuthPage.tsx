import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../features/auth/store/useAuthStore';
import { Compass, User, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import BackButton from '../../../shared/components/common/BackButton';
import ForgotPasswordFlow from '../components/ForgotPasswordFlow';
import RegisterFlow from '../components/RegisterFlow';

// ... (schema keep only loginSchema)
const loginSchema = yup.object({
  email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password: yup.string().min(6, 'Mật khẩu ít nhất 6 ký tự').required('Vui lòng nhập mật khẩu'),
});

const LoginForm = ({ onSubmit, isLoading, authError }: any) => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {authError && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{authError}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-base-color mb-1">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            {...register("email")}
            type="email" 
            className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-1 transition-colors dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#2DD4BF] focus:ring-[#2DD4BF] dark:border-slate-600'}`} 
            placeholder="demo@email.com" 
          />
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-base-color mb-1">Mật khẩu</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            {...register("password")}
            type="password" 
            className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-1 transition-colors dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-400 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-[#2DD4BF] focus:ring-[#2DD4BF] dark:border-slate-600'}`} 
            placeholder="••••••••" 
          />
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-[#2DD4BF] hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all mt-6 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
      >
        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
        {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
      </button>
    </form>
  );
};

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const navigate = useNavigate();
  const { loginAPI, googleLoginAPI } = useAuthStore();

  const handleLoginSubmit = async (data: any) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await loginAPI(data.email, data.password);
      navigate('/');
    } catch (err: any) {
      setAuthError(err.message || 'Lỗi xác thực');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const mockGoogleData = {
        email: "google_user@gmail.com",
        name: "Google Explorer",
        avatar: "https://lh3.googleusercontent.com/a/ACg8ocL...",
        auth_provider: "google"
      };
      await googleLoginAPI(mockGoogleData);
      navigate('/');
    } catch (err: any) {
      setAuthError(err.message || 'Lỗi Google Login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4 transition-colors duration-300">
      {showForgotModal && <ForgotPasswordFlow onClose={() => setShowForgotModal(false)} />}
      
      <div className="w-full max-w-md mb-6">
        <BackButton />
      </div>
      
      <div className="w-full max-w-md bg-surface rounded-3xl shadow-xl overflow-hidden border border-theme">
        <div className="bg-[#2DD4BF] p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10">
            <Compass className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black mb-2 relative z-10 tracking-tight">Xin chào!</h2>
          <p className="opacity-90 relative z-10 font-bold">Bắt đầu hành trình khám phá cùng Blog Travel</p>
        </div>

        <div className="p-8">
          <div className="flex bg-surface-2 rounded-2xl p-1.5 mb-8">
            <button 
              type="button"
              className={`flex-1 py-3 font-bold rounded-xl transition-all ${isLogin ? 'bg-surface shadow-sm text-[#2DD4BF]' : 'text-muted-color hover:text-base-color'}`}
              onClick={() => setIsLogin(true)}
            >
              Đăng nhập
            </button>
            <button 
              type="button"
              className={`flex-1 py-3 font-bold rounded-xl transition-all ${!isLogin ? 'bg-surface shadow-sm text-[#2DD4BF]' : 'text-muted-color hover:text-base-color'}`}
              onClick={() => setIsLogin(false)}
            >
              Đăng ký
            </button>
          </div>

          {isLogin ? (
            <LoginForm 
              onSubmit={handleLoginSubmit} 
              isLoading={isLoading} 
              authError={authError} 
            />
          ) : (
            <RegisterFlow />
          )}
          
          <div className="mt-8 text-center space-y-4">
            {isLogin && (
              <p 
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-faint-color font-bold hover:text-[#2DD4BF] cursor-pointer transition-colors underline underline-offset-4"
              >
                Quên mật khẩu?
              </p>
            )}
            
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700"></div>
              <span className="text-[10px] text-faint-color font-black uppercase tracking-widest">Hoặc đăng nhập bằng</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-slate-700"></div>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handleGoogleLogin}
                className="flex-1 py-3 border border-theme rounded-xl flex items-center justify-center gap-2 hover:bg-surface-2 transition-colors"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="google" />
                <span className="text-xs font-bold text-base-color">Google</span>
              </button>
              <button className="flex-1 py-3 border border-theme rounded-xl flex items-center justify-center gap-2 hover:bg-surface-2 transition-colors">
                <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-5 h-5" alt="facebook" />
                <span className="text-xs font-bold text-base-color">Facebook</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
