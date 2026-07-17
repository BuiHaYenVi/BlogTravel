import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, MapPin, Compass, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Suggestion {
  id: number | string;
  name: string;
  subName?: string;
  slug?: string;
  type?: 'province' | 'spot' | 'all';
  image?: string;
}

interface AutocompleteProps {
  placeholder?: string;
  onSearch: (query: string) => Promise<Suggestion[]>;
  onSelect: (suggestion: Suggestion) => void;
  onChange?: (value: string) => void;
  className?: string;
  debounceMs?: number;
  autoFocus?: boolean;
  showIcon?: boolean;
}

const Autocomplete: React.FC<AutocompleteProps> = ({ 
  placeholder = "Tìm kiếm...", 
  onSearch, 
  onSelect,
  onChange,
  className = "",
  debounceMs = 300,
  autoFocus = false,
  showIcon = true
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce logic
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setHasSearched(false);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      setIsOpen(true);
      try {
        const results = await onSearch(query);
        setSuggestions(results);
        setHasSearched(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [query, onSearch, debounceMs]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (onChange) onChange(value);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setHasSearched(false);
    if (onChange) onChange('');
  };

  // Hàm để highlight các kí tự khớp
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    
    // Tạo regex để tìm chuỗi khớp (không phân biệt hoa thường)
    // Để hỗ trợ tiếng Việt tốt hơn, có thể dùng các thư viện normalize nhưng ở đây dùng regex cơ bản
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="text-orange-500 font-black">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div className="relative group">
        {showIcon && (
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
        )}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full pr-12 py-4 !bg-transparent dark:!bg-transparent !border-none dark:!border-none focus:!ring-0 !outline-none text-gray-700 dark:text-slate-100 font-bold placeholder-gray-400 dark:placeholder-slate-500 ${showIcon ? 'pl-12' : 'pl-6'}`}
          style={{ backgroundColor: 'transparent', border: 'none', outline: 'none', boxShadow: 'none' }}
          autoFocus={autoFocus}
        />
        {query && (
          <button 
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all"
          >
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute top-full left-0 right-0 mt-4 bg-surface rounded-[2rem] shadow-2xl border border-theme overflow-hidden z-50 py-2"
          >
            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <span className="text-sm font-bold tracking-tight">Đang tìm kiếm...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto px-2">
                <div className="px-4 py-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Gợi ý địa điểm</div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(item);
                      setIsOpen(false);
                      setQuery(item.name);
                    }}
                    className="w-full p-3 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-2xl flex items-center gap-4 text-left transition-all group"
                  >
                    <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-50 dark:border-slate-700">
                      {item.type === 'province' ? (
                        <MapPin size={20} className="text-orange-500" />
                      ) : (
                        <Compass size={20} className="text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 truncate transition-colors">
                        {highlightText(item.name, query)}
                      </h4>
                      {item.subName && <p className="text-xs text-gray-400 dark:text-slate-400 font-medium truncate uppercase tracking-tighter">{item.subName}</p>}
                    </div>
                    <ChevronRight size={16} className="text-gray-300 dark:text-slate-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            ) : hasSearched ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-gray-200 dark:text-slate-600" />
                </div>
                <p className="font-bold text-gray-400 dark:text-gray-300">Không tìm thấy địa điểm nào</p>
                <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">Hãy thử với từ khóa khác bạn nhé!</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Autocomplete;
