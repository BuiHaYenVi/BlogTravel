import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Users, BookOpen, User as UserIcon, Loader2 } from 'lucide-react';
import BackButton from '../../../shared/components/common/BackButton';
import { searchApi } from '../services/searchApi';
import { getImageUrl } from '../../../shared/utils/imageHelper';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState<'all' | 'locations' | 'posts' | 'groups' | 'users'>('all');
  const [loading, setLoading] = useState(false);

  const [results, setResults] = useState({
    locations: [] as any[],
    posts: [] as any[],
    groups: [] as any[],
    users: [] as any[]
  });

  const [counts, setCounts] = useState({
    locations: 0,
    posts: 0,
    groups: 0,
    users: 0
  });

  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.length < 2) {
        setResults({ locations: [], posts: [], groups: [], users: [] });
        setCounts({ locations: 0, posts: 0, groups: 0, users: 0 });
        return;
      }

      setLoading(true);
      try {
        const response = await searchApi.searchAll(query);
        if (response.success) {
          const { results: searchResults, counts: searchCounts } = response.data;
          setResults({
            locations: searchResults.locations || [],
            posts: searchResults.posts || [],
            groups: searchResults.groups || [],
            users: searchResults.users || []
          });
          setCounts({
            locations: searchCounts.locations || 0,
            posts: searchCounts.posts || 0,
            groups: searchCounts.groups || 0,
            users: searchCounts.users || 0
          });
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const q = (formData.get('q') as string).trim();
    if (q) setSearchParams({ q });
  };

  const renderLocations = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {results.locations.map(dest => (
        <Link 
          to={dest.type === 'spot' ? `/destination/${dest.parent_slug}/spot/${dest.id}` : `/destination/${dest.slug}`} 
          key={dest.id} 
          className="group block"
        >
          <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3">
            <img src={getImageUrl(dest.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={dest.name} />
          </div>
          <h3 className="font-bold text-base-color group-hover:text-pastel-orange transition-colors">{dest.name}</h3>
          <p className="text-xs text-muted-color font-bold uppercase tracking-widest">
            {dest.type === 'spot' ? 'Điểm tham quan' : (dest.region || 'Tỉnh thành')}
          </p>
        </Link>
      ))}
    </div>
  );

  const renderPosts = () => (
    <div className="space-y-6">
      {results.posts.map(post => (
        <Link to={`/blog/${post.id}`} key={post.id} className="flex gap-4 group bg-surface p-4 rounded-2xl border border-theme hover:shadow-lg transition-all">
          <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
            <img 
              src={getImageUrl(post.images && post.images[0] ? post.images[0] : (post.cover_image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400'))} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
              alt="post" 
            />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-bold text-base-color group-hover:text-pastel-orange transition-colors line-clamp-2 mb-2">{post.title}</h3>
            <div className="flex items-center gap-2 mb-2">
              <Link 
                to={`/profile/${post.user_id}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:opacity-80 transition-opacity shrink-0"
              >
                <img src={getImageUrl(post.avatar)} className="w-5 h-5 rounded-full object-cover" alt="author" />
              </Link>
              <Link 
                to={`/profile/${post.user_id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-bold text-muted-color uppercase tracking-widest hover:text-blue-500 hover:underline transition-all"
              >
                {post.username}
              </Link>
            </div>
            <div className="text-sm text-muted-color line-clamp-2" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

        </Link>
      ))}
    </div>
  );

  const renderGroups = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {results.groups.map(group => (
        <Link to={`/group/${group.id}`} key={group.id} className="flex gap-4 group bg-surface p-4 rounded-2xl border border-theme hover:shadow-lg transition-all">
          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
            <img src={getImageUrl(group.cover_image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={group.name} />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-bold text-base-color group-hover:text-pastel-orange transition-colors line-clamp-1 mb-1">{group.name}</h3>
            <p className="text-xs text-muted-color mb-2">{group.member_count?.toLocaleString() || 0} thành viên</p>
            <p className="text-sm text-muted-color line-clamp-1">{group.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );

  const renderUsers = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {results.users.map(user => (
        <Link to={`/profile/${user.id}`} key={user.id} className="flex items-center gap-4 bg-surface p-4 rounded-2xl border border-theme hover:shadow-lg transition-all group">
          <img src={getImageUrl(user.avatar)} className="w-16 h-16 rounded-full object-cover border-2 border-theme shadow-md group-hover:scale-105 transition-transform" alt={user.username} />
          <div>
            <h3 className="font-black text-base-color group-hover:text-pastel-orange transition-colors">@{user.username}</h3>
            <p className="text-xs text-muted-color font-bold uppercase tracking-widest">{user.follower_count || 0} Followers</p>
          </div>
        </Link>
      ))}
    </div>
  );

  const totalResults = counts.locations + counts.posts + counts.groups + counts.users;

  return (
    <div className="pt-24 min-h-screen bg-app pb-20">
      <div className="max-w-5xl mx-auto px-4">
        <BackButton className="mb-6" />
        
        {/* Search Header */}
        <div className="bg-surface p-8 rounded-[2.5rem] shadow-sm border border-theme mb-10">
          <h1 className="text-3xl font-black text-base-color mb-6">Tìm kiếm</h1>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-color w-6 h-6" />
            <input 
              name="q"
              defaultValue={query}
              type="text" 
              placeholder="Tìm kiếm điểm đến, bài viết, người dùng, hội nhóm..." 
              className="w-full bg-surface-2 border-none rounded-2xl pl-16 pr-6 py-4 focus:ring-2 focus:ring-pastel-orange outline-none text-lg font-medium text-base-color transition-all"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-pastel-orange text-white px-6 py-2 rounded-xl font-bold hover:bg-orange-500 transition-colors flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Tìm
            </button>
          </form>
        </div>

        {query && query.length >= 2 && (
          <div className="mb-8 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setActiveTab('all')} className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all ${activeTab === 'all' ? 'bg-gray-900 dark:bg-slate-700 text-white' : 'bg-surface text-muted-color hover:bg-surface-2 border border-theme'}`}>
              Tất cả ({totalResults})
            </button>
            <button onClick={() => setActiveTab('locations')} className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'locations' ? 'bg-pastel-orange text-white' : 'bg-surface text-muted-color hover:bg-surface-2 border border-theme'}`}>
              <MapPin size={16} /> Điểm đến ({counts.locations})
            </button>
            <button onClick={() => setActiveTab('posts')} className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'posts' ? 'bg-pastel-orange text-white' : 'bg-surface text-muted-color hover:bg-surface-2 border border-theme'}`}>
              <BookOpen size={16} /> Bài viết ({counts.posts})
            </button>
            <button onClick={() => setActiveTab('groups')} className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'groups' ? 'bg-pastel-orange text-white' : 'bg-surface text-muted-color hover:bg-surface-2 border border-theme'}`}>
              <Users size={16} /> Nhóm ({counts.groups})
            </button>
            <button onClick={() => setActiveTab('users')} className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-pastel-orange text-white' : 'bg-surface text-muted-color hover:bg-surface-2 border border-theme'}`}>
              <UserIcon size={16} /> Người dùng ({counts.users})
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-pastel-orange animate-spin" />
            <p className="font-bold text-muted-color">Đang tìm kiếm dữ liệu...</p>
          </div>
        ) : query && query.length >= 2 ? (
          <div className="space-y-12">
            {(activeTab === 'all' || activeTab === 'locations') && results.locations.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-base-color mb-6 flex items-center gap-2">
                  <MapPin className="text-pastel-orange" /> Điểm đến ({counts.locations})
                </h2>
                {renderLocations()}
              </section>
            )}

            {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-base-color mb-6 flex items-center gap-2">
                  <BookOpen className="text-pastel-orange" /> Bài viết ({counts.posts})
                </h2>
                {renderPosts()}
              </section>
            )}

            {(activeTab === 'all' || activeTab === 'groups') && results.groups.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-base-color mb-6 flex items-center gap-2">
                  <Users className="text-pastel-orange" /> Nhóm cộng đồng ({counts.groups})
                </h2>
                {renderGroups()}
              </section>
            )}

            {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
              <section>
                <h2 className="text-xl font-black text-base-color mb-6 flex items-center gap-2">
                  <UserIcon className="text-pastel-orange" /> Người dùng ({counts.users})
                </h2>
                {renderUsers()}
              </section>
            )}

            {totalResults === 0 && (
              <div className="text-center py-20 bg-surface rounded-[2.5rem] border-2 border-dashed border-theme">
                <Search className="w-16 h-16 text-muted-color/30 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-muted-color">Không tìm thấy kết quả nào cho "{query}"</h2>
                <p className="text-faint-color mt-2">Thử với từ khóa khác xem sao bạn nhé!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-muted-color/30 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-muted-color">Nhập từ khóa (tối thiểu 2 ký tự) để bắt đầu tìm kiếm</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
