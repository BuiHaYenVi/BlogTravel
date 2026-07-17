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
  Info,
  Users,
  Loader2,
  X,
  Compass
} from 'lucide-react';
import { useCompanionStore, Trip } from '../store/useCompanionStore';
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
  status: yup.string().oneOf(['preparing', 'ongoing', 'completed', 'open', 'closed']).default('preparing')
});

interface TripEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
}

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
  completed?: boolean;
}

interface TripEditFormInput {
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  max_participants: number;
  budget: number;
  description?: string;
  status?: string;
  itinerary: TripDayInput[];
}

export const TripEditModal: React.FC<TripEditModalProps> = ({ isOpen, onClose, trip }) => {
  const { showToast } = useToast();
  const { availableInterests, fetchInterests, updateTripAction } = useCompanionStore();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<TripEditFormInput>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      title: '',
      location: '',
      startDate: '',
      endDate: '',
      max_participants: 10,
      budget: 0,
      description: '',
      status: 'preparing',
      itinerary: []
    }
  });

  const { fields: dayFields, append: appendDay, remove: removeDay } = useFieldArray({
    control,
    name: "itinerary"
  });

  // Pre-populate values when modal opens or trip changes
  useEffect(() => {
    if (isOpen && trip) {
      reset({
        title: trip.title || '',
        location: trip.location || '',
        startDate: trip.startDate || '',
        endDate: trip.endDate || '',
        max_participants: trip.participants || 10,
        budget: trip.budget || 0,
        description: trip.description || '',
        status: trip.status || 'preparing',
        itinerary: trip.itinerary && trip.itinerary.length > 0 
          ? trip.itinerary.map(day => ({
              id: day.id || crypto.randomUUID(),
              dayNumber: day.dayNumber,
              date: day.date || '',
              completed: day.completed || false,
              activities: day.activities && day.activities.length > 0
                ? day.activities.map(act => ({
                    id: act.id || crypto.randomUUID(),
                    time: act.time || '08:00',
                    title: act.title || '',
                    location: act.location || '',
                    description: act.description || ''
                  }))
                : []
            }))
          : [
              {
                id: crypto.randomUUID(),
                dayNumber: 1,
                date: '',
                activities: [
                  { id: crypto.randomUUID(), time: '08:00', title: '', location: '', description: '' }
                ]
              }
            ]
      });
      setSelectedTags(trip.tags || []);
    }
  }, [isOpen, trip, reset]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };



  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
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
        status: data.status
      };

      const success = await updateTripAction(trip.id, tripData);
      
      if (success) {
        showToast('Cập nhật chuyến đi thành công!', 'success');
        onClose();
      }
    } catch (err: any) {
      console.error("[Trip Update API Error] Chi tiết lỗi:", err);
      const backendMsg = err.response?.data?.message || err.message || "Lỗi hệ thống khi cập nhật chuyến đi!";
      showToast('Cập nhật thất bại: ' + backendMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative max-w-4xl w-full mx-4 bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 md:px-8 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-2xl text-orange-500">
                <Compass className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Chỉnh sửa chuyến đi</h3>
                <p className="text-xs text-slate-400 font-medium">Thay đổi thông tin hành trình và đoàn thám hiểm</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
            {/* General Info */}
            <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 space-y-6">
              <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Info size={18} className="text-orange-500" />
                Thông tin chung
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Tiêu đề chuyến đi</label>
                  <input 
                    {...register('title')}
                    placeholder="Ví dụ: Khám phá Tây Bắc đại ngàn"
                    className={`w-full px-5 py-4 bg-white border-2 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${errors.title ? 'border-red-300 bg-red-50' : 'border-slate-100'}`}
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1 font-bold ml-2">⚠️ {errors.title.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Điểm đến</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        {...register('location')}
                        placeholder="Nhập địa điểm..."
                        className={`w-full pl-12 pr-5 py-4 bg-white border-2 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${errors.location ? 'border-red-300 bg-red-50' : 'border-slate-100'}`}
                      />
                    </div>
                    {errors.location && <p className="text-red-500 text-xs mt-1 font-bold ml-2">⚠️ {errors.location.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Trạng thái</label>
                    <select 
                      {...register('status')}
                      className="w-full px-4 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold text-slate-700"
                    >
                      <option value="preparing">Chuẩn bị</option>
                      <option value="ongoing">Đang diễn ra</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="open">Đăng tuyển</option>
                      <option value="closed">Đóng tuyển</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Ngày bắt đầu</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="date"
                        {...register('startDate')}
                        className={`w-full pl-12 pr-5 py-4 bg-white border-2 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${errors.startDate ? 'border-red-300 bg-red-50' : 'border-slate-100'}`}
                      />
                    </div>
                    {errors.startDate && <p className="text-red-500 text-xs mt-1 font-bold ml-2">⚠️ {errors.startDate.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Ngày kết thúc</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="date"
                        {...register('endDate')}
                        className={`w-full pl-12 pr-5 py-4 bg-white border-2 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${errors.endDate ? 'border-red-300 bg-red-50' : 'border-slate-100'}`}
                      />
                    </div>
                    {errors.endDate && <p className="text-red-500 text-xs mt-1 font-bold ml-2">⚠️ {errors.endDate.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Thành viên tối đa</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="number"
                        {...register('max_participants')}
                        className={`w-full pl-12 pr-5 py-4 bg-white border-2 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${errors.max_participants ? 'border-red-300 bg-red-50' : 'border-slate-100'}`}
                      />
                    </div>
                    {errors.max_participants && <p className="text-red-500 text-xs mt-1 font-bold ml-2">⚠️ {errors.max_participants.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Tổng chi phí dự kiến (VNĐ)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">đ</span>
                      <input 
                        type="number"
                        {...register('budget')}
                        placeholder="0 (Tự túc / Miễn phí)"
                        className={`w-full pl-10 pr-5 py-4 bg-white border-2 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all ${errors.budget ? 'border-red-300 bg-red-50' : 'border-slate-100'}`}
                      />
                    </div>
                    {errors.budget && <p className="text-red-500 text-xs mt-1 font-bold ml-2">⚠️ {errors.budget.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Mô tả chuyến đi</label>
                  <textarea 
                    {...register('description')}
                    rows={3}
                    placeholder="Chia sẻ thêm về mục đích chuyến đi, yêu cầu với bạn đồng hành..."
                    className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <TagIcon size={16} /> Thẻ chuyến đi
                  </label>
                  
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-white border border-slate-100 rounded-2xl">
                    {availableInterests.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                          selectedTags.includes(tag) 
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-200 scale-105' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                    
                    {/* Display old custom tags if any, allowing user to remove them */}
                    {selectedTags.filter(t => !availableInterests.includes(t)).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="px-4 py-2 rounded-full text-xs font-bold bg-orange-500 text-white shadow-md shadow-orange-200 scale-105 flex items-center gap-1.5"
                      >
                        #{tag}
                        <X size={10} strokeWidth={3} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Itinerary */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-black text-slate-900">Lịch trình chuyến đi</h4>
                <button 
                  type="button"
                  onClick={() => appendDay({ id: crypto.randomUUID(), dayNumber: dayFields.length + 1, date: '', activities: [] })}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-100 transition-all animate-pulse"
                >
                  <Plus size={16} /> Thêm ngày
                </button>
              </div>

              <div className="relative border-l-2 border-slate-200 ml-4 pl-8 space-y-8">
                {dayFields.map((field, index) => (
                  <div key={field.id} className="relative">
                    <div className="absolute -left-[45px] top-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ring-4 ring-white">
                      {index + 1}
                    </div>
                    
                    <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-3 items-center">
                          <h5 className="font-bold text-slate-800 text-sm">Ngày {index + 1}</h5>
                          <input 
                            type="date"
                            {...register(`itinerary.${index}.date` as const)}
                            className="text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-100 outline-none focus:ring-1 focus:ring-orange-500 font-semibold"
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeDay(index)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <ItineraryActivities index={index} control={control} register={register} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 md:px-8 border-t border-slate-100 bg-slate-50">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 bg-white text-slate-700 font-bold border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-sm"
            >
              Hủy
            </button>
            <button 
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-200 flex items-center gap-2 text-sm disabled:opacity-75"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={16} />}
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const ItineraryActivities = ({ index, control, register }: any) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `itinerary.${index}.activities`
  });

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {fields.map((activity, activityIndex) => (
          <motion.div 
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-4 bg-white rounded-2xl border border-slate-100 relative group"
          >
            <button 
              type="button"
              onClick={() => remove(activityIndex)}
              className="absolute top-2.5 right-2.5 p-1 bg-slate-50 hover:bg-red-50 rounded-full text-red-400 hover:text-red-600 transition-colors shadow-sm"
            >
              <Trash2 size={12} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="time"
                  {...register(`itinerary.${index}.activities.${activityIndex}.time` as const)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-transparent rounded-xl text-xs outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  placeholder="Địa điểm hoạt động"
                  {...register(`itinerary.${index}.activities.${activityIndex}.location` as const)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-transparent rounded-xl text-xs outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <input 
              placeholder="Tên hoạt động"
              {...register(`itinerary.${index}.activities.${activityIndex}.title` as const)}
              className="w-full px-3 py-2 bg-slate-50 border border-transparent rounded-xl text-xs outline-none focus:ring-1 focus:ring-orange-500 mb-2 font-bold text-slate-800"
            />

            <textarea 
              placeholder="Mô tả chi tiết hoạt động..."
              {...register(`itinerary.${index}.activities.${activityIndex}.description` as const)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-transparent rounded-xl text-xs outline-none focus:ring-1 focus:ring-orange-500 resize-none text-slate-600 font-medium"
            />
          </motion.div>
        ))}
      </AnimatePresence>
      
      <button 
        type="button"
        onClick={() => append({ id: crypto.randomUUID(), time: '08:00', title: '', location: '', description: '' })}
        className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-orange-200 hover:text-orange-500 transition-all flex items-center justify-center gap-1.5 font-bold text-xs"
      >
        <Plus size={14} /> Thêm hoạt động
      </button>
    </div>
  );
};
