import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  Tag as TagIcon, 
  ChevronRight,
  Info,
  Users,
  Loader2
} from 'lucide-react';
import { useCompanionStore, Trip, DayPlan } from '../store/useCompanionStore';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../shared/hooks/useToast';
const DB_LOCATION_MAP: Record<string, number> = {
  'hà nội': 1,
  'hồ chí minh': 2,
  'tp. hồ chí minh': 2,
  'đà nẵng': 3,
  'quảng ngãi': 4,
  'lâm đồng': 5,
  'an giang': 7,
  'bắc ninh': 23,
  'cà mau': 41,
  'cao bằng': 44,
  'cần thơ': 47,
  'đắk lắk': 52,
  'điện biên': 58,
  'đồng nai': 61,
  'đồng tháp': 64,
  'gia lai': 67,
  'hà tĩnh': 79,
  'hải phòng': 85,
  'hưng yên': 94,
  'khánh hòa': 97,
  'lai châu': 106,
  'lạng sơn': 109,
  'lào cai': 112,
  'nghệ an': 123,
  'ninh bình': 126,
  'quảng ninh': 146,
  'quảng trị': 149,
  'sơn la': 155,
  'tây ninh': 158,
  'thái nguyên': 164,
  'thanh hóa': 167,
  'thừa thiên huế': 170,
  'tp. huế': 170,
  'tuyên quang': 183,
  'vĩnh long': 186,
  'phú thọ': 199
};

const getDestinationId = (locationName: string): number => {
  const nameClean = locationName.toLowerCase().trim();
  for (const [key, val] of Object.entries(DB_LOCATION_MAP)) {
    if (nameClean.includes(key) || key.includes(nameClean)) {
      return val;
    }
  }
  return 1; // fallback
};

const schema = yup.object().shape({
  title: yup.string().required('Tiêu đề không được để trống'),
  location: yup.string().required('Địa điểm không được để trống'),
  startDate: yup.string().required('Ngày bắt đầu không được để trống'),
  endDate: yup.string().required('Ngày kết thúc không được để trống'),
  max_participants: yup.number().min(2, 'Tối thiểu 2 người').max(50, 'Tối đa 50 người').default(10),
  budget: yup.number().typeError('Chi phí phải là số').min(0, 'Chi phí không thể âm').default(0),
  description: yup.string().optional(),
});

interface TripActivityInput {
  id: string;
  time: string;
  title: string;
  location: string;
  description: string;
}

interface TripDayInput {
  id: string;
  dayNumber: number;
  date: string;
  activities: TripActivityInput[];
}

interface TripCreationFormInput {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  max_participants: number;
  budget: number;
  description?: string;
  itinerary: TripDayInput[];
}

const TripCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { availableInterests, fetchInterests, createTrip } = useCompanionStore();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);
  
  const { register, handleSubmit, control, watch, formState: { errors, isValid } } = useForm<TripCreationFormInput>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      max_participants: 10,
      budget: 0,
      description: '',
      itinerary: [
        {
          id: crypto.randomUUID(),
          dayNumber: 1,
          date: '',
          activities: [
            { id: crypto.randomUUID(), time: '08:00', title: '', location: '', description: '' }
          ]
        }
      ]
    }
  });

  const formValues = watch();

  const { fields: dayFields, append: appendDay, remove: removeDay } = useFieldArray({
    control,
    name: "itinerary"
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };



  const onInvalid = (errors: any) => {
    console.warn("[Create Trip Validation Error] Các trường chưa hợp lệ:", errors);
  };

  const onSubmit = async (data: any) => {
    console.log("[Create Trip Debug] Trạng thái Form hiện tại:", { values: data, errors, isValid });
    setIsSubmitting(true);
    try {
      // Tìm destination_id từ tên địa điểm (location) thông qua map thực tế từ CSDL
      const destinationId = getDestinationId(data.location);

      const tripData = {
        title: data.title,
        location: data.location,
        destination_id: destinationId,
        start_date: data.startDate,
        end_date: data.endDate,
        max_participants: data.max_participants,
        description: data.description || '',
        budget: Number(data.budget) || 0, 
        itinerary: data.itinerary,
        tags: selectedTags,
        status: 'preparing' // Đảm bảo trạng thái đồng bộ với backend
      };

      console.log("[Create Trip Debug] Payload gửi lên API:", tripData);

      const newTripId = await createTrip(tripData);
      
      if (newTripId) {
        showToast('Tạo chuyến đi thành công!', 'success');
        navigate(`/companion/trip/${newTripId}`);
      }
    } catch (err: any) {
      console.error("[Trip API Error] Chi tiết lỗi:", err);
      const backendMsg = err.response?.data?.message || err.message || "Lỗi hệ thống khi tạo chuyến đi!";
      showToast('Backend từ chối vì: ' + backendMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
          
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Info className="text-orange-500" />
              Chi tiết chuyến đi
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề chuyến đi</label>
                <input 
                  {...register('title')}
                  placeholder="Ví dụ: Khám phá Tây Bắc đại ngàn"
                  className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${errors.title ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1 font-bold ml-2">⚠️ {errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Điểm đến</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    {...register('location')}
                    placeholder="Nhập địa điểm..."
                    className={`w-full pl-12 pr-5 py-4 bg-slate-50 border-2 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${errors.location ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                  />
                </div>
                {errors.location && <p className="text-red-500 text-xs mt-1 font-bold ml-2">⚠️ {errors.location.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Số lượng thành viên tối đa</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="number"
                      {...register('max_participants')}
                      className={`w-full pl-12 pr-5 py-4 bg-slate-50 border-2 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${errors.max_participants ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                    />
                  </div>
                  {errors.max_participants && <p className="text-red-500 text-xs mt-1 font-bold ml-2">⚠️ {errors.max_participants.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tổng chi phí dự kiến (VNĐ)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">đ</span>
                    <input 
                      type="number"
                      {...register('budget')}
                      placeholder="0 (Tự túc / Miễn phí)"
                      className={`w-full pl-10 pr-5 py-4 bg-slate-50 border-2 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${errors.budget ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                    />
                  </div>
                  {errors.budget && <p className="text-red-500 text-xs mt-1 font-bold ml-2">⚠️ {errors.budget.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả chuyến đi</label>
                <textarea 
                  {...register('description')}
                  rows={3}
                  placeholder="Chia sẻ thêm về mục đích chuyến đi, yêu cầu với bạn đồng hành..."
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ngày bắt đầu</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date"
                      {...register('startDate')}
                      className={`w-full pl-12 pr-5 py-4 bg-slate-50 border-2 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${errors.startDate ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                    />
                  </div>
                  {errors.startDate && <p className="text-red-500 text-xs mt-1 font-bold ml-2">⚠️ {errors.startDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Ngày kết thúc</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="date"
                      {...register('endDate')}
                      className={`w-full pl-12 pr-5 py-4 bg-slate-50 border-2 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${errors.endDate ? 'border-red-300 bg-red-50' : 'border-transparent'}`}
                    />
                  </div>
                  {errors.endDate && <p className="text-red-500 text-xs mt-1 font-bold ml-2">⚠️ {errors.endDate.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <TagIcon size={18} /> Thẻ chuyến đi
                </label>

                <div className="flex flex-wrap gap-2">
                  {availableInterests.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                        selectedTags.includes(tag) 
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 scale-105' 
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Lịch trình chuyến đi</h2>
              <button 
                type="button"
                onClick={() => appendDay({ id: crypto.randomUUID(), dayNumber: dayFields.length + 1, date: '', activities: [] })}
                className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-bold hover:bg-orange-100 transition-all"
              >
                <Plus size={18} /> Thêm ngày
              </button>
            </div>

            <div className="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-10">
              {dayFields.map((field, index) => (
                <div key={field.id} className="relative">
                  <div className="absolute -left-[45px] top-0 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white">
                    {index + 1}
                  </div>
                  
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex gap-4 items-center">
                        <h3 className="text-lg font-bold text-slate-800">Ngày {index + 1}</h3>
                        <input 
                          type="date"
                          {...register(`itinerary.${index}.date` as const)}
                          className="text-sm bg-slate-50 px-3 py-1.5 rounded-lg border-none outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeDay(index)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <ItineraryActivities index={index} control={control} register={register} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-bold text-lg hover:bg-black transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={24} />}
              {isSubmitting ? 'Đang tạo chuyến đi...' : 'Tiếp tục tạo chuyến đi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ItineraryActivities = ({ index, control, register }: any) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `itinerary.${index}.activities`
  });

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {fields.map((activity, activityIndex) => (
          <motion.div 
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-5 bg-slate-50 rounded-2xl relative group"
          >
            <button 
              type="button"
              onClick={() => remove(activityIndex)}
              className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
            >
              <Trash2 size={14} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="time"
                  {...register(`itinerary.${index}.activities.${activityIndex}.time` as const)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white rounded-xl border-none text-sm outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  placeholder="Địa điểm"
                  {...register(`itinerary.${index}.activities.${activityIndex}.location` as const)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white rounded-xl border-none text-sm outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <input 
              placeholder="Tên hoạt động"
              {...register(`itinerary.${index}.activities.${activityIndex}.title` as const)}
              className="w-full px-4 py-2.5 bg-white rounded-xl border-none text-sm outline-none focus:ring-1 focus:ring-orange-500 mb-3 font-bold"
            />

            <textarea 
              placeholder="Mô tả chi tiết hoạt động..."
              {...register(`itinerary.${index}.activities.${activityIndex}.description` as const)}
              rows={2}
              className="w-full px-4 py-3 bg-white rounded-xl border-none text-sm outline-none focus:ring-1 focus:ring-orange-500 resize-none"
            />
          </motion.div>
        ))}
      </AnimatePresence>
      
      <button 
        type="button"
        onClick={() => append({ id: crypto.randomUUID(), time: '08:00', title: '', location: '', description: '' })}
        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-orange-200 hover:text-orange-500 transition-all flex items-center justify-center gap-2 font-bold text-sm"
      >
        <Plus size={16} /> Thêm hoạt động
      </button>
    </div>
  );
};

export default TripCreationPage;
