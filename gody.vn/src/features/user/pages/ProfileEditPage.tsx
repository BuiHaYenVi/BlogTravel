import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../../features/auth/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, X, Plus, CheckCircle } from 'lucide-react';
import { userApi } from '../../../features/user/services/userApi';
import { getImageUrl } from '../../../shared/utils/imageHelper';
import BackButton from '../../../shared/components/common/BackButton';
import Modal from '../../../shared/components/common/Modal';

const ProfileEditPage = () => {
  const { user, updateProfile } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [interests, setInterests] = useState<string[]>(user?.interests || ['Du lịch', 'Chụp ảnh']);
  const [newInterest, setNewInterest] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Dùng state để lưu trữ preview URL
  const [avatarPreview, setAvatarPreview] = useState(getImageUrl(user?.avatar));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setSaving(true);
    try {
      let finalAvatar = user?.avatar || '';
      
      // 1. Upload ảnh nếu có chọn file mới
      if (selectedFile) {
        const uploadRes = await userApi.uploadAvatar(user.id, selectedFile);
        if (uploadRes.success && uploadRes.data?.avatar_url) {
          finalAvatar = uploadRes.data.avatar_url;
        }
      }

      // 2. Cập nhật thông tin profile
      const updateData = {
        full_name: name,
        bio: bio,
        location: location,
        interests: interests.length > 0 ? interests.join(', ') : '', 
      };
      
      const response = await userApi.updateProfile(user.id, updateData);
      
      if (response.success) {
        const serverUser = response.data; 
        
        updateProfile({
          name: serverUser.name || serverUser.username,
          bio: serverUser.bio || '',
          avatar: serverUser.avatar || finalAvatar,
          location: serverUser.location || '',
          interests: Array.isArray(serverUser.interests) 
            ? serverUser.interests 
            : (typeof serverUser.interests === 'string' ? serverUser.interests.split(', ') : [])
        });

        setShowSuccessModal(true);
      } else {
        alert(response.message || 'Cập nhật thất bại');
      }
    } catch (err: any) {
      console.error('Update Profile Error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Vui lòng thử lại';
      alert('Có lỗi xảy ra: ' + errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-app pb-20 px-4 transition-colors duration-300">
      <div className="max-w-3xl mx-auto mb-6">
        <BackButton />
      </div>
      <form onSubmit={handleSave} className="max-w-3xl mx-auto bg-surface rounded-3xl shadow-sm border border-theme overflow-hidden">
        
        <div className="border-b border-theme p-6 flex justify-between items-center bg-surface sticky top-0 z-10">
          <h2 className="text-2xl font-black text-base-color">Thiết lập hồ sơ</h2>
          <button 
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-gray-900 text-white font-black rounded-2xl flex items-center gap-2 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
            ) : <Save className="w-5 h-5" />}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>

        <div className="p-8">
          {/* Avatar Edit */}
          <div className="flex flex-col items-center mb-12">
            <div 
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-36 h-36 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl">
                <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar Preview" />
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <Camera className="text-white w-8 h-8" />
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </div>
            <p className="mt-4 text-sm font-bold text-faint-color uppercase tracking-widest">Thay đổi ảnh đại diện</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-muted-color uppercase tracking-widest mb-3">Tên hiển thị</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên của bạn"
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:bg-white transition-all font-bold text-gray-700 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-400 dark:focus:bg-slate-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-muted-color uppercase tracking-widest mb-3">Email cá nhân (Không thể sửa)</label>
              <input 
                type="email" 
                value={user?.email || ''} 
                readOnly
                className="w-full px-6 py-4 bg-gray-100 border border-gray-50 rounded-2xl text-gray-400 font-bold cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-muted-color uppercase tracking-widest mb-3">Giới thiệu (Bio)</label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Chia sẻ một chút về bản thân bạn..."
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:bg-white transition-all font-medium text-gray-600 resize-none dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-400 dark:focus:bg-slate-700"
              ></textarea>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-muted-color uppercase tracking-widest mb-3">Sở thích cá nhân</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {interests.map((interest, index) => (
                  <span key={index} className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 group/tag dark:bg-orange-950/30 dark:text-orange-400">
                    {interest}
                    <button 
                      type="button" 
                      onClick={() => removeInterest(index)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                  placeholder="Thêm sở thích mới..."
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900/5 focus:bg-white transition-all font-bold text-gray-700 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 dark:placeholder:text-slate-400 dark:focus:bg-slate-700"
                />
                <button 
                  type="button"
                  onClick={addInterest}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/profile');
        }}
        title="Cập nhật thành công"
        footer={
          <button
            onClick={() => {
              setShowSuccessModal(false);
              navigate('/profile');
            }}
            className="px-8 py-3 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all active:scale-95"
          >
            Đồng ý
          </button>
        }
      >
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 dark:bg-green-950/30">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-bold text-lg">
            Thông tin cá nhân của bạn đã được cập nhật thành công!
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ProfileEditPage;
