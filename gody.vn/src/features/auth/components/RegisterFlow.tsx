import React, { useState } from 'react';
import { useAuthStore } from '../../../features/auth/store/useAuthStore';
import { Mail, ShieldCheck, Lock, User, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RegisterFlow = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  
  const navigate = useNavigate();
  const { sendRegisterOTPAPI, verifyOTPAPI, registerAPI } = useAuthStore();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await sendRegisterOTPAPI(email);
      if (res.data?.debug_otp) {
        setDebugOtp(res.data.debug_otp);
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Lỗi gửi mã xác thực');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.join('').length !== 5) {
      setError('Vui lòng nhập đủ 5 số OTP');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await verifyOTPAPI(email, otp.join(''));
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Mã xác thực OTP không đúng hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await registerAPI({
        email,
        otp: otp.join(''),
        username: email.split('@')[0] + Math.floor(Math.random() * 1000),
        full_name: fullName,
        password: password
      });
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanedValue = value.replace(/[^0-9]/g, '');
    if (!cleanedValue) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    const lastChar = cleanedValue.substring(cleanedValue.length - 1);
    newOtp[index] = lastChar;
    setOtp(newOtp);

    // Auto focus next input with setTimeout to avoid event bleed-through
    if (index < 4) {
      setTimeout(() => {
        const nextInput = document.getElementById(`reg-otp-${index + 1}`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
          (nextInput as HTMLInputElement).select();
        }
      }, 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (otp[index] === '') {
        if (index > 0) {
          newOtp[index - 1] = '';
          setOtp(newOtp);
          const prevInput = document.getElementById(`reg-otp-${index - 1}`);
          if (prevInput) {
            (prevInput as HTMLInputElement).focus();
          }
        }
      } else {
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digitsOnly = pastedData.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 5) {
      const newOtp = digitsOnly.substring(0, 5).split('');
      setOtp(newOtp);
      setTimeout(() => {
        const lastInput = document.getElementById('reg-otp-4');
        if (lastInput) {
          (lastInput as HTMLInputElement).focus();
        }
      }, 0);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2 animate-shake">
          <ShieldCheck className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 px-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${step >= s ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 3 && <div className={`w-12 h-1 transition-all ${step > s ? 'bg-teal-500' : 'bg-gray-100'}`}></div>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={handleSendOTP} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email của bạn</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 dark:bg-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                placeholder="example@gmail.com"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={isLoading || !email}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tiếp tục'}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500 mb-2">
              Chúng tôi đã gửi mã xác thực tới <span className="font-bold text-slate-800 dark:text-white">{email}</span>
            </p>
            <p className="text-xs text-slate-400">
              Vui lòng kiểm tra hòm thư (hoặc hộp thư rác/spam).
            </p>
            {debugOtp && (
              <div className="mt-4 p-2 bg-yellow-50 text-yellow-700 rounded-xl text-xs font-mono">
                DEBUG OTP: {debugOtp}
              </div>
            )}
          </div>
          
          <div className="flex justify-between gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`reg-otp-${idx}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="w-full h-16 text-center text-2xl font-black rounded-2xl border border-gray-100 dark:border-slate-700 dark:bg-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
              />
            ))}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setStep(1)}
              className="flex-1 py-4 border border-gray-100 dark:border-slate-700 rounded-2xl font-bold text-slate-500 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" /> Quay lại
            </button>
            <button 
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.join('').length !== 5}
              className="flex-[2] bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác thực mã'}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleRegister} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 dark:bg-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                placeholder="Nguyễn Văn A"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 dark:bg-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Xác nhận mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 dark:bg-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={isLoading || !password || password !== confirmPassword}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Hoàn tất đăng ký'}
            {!isLoading && <CheckCircle2 className="w-5 h-5" />}
          </button>
        </form>
      )}
    </div>
  );
};

export default RegisterFlow;
