import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, UserPlus, Check } from 'lucide-react';
import { useCompanionStore, Trip } from '../store/useCompanionStore';
import { useToast } from '../../../shared/hooks/useToast';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({ isOpen, onClose, trip }) => {
  const { showToast } = useToast();
  const { fetchMutualFriends, inviteFriendAction } = useCompanionStore();
  const [friends, setFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitingId, setInvitingId] = useState<string | number | null>(null);

  // Keep a local set of successfully invited IDs in this session
  const [sessionInvitedIds, setSessionInvitedIds] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    const loadFriends = async () => {
      if (isOpen) {
        setLoading(true);
        try {
          const list = await fetchMutualFriends();
          setFriends(list || []);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      }
    };
    loadFriends();
  }, [isOpen, fetchMutualFriends]);

  const handleInvite = async (friendId: string | number, friendName: string) => {
    if (invitingId !== null) return;
    setInvitingId(friendId);
    try {
      const success = await inviteFriendAction(trip.id, friendId);
      if (success) {
        setSessionInvitedIds(prev => {
          const updated = new Set(prev);
          updated.add(friendId);
          return updated;
        });
        showToast(`Đã gửi lời mời tham gia đến ${friendName}!`, 'success');
      } else {
        showToast('Không thể gửi lời mời. Có thể người này đã được mời.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi gửi lời mời', 'error');
    } finally {
      setInvitingId(null);
    }
  };

  if (!isOpen) return null;

  // Filter out friends already in the accepted participant list or are the creator
  const participantIds = new Set([
    String(trip.user_id),
    ...(trip.participantList?.map(p => String(p.user_id)) || [])
  ]);

  const filteredFriends = friends.filter(friend => {
    // Must not be in participant list
    const isParticipant = participantIds.has(String(friend.id));
    if (isParticipant) return false;

    // Must match search query
    const name = (friend.full_name || friend.username || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative max-w-md w-full mx-4 bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[80vh] z-10 border border-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-2xl text-orange-500">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Mời bạn bè</h3>
                <p className="text-xs text-slate-400 font-medium">Mời bạn bè của bạn tham gia hành trình</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-5 border-b border-slate-50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Tìm bạn bè theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white border border-transparent focus:border-orange-500 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Friends List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[250px] max-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="animate-spin text-orange-500 mb-2" size={28} />
                <span className="text-xs font-bold">Đang tải danh sách bạn bè...</span>
              </div>
            ) : filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => {
                const isSessionInvited = sessionInvitedIds.has(friend.id);
                const isInviting = invitingId === friend.id;

                return (
                  <div key={friend.id} className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <img 
                        src={friend.avatar || 'https://i.pravatar.cc/150'} 
                        alt={friend.full_name || friend.username}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-100"
                      />
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">{friend.full_name || friend.username}</h5>
                        <p className="text-xs text-slate-400 font-medium">@{friend.username}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInvite(friend.id, friend.full_name || friend.username)}
                      disabled={isInviting || isSessionInvited}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                        isSessionInvited
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none cursor-default'
                          : 'bg-white text-orange-500 border-orange-100 hover:bg-orange-500 hover:text-white hover:border-orange-500 active:scale-95'
                      }`}
                    >
                      {isInviting ? (
                        <Loader2 className="animate-spin" size={12} />
                      ) : isSessionInvited ? (
                        <Check size={12} strokeWidth={3} />
                      ) : (
                        <UserPlus size={12} />
                      )}
                      <span>{isSessionInvited ? 'Đã mời' : 'Mời'}</span>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p className="font-bold text-sm">Không tìm thấy bạn bè nào phù hợp</p>
                <p className="text-xs text-slate-400 mt-1">Hãy chắc chắn họ là bạn bè (mutual follow) của bạn.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
