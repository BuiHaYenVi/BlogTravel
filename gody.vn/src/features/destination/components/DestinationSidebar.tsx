import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface DestinationSidebarProps {
  provinceName: string;
  slug: string;
}

const DestinationSidebar: React.FC<DestinationSidebarProps> = ({ provinceName, slug }) => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const activeTab = query.get('tab') || 'intro';

  const menuItems = [
    { id: 'intro', label: 'Giới thiệu', path: `/destination/${slug}` },
    { id: 'attractions', label: 'Điểm du lịch', path: `/destination/${slug}?tab=attractions` },
    { id: 'experiences', label: 'Kinh nghiệm', path: `/destination/${slug}?tab=experiences` },
  ];

  // Logic to determine active item in sidebar
  const getIsActive = (item: any) => {
    if (location.pathname.includes('/spot/') && item.id === 'attractions') return true;
    if (item.id === 'intro' && location.pathname === `/destination/${slug}` && !location.search) return true;
    if (location.search.includes(`tab=${item.id}`)) return true;
    return false;
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden sticky top-28">
        <div className="px-10 py-8">
          <h2 className="text-[28px] font-bold text-[#1A202C] tracking-tight">{provinceName}</h2>
        </div>
        
        <nav className="flex flex-col">
          {menuItems.map((item, index) => {
            const active = getIsActive(item);
            return (
              <Link 
                key={index}
                to={item.path}
                className={`flex items-center justify-between px-10 py-7 border-t border-gray-50 transition-all group ${
                  active ? 'text-[#F09B3E]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className="text-[19px] font-bold tracking-tight">{item.label}</span>
                <ChevronRight className={`w-6 h-6 transition-transform group-hover:translate-x-1 ${active ? 'text-[#F09B3E]' : 'text-gray-200'}`} />
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DestinationSidebar;
