import React from 'react';
import { Star, Camera, MessageSquare, Pencil, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Review {
  id: string;
  user: string;
  avatar: string;
  date: string;
  rating: number;
  comment: string;
  images?: string[];
}

interface SpotReviewsProps {
  spotId: string;
  slug: string;
}

const SpotReviews: React.FC<SpotReviewsProps> = ({ spotId, slug }) => {
  const reviews: Review[] = [
    {
      id: '1',
      user: 'Yến Mai',
      avatar: 'https://i.pravatar.cc/100?img=1',
      date: '2023-06-28 08:54:40',
      rating: 4,
      comment: 'Có thờ có thiêng!',
      images: [
        'https://images.unsplash.com/photo-1599818815155-2e6b72a6b47c?w=400',
        'https://images.unsplash.com/photo-1596402184320-417d717867cd?w=400'
      ]
    },
    {
      id: '2',
      user: 'QUÁCH THỊ KIM CÚC',
      avatar: 'https://i.pravatar.cc/100?img=5',
      date: '2020-12-27 16:31:46',
      rating: 4,
      comment: 'Miếu bà chúa xứ điểm hẹn của tâm linh Là địa điểm du lịch của những người yêu thích tâm linh, mất phí tham quan nhỏ. Kiến trúc miếu khá đẹp.',
    }
  ];

  const ratingStats = [
    { stars: 5, percentage: 78.37, count: 616 },
    { stars: 4, percentage: 12.47, count: 98 },
    { stars: 3, percentage: 6.11, count: 48 },
    { stars: 2, percentage: 1.4, count: 11 },
    { stars: 1, percentage: 1.65, count: 13 },
  ];

  const renderStars = (rating: number, size = "w-4 h-4") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${size} ${i <= Math.floor(rating) ? 'fill-[#F09B3E] text-[#F09B3E]' : 'text-gray-200'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mt-12 space-y-12">
      {/* Review Summary Section */}
      <div className="bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Reviews</h2>
          <Link
            to={`/destination/${slug}/review/create`}
            className="bg-[#F09B3E] hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Pencil className="w-4 h-4" />
            Viết review
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Left: Overall Score */}
          <div className="lg:w-1/4 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-gray-100 pb-10 lg:pb-0 lg:pr-20">
            <div className="text-[80px] leading-none font-bold text-gray-900 mb-4 tracking-tighter">4.65</div>
            <div className="mb-2">
              {renderStars(4, "w-6 h-6")}
            </div>
            <div className="text-gray-400 font-bold text-sm">dựa trên 786 đánh giá</div>
          </div>

          {/* Right: Distribution Bars */}
          <div className="flex-1 space-y-4">
            {ratingStats.map((stat) => (
              <div key={stat.stars} className="flex items-center gap-4 group">
                <div className="flex items-center gap-1 w-6">
                  <span className="font-bold text-gray-500 text-sm">{stat.stars}</span>
                  <Star className="w-3 h-3 fill-gray-400 text-gray-400" />
                </div>
                <div className="flex-1 h-3.5 bg-gray-100 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 bg-[#F09B3E] rounded-full"
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white mix-blend-difference opacity-0 group-hover:opacity-100 transition-opacity">
                    {stat.percentage}%
                  </span>
                </div>
                <div className="w-10 text-right">
                  <span className="text-sm font-bold text-gray-300">{stat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Feedback Input */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shrink-0">
          <img src="https://i.pravatar.cc/100?img=12" className="w-full h-full object-cover" alt="user" />
        </div>
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="Bình luận của bạn" 
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-6 py-3.5 outline-none focus:bg-white focus:ring-1 focus:ring-orange-200 transition-all text-[15px] font-medium"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#F09B3E] transition-colors">
            <Camera size={20} />
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-8">
        {reviews.map(review => (
          <div key={review.id} className="bg-white rounded-3xl p-8 border border-gray-50 shadow-sm">
            <div className="flex gap-4 mb-6">
              <img src={review.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt={review.user} />
              <div>
                <h4 className="font-bold text-gray-900">{review.user}</h4>
                <div className="flex items-center gap-3">
                  {renderStars(review.rating, "w-3 h-3")}
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{review.date.split(' ')[0]}</span>
                </div>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed font-medium mb-6">
              {review.comment}
            </p>
            {review.images && review.images.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {review.images.map((img, idx) => (
                  <img key={idx} src={img} className="w-32 h-32 rounded-2xl object-cover border border-gray-100 shadow-sm shrink-0" alt="review" />
                ))}
              </div>
            )}
            <div className="flex items-center gap-6 pt-6 mt-6 border-t border-gray-50">
               <button className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-rose-500 transition-colors">
                 <MessageSquare size={16} /> <span>Phản hồi</span>
               </button>
               <button className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-blue-500 transition-colors">
                 <Share2 size={16} /> <span>Chia sẻ</span>
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpotReviews;

