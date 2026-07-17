import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';

const ChatFloatingButton: React.FC = () => {
  const { toggleList, isListOpen } = useChatStore();

  return (
    <button
      onClick={toggleList}
      className={`fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-purple-500/40 z-[110] transition-all active:scale-90 hover:scale-110 ${
        isListOpen ? 'rotate-90' : 'rotate-0'
      }`}
    >
      <MessageCircle size={32} />
    </button>
  );
};

export default ChatFloatingButton;
