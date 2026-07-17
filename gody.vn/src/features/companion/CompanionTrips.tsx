import React, { useEffect } from 'react';
import { useTripStore } from '../trip/tripStore';
import { Calendar, MapPin, Users, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const CompanionTrips: React.FC = () => {
  const { trips, isLoading, fetchTrips, filters, setFilter } = useTripStore();

  useEffect(() => {
    fetchTrips();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 mb-6">
        {['Tất cả', '#Phượt', '#Camping', '#Nghỉ dưỡng', '#Khám phá'].map((tag) => (
          <button
            key={tag}
            onClick={() => setFilter('tag', tag === 'Tất cả' ? null : tag)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              (tag === 'Tất cả' && !filters.tag) || filters.tag === tag
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trips.length > 0 ? (
            trips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={trip.avatar || 'https://i.pravatar.cc/150'}
                    alt={trip.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{trip.full_name}</h4>
                    <p className="text-xs text-gray-500">@{trip.username}</p>
                  </div>
                  {trip.category_tag && (
                    <span className="ml-auto px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">
                      {trip.category_tag}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{trip.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{trip.description}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-xs">
                      {format(new Date(trip.departure_date), 'dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-xs truncate">{trip.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-medium text-gray-700">
                      {trip.current_members}/{trip.max_members} thành viên
                    </span>
                  </div>
                  <button className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
                    Tham gia ngay
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500">
              Không tìm thấy chuyến đi nào phù hợp.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanionTrips;
