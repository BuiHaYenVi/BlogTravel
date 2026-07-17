import React, { useEffect, useState } from 'react';
import { Check, Calendar, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { checkinService, CheckinStatus } from '../../../services/checkinService';
import { useUserStore } from '../../user/store/useUserStore';
import { useAuthStore } from '../../auth/store/useAuthStore';

interface CheckinButtonsProps {
  destinationId: number;
}

const CheckinButtons: React.FC<CheckinButtonsProps> = ({ destinationId }) => {
  const { isAuthenticated, user } = useAuthStore();
  const { setVisitedCount, loadUserContent } = useUserStore();
  const [status, setStatus] = useState<CheckinStatus>(null);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!isAuthenticated) {
        setInitLoading(false);
        return;
      }
      try {
        const res = await checkinService.getStatus(destinationId);
        // Kiểm tra log nếu cần: console.log('Checkin Status:', res);
        if (res.success && res.data) {
          setStatus(res.data.status);
        }
      } catch (err) {
        console.error('Fetch checkin status failed:', err);
      } finally {
        setInitLoading(false);
      }
    };
    fetchStatus();
  }, [destinationId, isAuthenticated]);

  const handleToggle = async (newType: 'visited' | 'planning') => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để sử dụng tính năng này');
      return;
    }

    setLoading(true);
    try {
      const res = await checkinService.toggleCheckin(destinationId, newType);
      // Kiểm tra log nếu cần: console.log('Toggle Result:', res);
      if (res.success && res.data) {
        const { current_status, visited_count } = res.data;
        setStatus(current_status);
        setVisitedCount(visited_count);
        if (user && user.id) {
          loadUserContent(user.id.toString());
        }
      }
    } catch (err) {
      console.error('Toggle checkin failed:', err);
      alert('Không thể cập nhật trạng thái. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) return <div className="h-14 w-full bg-gray-100 animate-pulse rounded-2xl"></div>;

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      {/* Nút Đã đi */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => handleToggle('visited')}
        disabled={loading}
        className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black transition-all duration-500 border-2 ${
          status === 'visited'
            ? 'bg-orange-500 text-white border-orange-500 shadow-[0_0_40px_-5px_rgba(249,115,22,0.9)] scale-105'
            : 'bg-white text-gray-500 border-gray-100 hover:border-orange-300 hover:text-orange-500'
        }`}
      >
        {loading && status !== 'planning' ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Check className={`w-6 h-6 ${status === 'visited' ? 'text-white' : 'text-orange-500'}`} strokeWidth={4} />
        )}
        <span className="text-sm uppercase tracking-[0.2em]">Đã đi</span>
      </motion.button>

      {/* Nút Sắp đi */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => handleToggle('planning')}
        disabled={loading}
        className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black transition-all duration-500 border-2 ${
          status === 'planning'
            ? 'bg-blue-600 text-white border-blue-600 shadow-[0_0_40px_-5px_rgba(37,99,235,0.9)] scale-105'
            : 'bg-white text-gray-500 border-gray-100 hover:border-blue-300 hover:text-blue-600'
        }`}
      >
        {loading && status !== 'visited' ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Calendar className={`w-6 h-6 ${status === 'planning' ? 'text-white' : 'text-blue-600'}`} strokeWidth={4} />
        )}
        <span className="text-sm uppercase tracking-[0.2em]">Sắp đi</span>
      </motion.button>
    </div>
  );
};

export default CheckinButtons;
