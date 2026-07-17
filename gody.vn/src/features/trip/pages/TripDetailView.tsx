import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Users, 
  ArrowLeft, 
  Share2, 
  Clock, 
  UserPlus, 
  ChevronRight,
  MoreHorizontal,
  Flag
} from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import ReportModal from '../../../components/modals/ReportModal';

const TripDetailView: React.FC = () => {
  const trip = useTripStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const steps = [
    { id: 'preparing', label: 'Chuẩn bị' },
    { id: 'ongoing', label: 'Đang diễn ra' },
    { id: 'completed', label: 'Hoàn thành' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === trip.status);

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="relative h-[400px] w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop" 
          alt="Banner"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="absolute top-6 left-4 right-4 flex justify-between items-center z-10">
          <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
            <ArrowLeft size={24} />
          </button>
          
          <div className="flex items-center gap-2">
            <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
              <Share2 size={24} />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white"
              >
                <MoreHorizontal size={24} />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                  >
                    <button 
                      onClick={() => {
                        setShowMenu(false);
                        setIsReportModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Flag size={16} />
                      Báo cáo vi phạm
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-6 right-6 text-white z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-3"
          >
            {trip.title}
          </motion.h1>
          <div className="flex flex-wrap gap-4 items-center opacity-90">
            <div className="flex items-center gap-1.5">
              <MapPin size={18} className="text-orange-400" />
              <span className="text-sm">{trip.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={18} className="text-orange-400" />
              <span className="text-sm">{trip.participants} người tham gia</span>
            </div>
          </div>
        </div>
      </header>

      <section className="px-6 py-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
          {steps.map((step, index) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index <= currentStepIndex ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-200 text-gray-500'
              }`}>
                {index + 1}
              </div>
              <span className={`text-xs font-medium ${
                index <= currentStepIndex ? 'text-orange-600' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-4">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          Lịch trình chi tiết
        </h2>
        
        <div className="relative border-l-2 border-gray-100 ml-4 pl-8 space-y-12">
          {trip.itinerary.map((dayPlan) => (
            <div key={dayPlan.day} className="relative">
              <div className="absolute -left-[45px] top-0 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-xl shadow-orange-100 ring-4 ring-white">
                {dayPlan.day}
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800">Ngày {dayPlan.day}</h3>
                <p className="text-sm text-gray-400">{dayPlan.date}</p>
              </div>

              <div className="space-y-4">
                {dayPlan.activities.map((activity, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-slate-50 p-4 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm mb-2">
                      <Clock size={16} />
                      <span>{activity.time}</span>
                    </div>
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin size={16} className="text-gray-400 mt-1 shrink-0" />
                      <h4 className="font-bold text-gray-800 leading-tight">
                        {activity.activity_title} - {activity.location_name}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {activity.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-8">
        <h2 className="text-lg font-bold mb-4">Chủ đề chuyến đi</h2>
        <div className="flex flex-wrap gap-2">
          {trip.tags.map((tag) => (
            <span 
              key={tag}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                ['Camping', 'Hiking'].includes(tag) 
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-100' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              #{tag}
            </span>
          ))}
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-gray-100 z-50">
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-orange-200">
          <UserPlus size={22} />
          <span>Tham gia chuyến đi</span>
          <ChevronRight size={18} className="opacity-50" />
        </button>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportableType="trip"
        reportableId={trip.id}
        title="Báo cáo Chuyến đi"
      />
    </div>
  );
};

export default TripDetailView;
