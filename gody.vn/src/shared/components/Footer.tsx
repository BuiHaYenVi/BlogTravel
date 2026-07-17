import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-surface border-t border-theme py-14 mt-auto transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <div className="p-2 bg-orange-500 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-orange-500/20">
                <Compass className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-base-color">
                Blog<span className="text-orange-500">Travel</span>
              </span>
            </Link>
            <p className="text-muted-color text-sm font-medium leading-relaxed">
              Mạng xã hội du lịch hàng đầu Việt Nam. Nơi khám phá, chia sẻ và lưu giữ những trải nghiệm hành trình tuyệt vời.
            </p>
          </div>

          {/* About */}
          <div>
            <h4 className="font-bold text-base-color mb-4 uppercase text-xs tracking-widest">Về chúng tôi</h4>
            <ul className="space-y-3 text-sm text-muted-color">
              <li><a href="#" className="hover:text-orange-500 transition-colors font-medium">Giới thiệu</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors font-medium">Liên hệ</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors font-medium">Tuyển dụng</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-base-color mb-4 uppercase text-xs tracking-widest">Hỗ trợ</h4>
            <ul className="space-y-3 text-sm text-muted-color">
              <li><a href="#" className="hover:text-orange-500 transition-colors font-medium">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors font-medium">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors font-medium">Quy chế hoạt động</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold text-base-color mb-4 uppercase text-xs tracking-widest">Kết nối</h4>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-surface-2 rounded-full flex items-center justify-center text-muted-color hover:bg-orange-500 hover:text-white cursor-pointer transition-all shadow-sm border border-theme">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 bg-surface-2 rounded-full flex items-center justify-center text-muted-color hover:bg-orange-500 hover:text-white cursor-pointer transition-all shadow-sm border border-theme">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="#" className="w-10 h-10 bg-surface-2 rounded-full flex items-center justify-center text-muted-color hover:bg-orange-500 hover:text-white cursor-pointer transition-all shadow-sm border border-theme">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/><path d="m10 15 5-3-5-3z"/></svg>
              </a>
              <a href="#" className="w-10 h-10 bg-surface-2 rounded-full flex items-center justify-center text-muted-color hover:bg-orange-500 hover:text-white cursor-pointer transition-all shadow-sm border border-theme">
                <Mail size={18} />
              </a>
            </div>
            <p className="mt-4 text-xs text-faint-color font-medium">
              Theo dõi chúng tôi để nhận cập nhật mới nhất về du lịch Việt Nam
            </p>
          </div>
        </div>

        <div className="border-t border-theme mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-faint-color gap-3">
          <p>© 2026 Blog Travel. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Made with ♥ in Vietnam</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
