import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => { 
  const location = window.location;
  
  return (
    <div className="min-h-screen bg-[#FAF3F0] flex items-center justify-center px-6 font-sans relative">
      {/* Diagnostic Info (Hidden in production or subtle) */}
      <div className="absolute bottom-4 left-4 text-[10px] text-gray-300 font-mono text-left max-w-md break-all">
        Path: {location.pathname}<br/>
        Host: {location.host}<br/>
        URL: {location.href}
      </div>
      <div className="max-w-lg w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center border border-gray-100">
        <div className="mb-12">
          <h1 className="text-9xl font-black text-[#2DD4BF] mb-4 tracking-tighter opacity-10 drop-shadow-sm">404</h1>
          <div className="relative -mt-20">
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Hành trình bị gián đoạn</h2>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">
              Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang một tọa độ mới trên bản đồ.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            to="/"
            className="flex items-center justify-center gap-3 px-8 py-4 bg-[#2DD4BF] text-white rounded-2xl font-black hover:bg-teal-600 transition-all shadow-xl shadow-teal-500/20 active:scale-95"
          >
            <Home className="w-5 h-5" />
            Về trang chủ
          </Link>

          <button
            onClick={() => window.history.back() }
            className="flex items-center justify-center gap-3 px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
