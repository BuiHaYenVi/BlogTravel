import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PenTool, Check, Info, Star, Bookmark, Lightbulb, Sparkles } from 'lucide-react';
import BackButton from '../../../shared/components/common/BackButton';

const BlogGuidePage: React.FC = () => {
  const navigate = useNavigate();

  const writingSteps = [
    {
      title: "1. Chọn ảnh bìa 'đắt giá'",
      desc: "Ảnh bìa là thứ đầu tiên người đọc nhìn thấy. Hãy chọn ảnh có độ phân giải cao, thể hiện rõ nhất linh hồn của chuyến đi. Một tấm ảnh phong cảnh rộng hoặc khoảnh khắc check-in ấn tượng sẽ rất hút view.",
      color: "bg-blue-500",
      lightColor: "bg-blue-50"
    },
    {
      title: "2. Tiêu đề gây tò mò",
      desc: "Đặt tiêu đề chứa địa danh và một con số hoặc tính từ mạnh. Ví dụ: 'Khám phá Hà Giang - 4 ngày 3 đêm đẹp như tranh vẽ' thay vì chỉ để 'Đi Hà Giang'.",
      color: "bg-purple-500",
      lightColor: "bg-purple-50"
    },
    {
      title: "3. Thông tin lịch trình cụ thể",
      desc: "Đừng quên gắn thẻ địa điểm, chọn ngày bắt đầu - kết thúc và dự trù chi phí. Bài viết có thông số cụ thể luôn có giá trị tham khảo cao hơn 80% so với bài viết thông thường.",
      color: "bg-teal-500",
      lightColor: "bg-teal-50"
    },
    {
      title: "4. Gắn Thẻ (Tags) thông minh",
      desc: "Sử dụng các tag gợi ý hoặc tự nhập tag liên quan như: #phuot, #nghiduong, #tietkiem. Điều này giúp hệ thống đưa bài viết của bạn đến đúng người đang cần tìm.",
      color: "bg-rose-500",
      lightColor: "bg-rose-50"
    },
    {
      title: "5. Nội dung chân thực & Sinh động",
      desc: "Kể về cảm xúc thật, những mẹo nhỏ bạn rút ra được (ví dụ: quán ăn này ngon nhưng phải chờ lâu). Sử dụng định dạng in đậm, danh sách và chèn thêm ảnh xen kẽ trong bài để tránh gây nhàm chán.",
      color: "bg-orange-500",
      lightColor: "bg-orange-50"
    },
    {
      title: "6. Kiểm tra & Đăng tải",
      desc: "Đọc lại bài viết một lần để sửa lỗi chính tả. Hệ thống Gody luôn tự động lưu nháp, nên bạn có thể hoàn thiện bài viết trong nhiều ngày nếu muốn.",
      color: "bg-green-500",
      lightColor: "bg-green-50"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Cẩm nang viết Blog chuẩn</h1>
              <p className="text-[10px] font-bold text-[#2DD4BF] uppercase tracking-widest">Gody Travel Academy</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg rotate-3">
             <Bookmark size={20} />
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 pt-12">
        <div className="mb-8">
           <BackButton />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Decorative "Tape" */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-10 bg-orange-200/40 rotate-1 z-10"></div>
          
          <div className="bg-[#FFFCF0] rounded-[3rem] p-10 md:p-16 border-2 border-orange-100 shadow-xl relative overflow-hidden">
            {/* Paper Lines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#000 1.5px, transparent 1px)', backgroundSize: '100% 3rem' }}></div>

            <div className="relative z-10">
              <header className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-orange-50 mb-6">
                  <Sparkles size={16} className="text-orange-500" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Hướng dẫn chi tiết</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight mb-6">
                  Làm sao để có một bài viết <br/> 
                  <span className="text-orange-500 italic">triệu view</span> trên Blog Travel?
                </h2>
                <div className="w-24 h-1.5 bg-orange-500 mx-auto rounded-full"></div>
              </header>

              <div className="grid grid-cols-1 gap-12">
                {writingSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-8 group">
                    <div className="shrink-0">
                      <div className={`w-14 h-14 ${step.color} rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                        {idx + 1}
                      </div>
                    </div>
                    <div className="pt-2">
                      <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-orange-500 transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-lg text-gray-600 font-medium leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pro Tips Box */}
              <div className="mt-20 p-10 bg-white rounded-[2.5rem] border-2 border-orange-50 shadow-inner relative">
                <div className="absolute -top-6 left-10 bg-teal-500 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">
                  Mẹo từ chuyên gia
                </div>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-500 shrink-0">
                      <Lightbulb size={20} />
                    </div>
                    <p className="text-gray-600 font-bold leading-relaxed">
                      Sử dụng tính năng <span className="text-teal-600">Gắn thẻ địa điểm</span> để bài viết của bạn xuất hiện ngay trong trang thông tin của tỉnh thành đó.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-500 shrink-0">
                      <Star size={20} />
                    </div>
                    <p className="text-gray-600 font-bold leading-relaxed">
                      Các bài viết có hơn <span className="text-teal-600">5 hình ảnh chất lượng cao</span> thường nhận được lượng tương tác gấp 3 lần bình thường.
                    </p>
                  </div>
                </div>
              </div>

              <footer className="mt-20 text-center">
                <button 
                  onClick={() => navigate('/blog/create')}
                  className="px-12 py-5 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-2xl active:scale-95 text-sm uppercase tracking-widest flex items-center gap-3 mx-auto"
                >
                  <PenTool size={20} /> Bắt đầu viết bài ngay
                </button>
              </footer>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default BlogGuidePage;
