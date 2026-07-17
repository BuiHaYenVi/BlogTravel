import React from 'react';
import { Calendar, MapPin, Users, Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCompanionStore, Trip } from '../store/useCompanionStore';
import TripCard from './TripCard';

interface ActiveTripsTabProps {
  filter: string;
}

const ActiveTripsTab: React.FC<ActiveTripsTabProps> = ({ filter }) => {
  const { trips, myTrips, tripsLoading, fetchMyTrips, fetchTrips, searchQuery } = useCompanionStore();

  React.useEffect(() => {
    fetchMyTrips();
  }, [fetchMyTrips]);

  React.useEffect(() => {
    fetchTrips();
  }, [fetchTrips, filter, searchQuery]);

  const filteredTrips = filter === 'Tất cả' 
    ? trips 
    : trips.filter(trip => trip.tags.some(tag => tag === filter));

  if (tripsLoading && trips.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-pulse">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100" />
              <div className="space-y-2">
                <div className="w-24 h-4 bg-slate-100 rounded" />
                <div className="w-16 h-3 bg-slate-50 rounded" />
              </div>
            </div>
            <div className="w-full h-6 bg-slate-100 rounded mb-3" />
            <div className="w-2/3 h-4 bg-slate-50 rounded mb-6" />
            <div className="w-full h-12 bg-slate-900/10 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* My Trips Section */}
      {myTrips.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <span className="w-2 h-8 bg-orange-500 rounded-full" />
                Chuyến đi của bạn
              </h2>
              <p className="text-slate-400 text-sm font-medium mt-1">Các chuyến đi bạn đang tham gia hoặc quản lý.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
          <div className="h-px bg-slate-100 w-full" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Chuyến đi đang chờ bạn</h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Khám phá các hành trình và tìm người bạn đồng hành lý tưởng.</p>
        </div>
        <Link 
          to="/companion/create"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-orange-200 active:scale-95"
        >
          <Plus size={20} />
          <span>Tạo chuyến đi</span>
        </Link>
      </div>

      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-[3rem] py-20 text-center border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6 shadow-sm">
            <Users size={40} />
          </div>
          <p className="text-slate-400 font-bold text-lg">Không tìm thấy chuyến đi nào phù hợp.</p>
          <p className="text-slate-400 text-sm mt-1">Hãy thử chọn một chủ đề khác hoặc tự tạo chuyến đi mới.</p>
        </div>
      )}
    </div>
  );
};

export default ActiveTripsTab;
