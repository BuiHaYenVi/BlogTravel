import React, { useState } from 'react';
import { Calendar, MapPin, Users, ChevronRight, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Trip } from '../store/useCompanionStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import ReportModal from '../../../components/modals/ReportModal';

interface TripCardProps {
  trip: Trip;
}

const TripCard: React.FC<TripCardProps> = ({ trip }) => {
  const { user: currentUser } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const isNotMe = trip.user_id !== currentUser?.id && trip.creator?.id !== currentUser?.id;

  const itineraryArray = Array.isArray(trip.itinerary) ? trip.itinerary : [];
  const totalDays = itineraryArray.length;
  const completedDays = itineraryArray.filter(day => day.completed).length;
  const progressPercent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img 
            src={trip.creator?.avatar || 'https://i.pravatar.cc/150'} 
            alt={trip.creator?.name} 
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-gray-800">{trip.creator?.name || 'Người dùng'}</h4>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <Calendar size={12} /> {trip.startDate ? new Date(trip.startDate).toLocaleDateString('vi-VN') : 'Linh hoạt'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap max-w-[60%] justify-end">
          <div className="bg-orange-50 text-orange-500 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 uppercase">
            <MapPin size={12} />
            {trip.location}
          </div>
          
          {trip.status === 'preparing' && (
            <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider">
              Chuẩn bị
            </span>
          )}
          {trip.status === 'ongoing' && (
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider animate-pulse">
              Đang diễn ra
            </span>
          )}
          {trip.status === 'completed' && (
            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider">
              Hoàn thành
            </span>
          )}

          {trip.matching_score !== undefined && (
            <div className="bg-purple-50 text-purple-600 text-xs font-bold px-2.5 py-1.5 rounded-full border border-purple-100 flex items-center gap-1">
              {trip.matching_score}% phù hợp
            </div>
          )}

          {/* Nút Ba Chấm Báo Cáo Chuyến Đi */}
          {isNotMe && (
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors flex items-center justify-center"
              >
                <MoreHorizontal size={16} />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl py-2 border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        setIsReportOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-500 font-bold text-xs flex items-center gap-2 transition-colors uppercase tracking-wider"
                    >
                      <AlertTriangle size={14} />
                      Báo cáo vi phạm
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
        {trip.title}
      </h3>

      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
        {trip.description || "Tham gia cùng chúng tôi trong hành trình khám phá những điểm đến tuyệt vời."}
      </p>

      {/* Progress Bar */}
      {(trip.status === 'ongoing' || trip.status === 'completed') && (
        <div className="mb-4 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1.5">
            <span>Tiến độ chuyến đi</span>
            <span className="text-emerald-600">{progressPercent}% ({completedDays}/{totalDays} ngày)</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4 mt-auto pt-3 border-t border-slate-100 text-xs">
        <span className="font-semibold text-slate-400">Ngân sách dự kiến:</span>
        <span className={`font-black uppercase tracking-wider ${trip.budget && Number(trip.budget) > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
          {trip.budget && Number(trip.budget) > 0 
            ? `${Number(trip.budget).toLocaleString('vi-VN')} đ` 
            : 'Tự túc / Miễn phí'}
        </span>
      </div>

      <div className="flex justify-between items-end mb-5">
        <div className="flex -space-x-2">
          {trip.participantList && trip.participantList.slice(0, 3).map((p, i) => (
            <img 
              key={i} 
              src={p.avatar || `https://i.pravatar.cc/100?u=${p.user_id}`} 
              alt="member" 
              className="w-7 h-7 rounded-full border-2 border-white object-cover" 
            />
          ))}
          {(trip.currentParticipants || 0) > 3 && (
            <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold">
              +{(trip.currentParticipants || 0) - 3}
            </div>
          )}
        </div>
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
          <Users size={14} />
          {trip.currentParticipants}/{trip.participants} thành viên
        </span>
      </div>

      <Link 
        to={`/companion/trip/${trip.id}`}
        className="w-full bg-[#111827] hover:bg-gray-800 text-white py-3.5 rounded-2xl font-semibold text-sm flex justify-center items-center gap-2 transition-colors"
      >
        <span>Xem chi tiết</span>
        <ChevronRight size={16} />
      </Link>
      {isReportOpen && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          reportableType="trip"
          reportableId={trip.id}
          title="Báo cáo Chuyến đi"
        />
      )}
    </div>
  );
};

export default TripCard;
