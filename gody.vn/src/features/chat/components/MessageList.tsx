import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MoreHorizontal } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const MessageList: React.FC = () => {
  const { conversations, friends, isListOpen, toggleList, openChat, fetchConversations, fetchFriends } = useChatStore();

  useEffect(() => {
    if (isListOpen) {
      fetchConversations();
      fetchFriends();
    }
  }, [isListOpen, fetchConversations, fetchFriends]);

  return (
    <AnimatePresence>
      {isListOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-24 right-6 w-[360px] h-[500px] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden z-[100] flex flex-col"
        >
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight">Tin nhắn</h2>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                  <MoreHorizontal size={20} />
                </button>
                <button 
                  onClick={toggleList}
                  className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text"
                placeholder="Tìm kiếm cuộc trò chuyện..."
                className="w-full bg-white/5 border-none rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-hide">
            {/* Danh sách Bạn bè (Mutual Follows) */}
            {friends.length > 0 && (
              <div className="mb-4 px-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Bạn bè mới</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => openChat(friend.id)}
                      className="flex flex-col items-center gap-1.5 shrink-0 w-16 group"
                    >
                      <div className="relative">
                        <img 
                          src={friend.avatar || 'http://localhost:90/Project_DuLichMXH/public/uploads/avatars/default.png'} 
                          alt={friend.full_name} 
                          className="w-12 h-12 rounded-full object-cover border-2 border-transparent group-hover:border-purple-500 transition-all shadow-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = 'true';
                              target.src = 'http://localhost:90/Project_DuLichMXH/public/uploads/avatars/default.png';
                            }
                          }}
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></span>
                      </div>
                      <span className="text-[10px] text-slate-300 text-center truncate w-full font-bold">
                        {friend.full_name.split(' ').pop()}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="h-px bg-white/5 my-4"></div>
              </div>
            )}

            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openChat(conv.user.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-[1.5rem] transition-all group"
              >
                <div className="relative shrink-0">
                  <img 
                    src={conv.user.avatar || 'https://i.pravatar.cc/150'} 
                    alt={conv.user.full_name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-transparent group-hover:border-purple-500 transition-all"
                  />
                </div>
                
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white truncate">{conv.user.full_name}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      conv.status === 'pending' ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-500'
                    }`}>
                      {conv.status === 'pending' ? 'Chờ' : 'Bạn bè'}
                    </span>
                  </div>
                  <p className="text-sm truncate text-slate-500 font-medium">
                    {conv.last_message || 'Bắt đầu cuộc trò chuyện...'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MessageList;
