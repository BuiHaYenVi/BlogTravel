import { useState, useEffect } from 'react';
import { 
  Search, 
  Tag, 
  Trash2, 
  TrendingUp, 
  Edit, 
  X, 
  Plus,
  Hash,
  AlertTriangle,
  FolderOpen,
  Settings,
  Compass
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { locationService } from '../../../services/locationService';

const AdminHashtagPage = () => {
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'hashtag' | 'interest'>('hashtag');
  
  // Pagination (chỉ áp dụng cho tab hashtag bài viết)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentTag, setCurrentTag] = useState<any | null>(null);
  const [tagToDelete, setTagToDelete] = useState<any | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const generateSlug = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'hashtag') {
        const response: any = await locationService.getHashtags(currentPage, itemsPerPage, 'hashtag');
        if (response?.data) {
          setHashtags(response.data.data || []);
          setTotalPages(response.data.pagination?.total_pages || 1);
        } else {
          setHashtags([]);
        }
      } else {
        const tagsResponse: any = await locationService.getHashtags(1, 1000, 'interest');
        const catsResponse: any = await locationService.getTagCategories();
        
        if (catsResponse?.success) {
          setCategories(catsResponse.data || []);
        }
        if (tagsResponse?.success && tagsResponse.data) {
          setHashtags(tagsResponse.data.data || []);
        } else {
          setHashtags([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch hashtags data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, activeTab]);

  const handleEdit = (tag: any) => {
    setCurrentTag({...tag});
    setIsEditModalOpen(true);
  };

  const handleAddNew = () => {
    setCurrentTag({
      name: '',
      slug: '',
      type: activeTab === 'hashtag' ? 'hashtag' : 'interest',
      category_id: activeTab === 'interest' && categories.length > 0 ? categories[0].id : '',
      is_trending: false
    });
    setIsEditModalOpen(true);
  };

  const handleAddTagIntoCategory = (catId: number) => {
    setCurrentTag({
      name: '',
      slug: '',
      type: 'interest',
      category_id: catId,
      is_trending: false
    });
    setIsEditModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = generateSlug(name);
    setCurrentTag({ ...currentTag, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSave = { ...currentTag };
      if (dataToSave.type !== 'interest') {
        delete dataToSave.category_id;
      }
      
      if (currentTag.id) {
        await locationService.updateHashtag(currentTag.id, dataToSave);
      } else {
        await locationService.createHashtag(dataToSave);
      }
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      alert(currentTag.id ? "Cập nhật thất bại!" : "Thêm mới thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (tag: any) => {
    setTagToDelete(tag);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!tagToDelete) return;
    setIsSubmitting(true);
    try {
      await locationService.deleteHashtag(tagToDelete.id);
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Xóa thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Category CRUD
  const handleAddNewCategory = () => {
    setEditingCategory({
      name: '',
      icon: 'Compass',
      color: 'from-amber-400 to-orange-500',
      sort_order: categories.length + 1
    });
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCategory(true);
    try {
      if (editingCategory.id) {
        await locationService.updateTagCategory(editingCategory.id, editingCategory);
      } else {
        await locationService.createTagCategory(editingCategory);
      }
      const catsResponse: any = await locationService.getTagCategories();
      if (catsResponse?.success) {
        setCategories(catsResponse.data || []);
      }
      setEditingCategory(null);
      fetchData();
    } catch (error) {
      alert("Lỗi khi lưu danh mục!");
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này? Các thẻ sở thích thuộc danh mục sẽ bị hủy liên kết danh mục.")) return;
    try {
      await locationService.deleteTagCategory(catId);
      const catsResponse: any = await locationService.getTagCategories();
      if (catsResponse?.success) {
        setCategories(catsResponse.data || []);
      }
      fetchData();
    } catch (error) {
      alert("Xóa danh mục thất bại!");
    }
  };

  const renderCategoryIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent size={18} /> : <Compass size={18} />;
  };

  // Lọc tại chỗ nếu có search term
  const filteredTags = (hashtags || []).filter(tag => 
    tag.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tag.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Thẻ hệ thống</h1>
          <p className="text-slate-500 text-sm mt-1">Phân loại thẻ bài viết và quản lý thẻ sở thích dành cho tính năng tìm bạn đồng hành.</p>
        </div>
        <div className="flex gap-2">
            {activeTab === 'interest' && (
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm"
              >
                <Settings size={18} className="text-slate-500" />
                Quản lý Danh mục
              </button>
            )}
            <button onClick={handleAddNew} className="flex items-center gap-2 bg-pastel-orange hover:bg-orange-500 text-white px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-pastel-orange/20 font-bold text-sm">
              <Plus size={18} />
              Thêm Thẻ mới
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => { setActiveTab('hashtag'); setCurrentPage(1); }}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'hashtag' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Hashtag Bài viết & Địa điểm
        </button>
        <button 
          onClick={() => { setActiveTab('interest'); }}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'interest' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          Thẻ sở thích (Onboarding)
        </button>
      </div>

      {/* Stats Quick View (Chỉ hiện khi là Tab Hashtag) */}
      {activeTab === 'hashtag' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-pastel-orange/10 text-pastel-orange flex items-center justify-center">
                    <Hash size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng số Tag</p>
                    <p className="text-2xl font-black text-slate-900">{(hashtags?.length || 0) * totalPages}+</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tag thịnh hành</p>
                    <p className="text-2xl font-black text-slate-900">{hashtags?.filter(t => t.is_trending).length || 0}</p>
                </div>
            </div>
        </div>
      )}

      {/* Search Filter (Chỉ hiện khi là Tab Hashtag) */}
      {activeTab === 'hashtag' && (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Tìm kiếm hashtag..." 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Main Tag Display Grid / Card Layout */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
           <div className="h-8 w-8 animate-spin rounded-full border-4 border-pastel-orange border-t-transparent"></div>
        </div>
      ) : activeTab === 'hashtag' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTags?.map((tag) => (
            <motion.div 
              layout
              key={tag.id}
              className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-3">
                 <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-pastel-orange transition-colors">
                    <Tag size={20} />
                 </div>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(tag)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit size={14} /></button>
                    <button onClick={() => handleDeleteClick(tag)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                 </div>
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-pastel-orange transition-colors">#{tag.name}</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">{tag.slug}</p>
              
              <div className="mt-4 flex items-center justify-between">
                 <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-widest">{tag.post_count || 0} Posts</span>
                 {tag.is_trending && (
                   <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 uppercase bg-emerald-50 px-2 py-0.5 rounded-md">
                      <TrendingUp size={10} /> Trending
                   </span>
                 )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* UI Phân nhóm danh mục cho Thẻ sở thích */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => {
            const catTags = hashtags.filter(t => t.category_id === cat.id);
            return (
              <div key={cat.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-4">
                     <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-md shadow-slate-100`}>
                           {renderCategoryIcon(cat.icon)}
                        </div>
                        <div>
                           <h3 className="font-extrabold text-slate-800 text-sm">{cat.name}</h3>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{catTags.length} Thẻ sở thích</span>
                        </div>
                     </div>
                     <button 
                       onClick={() => handleAddTagIntoCategory(cat.id)}
                       className="p-2 bg-slate-50 hover:bg-pastel-orange hover:text-white rounded-xl text-slate-500 transition-all shadow-sm"
                       title="Thêm thẻ vào danh mục này"
                     >
                        <Plus size={16} />
                     </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                     {catTags.map((tag) => (
                        <div 
                          key={tag.id} 
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all text-xs font-bold text-slate-700 hover:border-slate-300"
                        >
                           <span>#{tag.name}</span>
                           <div className="flex gap-1 border-l border-slate-200 pl-1.5 ml-1">
                              <button onClick={() => handleEdit(tag)} className="text-slate-400 hover:text-blue-500 transition-colors"><Edit size={12} /></button>
                              <button onClick={() => handleDeleteClick(tag)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={12} /></button>
                           </div>
                        </div>
                     ))}
                     {catTags.length === 0 && (
                        <p className="text-xs text-slate-400 italic py-2">Chưa có sở thích nào. Bấm nút + ở góc để thêm!</p>
                     )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Uncategorized section if any */}
          {hashtags.filter(t => t.type === 'interest' && !t.category_id).length > 0 && (
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                         <Compass size={20} />
                      </div>
                      <div>
                         <h3 className="font-extrabold text-slate-800 text-sm">Chưa phân danh mục</h3>
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                           {hashtags.filter(t => t.type === 'interest' && !t.category_id).length} Thẻ
                         </span>
                      </div>
                   </div>
                </div>
                <div className="flex flex-wrap gap-2">
                   {hashtags.filter(t => t.type === 'interest' && !t.category_id).map((tag) => (
                      <div 
                        key={tag.id} 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl transition-all text-xs font-bold text-slate-700"
                      >
                         <span>#{tag.name}</span>
                         <div className="flex gap-1 border-l border-slate-200 pl-1.5 ml-1">
                            <button onClick={() => handleEdit(tag)} className="text-slate-400 hover:text-blue-500 transition-colors"><Edit size={12} /></button>
                            <button onClick={() => handleDeleteClick(tag)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={12} /></button>
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal (Hashtag/Interest tag) */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                   <h3 className="text-xl font-bold text-slate-900">{currentTag?.id ? 'Sửa Thẻ' : 'Thêm Thẻ mới'}</h3>
                   <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tên hiển thị</label>
                      <input type="text" required className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all font-bold" value={currentTag.name} onChange={(e) => handleNameChange(e.target.value)} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loại</label>
                      <select 
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all font-bold" 
                        value={currentTag.type} 
                        onChange={(e) => setCurrentTag({...currentTag, type: e.target.value})}
                      >
                         <option value="hashtag">Hashtag bài viết</option>
                         <option value="location_tag">Địa điểm</option>
                         <option value="topic">Chủ đề</option>
                         <option value="interest">Sở thích (Onboarding)</option>
                      </select>
                   </div>

                   {/* Hiện danh mục khi tag type là interest */}
                   {currentTag.type === 'interest' && (
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Danh mục</label>
                        <select 
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-pastel-orange/30 outline-none transition-all font-bold" 
                          value={currentTag.category_id || ''} 
                          onChange={(e) => setCurrentTag({...currentTag, category_id: e.target.value})}
                          required
                        >
                           <option value="" disabled>-- Chọn danh mục --</option>
                           {categories.map(c => (
                             <option key={c.id} value={c.id}>{c.name}</option>
                           ))}
                        </select>
                     </div>
                   )}

                   {currentTag.type !== 'interest' && (
                     <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                        <input type="checkbox" id="trending" checked={currentTag.is_trending} onChange={(e) => setCurrentTag({...currentTag, is_trending: e.target.checked})} className="w-5 h-5 accent-pastel-orange" />
                        <label htmlFor="trending" className="text-sm font-bold text-slate-700 cursor-pointer">Đánh dấu là xu hướng (Trending)</label>
                     </div>
                   )}
                   
                   <div className="flex gap-3 pt-4">
                      <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Hủy</button>
                      <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 transition-all disabled:opacity-50">
                        {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal (Tag) */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <AlertTriangle size={40} className="text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Xác nhận xóa Thẻ?</h3>
                <p className="text-slate-500 text-sm mb-8 px-4">
                  Bạn có chắc chắn muốn xóa thẻ <span className="font-bold text-slate-900">"#{tagToDelete?.name}"</span>? 
                  Hành động này sẽ xóa vĩnh viễn thẻ khỏi hệ thống.
                </p>
                
                <div className="flex gap-3">
                   <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">Hủy</button>
                   <button onClick={confirmDelete} disabled={isSubmitting} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all disabled:opacity-50">
                      {isSubmitting ? 'Đang xóa...' : 'Vẫn xóa'}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Manager Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCategoryModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                   <h3 className="text-xl font-bold text-slate-900">Quản lý Danh mục sở thích</h3>
                   <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-all"><X size={20} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  {/* Category editor form */}
                  {editingCategory ? (
                    <form onSubmit={handleSaveCategory} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                      <h4 className="font-extrabold text-slate-800 text-sm">{editingCategory.id ? 'Cập nhật danh mục' : 'Thêm danh mục mới'}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tên danh mục</label>
                           <input type="text" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-orange/30 outline-none text-sm font-bold" value={editingCategory.name} onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Icon Lucide</label>
                           <input type="text" placeholder="Utensils, Plane, Heart, Camera..." required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-orange/30 outline-none text-sm font-medium" value={editingCategory.icon} onChange={(e) => setEditingCategory({...editingCategory, icon: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Màu sắc (Tailwind Gradient)</label>
                           <input type="text" placeholder="from-amber-400 to-orange-500" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-orange/30 outline-none text-sm font-medium" value={editingCategory.color} onChange={(e) => setEditingCategory({...editingCategory, color: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thứ tự sắp xếp</label>
                           <input type="number" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-pastel-orange/30 outline-none text-sm font-bold" value={editingCategory.sort_order} onChange={(e) => setEditingCategory({...editingCategory, sort_order: parseInt(e.target.value) || 0})} />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <button type="button" onClick={() => setEditingCategory(null)} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-300 transition-all">Hủy</button>
                        <button type="submit" disabled={isSubmittingCategory} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50">
                          {isSubmittingCategory ? 'Đang lưu...' : 'Lưu lại'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={handleAddNewCategory} className="w-full py-4.5 border-2 border-dashed border-slate-200 hover:border-pastel-orange text-slate-500 hover:text-pastel-orange rounded-3xl flex items-center justify-center gap-1.5 font-bold text-sm transition-all bg-slate-50/50 hover:bg-pastel-orange/5">
                      <Plus size={18} />
                      Tạo Danh mục mới
                    </button>
                  )}

                  {/* Categories list */}
                  <div className="space-y-3">
                    {categories.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-4.5 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 bg-gradient-to-br ${c.color} text-white rounded-xl`}>
                            {renderCategoryIcon(c.icon)}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 text-sm">{c.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-bold bg-white px-1.5 py-0.5 rounded border">ID: {c.id}</span>
                              <span className="text-[10px] text-slate-400 font-bold bg-white px-1.5 py-0.5 rounded border">Thứ tự: {c.sort_order}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => setEditingCategory({...c})} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteCategory(c.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-center text-xs text-slate-400 italic py-6">Chưa có danh mục nào.</p>
                    )}
                  </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminHashtagPage;
