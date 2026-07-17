import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Phone, 
  Video, 
  Smile, 
  Send, 
  Minus,
  MessageSquare,
  Clock
} from 'lucide-react';
import { useChatStore, Conversation } from '../store/useChatStore';
import { socketService } from '../../../services/socket/socketService';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';

const LinkifiedText = ({ text }: { text: string }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          return (
            <a 
              key={i} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white font-semibold underline underline-offset-2 break-all hover:opacity-80 transition-opacity"
            >
              {part}
            </a>
          );
        }
        // render text handling newlines
        return <span key={i}>{part.split('\n').map((line, j, arr) => (
          <React.Fragment key={j}>
            {line}
            {j < arr.length - 1 && <br />}
          </React.Fragment>
        ))}</span>;
      })}
    </>
  );
};

interface ChatWindowProps {
  conversation: Conversation;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation }) => {
  const { closeChat, sendMessage, updateStatus } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onEmojiClick = useCallback((emojiData: EmojiClickData) => {
    setInputText(prev => prev + emojiData.emoji);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const { user, status, messages, id: convId, isTyping } = conversation;
  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.user?.id?.toString();
    } catch { return ''; }
  })();

  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    // Gửi typing event
    socketService.emit('typing', { conversationId: convId, isTyping: true });

    // Auto stop typing sau 2 giây
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketService.emit('typing', { conversationId: convId, isTyping: false });
    }, 2000);
  }, [convId]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    // Dừng typing indicator
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    socketService.emit('typing', { conversationId: convId, isTyping: false });
    await sendMessage(convId, user.id, text);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [inputText, convId, user.id, sendMessage]);

  return (
    <motion.div
      initial={{ y: 400, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 400, opacity: 0 }}
      className="w-full sm:w-[340px] bg-slate-900 border border-white/10 sm:rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
      style={{ height: isMinimized ? 'auto' : '450px' }}
    >
      {/* Header */}
      <div className="p-3 bg-slate-800/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={user.avatar || 'https://i.pravatar.cc/150'} 
              alt={user.full_name} 
              className="w-9 h-9 rounded-full object-cover border border-white/10"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">{user.full_name}</h3>
            <span className="text-[10px] text-green-400 font-semibold">
              {isTyping ? 'Đang nhập...' : (status === 'pending' ? 'Yêu cầu tin nhắn' : 'Đang hoạt động')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 text-slate-400">
          <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors" title="Gọi thoại">
            <Phone size={15} />
          </button>
          <button className="p-1.5 hover:bg-white/5 rounded-lg transition-colors" title="Gọi video">
            <Video size={15} />
          </button>
          <button 
            onClick={() => setIsMinimized(v => !v)}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors" 
            title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
          >
            <Minus size={15} />
          </button>
          <button 
            onClick={() => closeChat(convId)}
            className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
            title="Đóng"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Body - ẩn khi minimized */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide bg-slate-900"
          >
            {/* Yêu cầu chấp nhận */}
            {status === 'pending' && messages.length > 0 && messages[messages.length-1].sender_id !== currentUserId && (
              <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-5 text-center my-2">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white mx-auto mb-3 shadow-xl">
                  <MessageSquare size={22} />
                </div>
                <h4 className="text-white font-bold mb-1 text-sm">Yêu cầu trò chuyện</h4>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Bạn có muốn nhận tin nhắn từ <b>{user.full_name}</b> không?
                </p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => updateStatus(convId, 'accepted')}
                    className="w-full py-2.5 bg-white text-slate-900 font-bold rounded-xl text-sm hover:bg-slate-100 transition-all active:scale-95"
                  >
                    ✓ Chấp nhận
                  </button>
                  <button 
                    onClick={() => updateStatus(convId, 'blocked')}
                    className="w-full py-2.5 bg-red-500/10 text-red-400 font-bold rounded-xl text-sm hover:bg-red-500/20 transition-all"
                  >
                    ✕ Từ chối & Chặn
                  </button>
                </div>
              </div>
            )}

            {/* Danh sách tin nhắn */}
            {messages.map((msg) => {
              const isMe = msg.sender_id?.toString() === currentUserId;
              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[80%] px-3 py-2 text-sm leading-relaxed transition-opacity ${
                    isMe 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm'
                  } ${msg.pending ? 'opacity-60' : 'opacity-100'}`}>
                    <LinkifiedText text={msg.message_text} />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                    {msg.pending && <Clock size={9} className="animate-pulse" />}
                    {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-start">
                <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-slate-800/30 border-t border-white/5 shrink-0 relative">
            {showEmojiPicker && (
              <div 
                ref={emojiPickerRef} 
                className="absolute bottom-full left-3 right-3 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/10"
              >
                <EmojiPicker 
                  onEmojiClick={onEmojiClick} 
                  autoFocusSearch={false} 
                  theme={Theme.DARK} 
                  width="100%" 
                  height={300}
                />
              </div>
            )}
            {(status === 'accepted' || (status === 'pending' && messages.every(m => m.sender_id?.toString() === currentUserId))) ? (
              <div className="flex items-center gap-2">
                <button 
                  ref={emojiButtonRef}
                  onClick={() => setShowEmojiPicker(v => !v)}
                  className={`text-slate-500 hover:text-purple-400 transition-colors shrink-0 ${showEmojiPicker ? 'text-purple-400' : ''}`}
                >
                  <Smile size={19} />
                </button>
                <div className="flex-1 relative">
                  <input 
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Nhập tin nhắn..."
                    className="w-full bg-slate-800 text-white text-sm py-2.5 px-4 rounded-full outline-none focus:ring-2 focus:ring-purple-500/60 transition-all border border-white/5 focus:border-purple-500/40"
                    autoComplete="off"
                  />
                </div>
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/20 active:scale-90 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            ) : status === 'blocked' ? (
              <div className="text-center py-1.5">
                <p className="text-xs text-red-400 font-bold uppercase tracking-widest">Đã chặn người dùng này</p>
              </div>
            ) : (
              <div className="text-center py-1.5">
                <p className="text-xs text-slate-500 font-medium italic">Đang chờ xác nhận yêu cầu...</p>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ChatWindow;
