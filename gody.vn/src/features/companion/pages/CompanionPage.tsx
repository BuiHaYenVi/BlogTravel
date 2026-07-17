import React, { useState, useEffect } from 'react';
import SuggestedUsersTab from '../components/SuggestedUsersTab';
import ActiveTripsTab from '../components/ActiveTripsTab';
import { Users, Settings2, Search } from 'lucide-react';
import { useCompanionStore } from '../store/useCompanionStore';

const INTERESTS = [
  'Tất cả',
  'Leo núi',
  'Camping',
  'Nhiếp ảnh',
  'Phượt',
  'Ẩm thực',
  'Nghỉ dưỡng',
  'Biển'
];

const CompanionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'trips'>('suggestions');
  const [selectedInterest, setSelectedInterest] = useState('Tất cả');
  const { searchQuery, setSearchQuery, fetchSuggestions, fetchTrips, availableTags, fetchTags, availableInterests, fetchInterests } = useCompanionStore();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [tagSearch, setTagSearch] = useState('');

  // Load data based on tab
  useEffect(() => {
    fetchTags();
    fetchInterests();
  }, [fetchTags, fetchInterests]);

  // Reset selected interest when tab changes
  useEffect(() => {
    setSelectedInterest('Tất cả');
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'suggestions') {
      fetchSuggestions(selectedInterest);
    }
  }, [activeTab, selectedInterest, searchQuery, fetchSuggestions]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  const tagsToDisplay = activeTab === 'suggestions' ? availableInterests : availableTags;

  const filteredTags = tagsToDisplay.filter(tag => 
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Users size={32} />
            </div>
            Tìm bạn đồng hành
          </h1>
          <p className="text-gray-500 mt-2">Kết nối với những người bạn cùng đam mê và cùng nhau khám phá thế giới.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
            placeholder="Tìm theo sở thích (vùng miền, hoạt động...)"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all relative ${
            activeTab === 'suggestions' 
            ? 'text-orange-500' 
            : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Gợi ý cho bạn
          {activeTab === 'suggestions' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-t-full shadow-[0_-2px_8px_rgba(249,115,22,0.4)]"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-all relative ${
            activeTab === 'trips' 
            ? 'text-orange-500' 
            : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Chuyến đi đang tìm bạn
          {activeTab === 'trips' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-t-full shadow-[0_-2px_8px_rgba(249,115,22,0.4)]"></div>
          )}
        </button>
      </div>

      {/* Interest Filter Bar with Tag Search */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Tìm hashtag..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs focus:ring-1 focus:ring-orange-500 outline-none w-full"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
            <button
              onClick={() => setSelectedInterest('Tất cả')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border ${
                selectedInterest === 'Tất cả'
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500'
              }`}
            >
              Tất cả
            </button>
            {filteredTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedInterest(tag)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap border ${
                  selectedInterest === tag
                    ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-500'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-500">
        {activeTab === 'suggestions' ? (
          <SuggestedUsersTab filter={selectedInterest} />
        ) : (
          <ActiveTripsTab filter={selectedInterest} />
        )}
      </div>
    </div>
  );
};


export default CompanionPage;
