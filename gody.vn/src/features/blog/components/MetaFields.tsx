import React, { useEffect, useState } from 'react';
import { Calendar, Clock, DollarSign, Tag, MapPin, ChevronDown, Check } from 'lucide-react';
import { useBlogEditor } from '../store/useBlogEditor';
import { useDestinationStore } from '../../destination/store/useDestinationStore';
import { useToastStore } from '../../../shared/hooks/useToast';
import { locationService } from '../../../services/locationService';

const SUGGESTED_TAGS = [
  'Du lịch tự túc', 'Review ẩm thực', 'Khám phá', 'Nghỉ dưỡng', 
  'Phượt', 'Văn hóa', 'Check-in', 'Tiết kiệm', 'Lễ hội'
];

const MetaFields: React.FC = () => {
  const { meta, updateMeta } = useBlogEditor();
  const { destinations, fetchDestinations } = useDestinationStore();
  const { addToast } = useToastStore();

  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const activeSelectedTags = meta.tags
    ? meta.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '')
    : [];

  const searchQuery = inputValue.trim();

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delayDebounceFn = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res: any = await locationService.searchHashtags(searchQuery);
          if (res?.success && Array.isArray(res.data)) {
            setSearchResults(res.data);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error("Lỗi khi tìm kiếm tags:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300ms debounce

      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (destinations.length === 0) {
      fetchDestinations();
    }
  }, [destinations.length, fetchDestinations]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    const selectedProvince = destinations.find(p => p.slug === slug);
    
    updateMeta('provinceSlug', slug);
    if (selectedProvince) {
      updateMeta('locationId', selectedProvince.id);
    } else {
      updateMeta('locationId', '');
    }
  };

  const handleDateChange = (key: 'startDate' | 'endDate', value: string) => {
    if (key === 'endDate' && meta.startDate && value < meta.startDate) {
      addToast('Ngày kết thúc không được trước ngày bắt đầu. Vui lòng chọn lại!', 'error');
      updateMeta('endDate', ''); // Xóa ngày kết thúc không hợp lệ
      return;
    }

    updateMeta(key, value);

    // Nếu thay đổi ngày bắt đầu mà làm ngày kết thúc hiện tại trở nên không hợp lệ
    if (key === 'startDate' && meta.endDate && value > meta.endDate) {
      updateMeta('endDate', ''); // Xóa ngày kết thúc vì bây giờ nó đã trước ngày bắt đầu mới
      addToast('Ngày bắt đầu mới sau ngày kết thúc cũ. Vui lòng chọn lại ngày kết thúc!', 'info');
    }
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    let newTags;
    if (currentTags.includes(tag)) {
      newTags = currentTags.filter(t => t !== tag);
    } else {
      newTags = [...currentTags, tag];
    }
    updateMeta('tags', newTags.join(', '));
    setInputValue('');
  };

  const handleTagSelect = (tag: string) => {
    const currentTags = meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      updateMeta('tags', newTags.join(', '));
    }
    setInputValue('');
  };

  const handleRemoveSelectedTag = (tagToRemove: string) => {
    const currentTags = meta.tags ? meta.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    const newTags = currentTags.filter(t => t !== tagToRemove);
    updateMeta('tags', newTags.join(', '));
  };

  const fields = [
    { key: 'startDate', label: 'Ngày bắt đầu', icon: <Calendar className="w-4 h-4" />, type: 'date' },
    { key: 'endDate', label: 'Ngày kết thúc', icon: <Calendar className="w-4 h-4" />, type: 'date' },
    { key: 'cost', label: 'Chi phí chuyến đi', icon: <DollarSign className="w-4 h-4" />, type: 'text' },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Province Selector (Flagship UI) */}
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#2DD4BF] z-10 transition-colors">
          <MapPin className="w-5 h-5 fill-current opacity-20" />
        </div>
        <select
          value={meta.provinceSlug}
          onChange={handleProvinceChange}
          className="w-full pl-14 pr-10 py-5 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:border-[#2DD4BF]/30 focus:bg-white shadow-sm font-black text-gray-800 transition-all appearance-none cursor-pointer outline-none text-base tracking-tight"
        >
          <option value="">Gắn thẻ địa điểm (34 tỉnh thành)...</option>
          {destinations.map((province) => (
            <option key={province.id} value={province.slug}>
              {province.name}
            </option>
          ))}
        </select>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
           <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 pl-4">{field.label}</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2DD4BF] transition-colors">
                {field.icon}
              </div>
              <input 
                type={field.type}
                value={meta[field.key as keyof typeof meta] as string}
                onChange={(e) => {
                  if (field.type === 'date') {
                    handleDateChange(field.key as any, e.target.value);
                  } else {
                    updateMeta(field.key as any, e.target.value);
                  }
                }}
                placeholder="..." 
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-white focus:bg-white focus:border-[#2DD4BF]/30 shadow-sm font-bold text-gray-700 transition-all placeholder-gray-200 text-sm min-h-[58px]" 
              />
            </div>
          </div>
        ))}
      </div>

      {/* Tags Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 pl-4">Thẻ (Tags)</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2DD4BF] transition-colors">
              <Tag className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => {
                const val = e.target.value;
                if (val.endsWith(',')) {
                  const tag = val.slice(0, -1).trim();
                  if (tag && !activeSelectedTags.includes(tag)) {
                    const newTags = [...activeSelectedTags, tag];
                    updateMeta('tags', newTags.join(', '));
                  }
                  setInputValue('');
                } else {
                  setInputValue(val);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const tag = inputValue.trim();
                  if (tag && !activeSelectedTags.includes(tag)) {
                    const newTags = [...activeSelectedTags, tag];
                    updateMeta('tags', newTags.join(', '));
                  }
                  setInputValue('');
                }
              }}
              placeholder="Nhập thẻ rồi gõ dấu phẩy (,) hoặc nhấn Enter..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-white focus:bg-white focus:border-[#2DD4BF]/30 shadow-sm font-bold text-gray-700 transition-all placeholder-gray-200 text-sm" 
            />
          </div>
        </div>

        {/* Thẻ đã chọn */}
        {activeSelectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 px-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="text-[10px] font-bold text-[#2DD4BF] uppercase tracking-widest w-full mb-1">Thẻ đã chọn:</span>
            {activeSelectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleRemoveSelectedTag(tag)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-[#2DD4BF] text-white shadow-md shadow-teal-500/20 active:scale-95"
              >
                <Check size={12} />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Thẻ gợi ý / Kết quả tìm kiếm */}
        <div className="flex flex-wrap gap-2 px-2">
          {searchQuery.length >= 2 ? (
            <>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-full mb-1">
                {isSearching ? 'Đang tìm kiếm...' : 'Kết quả tìm kiếm:'}
              </span>
              {searchResults.length > 0 ? (
                searchResults
                  .filter(tagObj => !activeSelectedTags.includes(tagObj.name))
                  .map((tagObj) => {
                    const tag = tagObj.name;
                    return (
                      <button
                        key={tagObj.id}
                        type="button"
                        onClick={() => handleTagSelect(tag)}
                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-white border border-gray-100 text-gray-500 hover:border-[#2DD4BF]/30 hover:text-[#2DD4BF] active:scale-95"
                      >
                        {tag}
                      </button>
                    );
                  })
              ) : (
                !isSearching && (
                  <span className="text-xs text-gray-400 italic py-1">Không tìm thấy thẻ nào phù hợp. Nhấn phẩy (,) hoặc Enter để tự tạo thẻ mới.</span>
                )
              )}
            </>
          ) : (
            <>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-full mb-1">Gợi ý cho bạn:</span>
              {SUGGESTED_TAGS
                .filter(tag => !activeSelectedTags.includes(tag))
                .map((tag) => {
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-white border border-gray-100 text-gray-500 hover:border-[#2DD4BF]/30 hover:text-[#2DD4BF] active:scale-95"
                    >
                      {tag}
                    </button>
                  );
                })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetaFields;
