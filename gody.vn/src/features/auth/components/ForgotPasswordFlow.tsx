import React, { useState } from 'react';
import api from '../../../shared/services/api';
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2, X } from 'lucide-react';

interface ForgotPasswordFlowProps {
  onClose: () => void;
}

const ForgotPasswordFlow: React.FC<ForgotPasswordFlowProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  const handleSendOtp = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.post('auth/forgot-password', { email });
      if (response.data.data?.debug_otp) {
        setDebugOtp(response.data.data.debug_otp);
        console.log("DEBUG OTP (Mock User):", response.data.data.debug_otp);
      }
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email không tồn tại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.join('').length !== 5) {
      setError('Vui lòng nhập đủ 5 số OTP');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await api.post('auth/verify-otp', { email, otp: otp.join('') });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    setError('');
    try {
      await api.post('auth/reset-password', {
        email,
        otp: otp.join(''),
        password: newPassword
      });
      alert('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã OTP không đúng hoặc lỗi hệ thống');
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
        const nextInput = document.getElementById(`otp-${index + 1}`);
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
          const prevInput = document.getElementById(`otp-${index - 1}`);
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
        const lastInput = document.getElementById('otp-4');
        if (lastInput) {
          (lastInput as HTMLInputElement).focus();
        }
      }, 0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-white">Khôi phục mật khẩu</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4 text-teal-500">
                  <Mail className="w-10 h-10" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Nhập email đăng ký của bạn để nhận mã OTP xác thực</p>
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 dark:bg-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                  placeholder="name@gmail.com"
                />
              </div>
              <button 
                onClick={handleSendOtp}
                disabled={isLoading || !email}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Gửi mã OTP'}
                {!isLoading && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4 text-teal-500">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <p className="text-sm font-medium text-slate-500 mb-2">
                  Chúng tôi đã gửi mã xác thực tới <span className="font-bold text-slate-800 dark:text-white">{email}</span>
                </p>
                <p className="text-xs text-slate-400">
                  Vui lòng kiểm tra hòm thư (hoặc hộp thư rác/spam).
                </p>
                {debugOtp && (
                  <div className="mt-2 p-2 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-mono">
                    DEBUG OTP: {debugOtp} (Tài khoản Mock)
                  </div>
                )}
              </div>
              
              <div className="flex justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-14 h-16 text-center text-2xl font-black rounded-2xl border border-gray-200 dark:border-slate-700 dark:bg-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                  />
                ))}
              </div>

              <button 
                onClick={handleVerifyOtp}
                disabled={isLoading || otp.join('').length !== 5}
                className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tiếp tục'}
                {!isLoading && <ArrowRight className="w-5 h-5" />}
              </button>
              
              <p className="text-center text-sm text-slate-400 font-medium">
                Không nhận được mã? <span className="text-teal-500 cursor-pointer" onClick={handleSendOtp}>Gửi lại</span>
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/30 rounded-3xl flex items-center justify-center mx-auto mb-4 text-teal-500">
                  <Lock className="w-10 h-10" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Thiết lập mật khẩu mới cho tài khoản của bạn</p>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 dark:bg-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                  placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                />
              </div>
              <button 
                onClick={handleResetPassword}
                disabled={isLoading || newPassword.length < 6}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Hoàn tất đổi mật khẩu'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordFlow;
