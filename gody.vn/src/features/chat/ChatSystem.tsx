import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useChatStore } from './store/useChatStore';
import ChatFloatingButton from './components/ChatFloatingButton';
import MessageList from './components/MessageList';
import ChatWindow from './components/ChatWindow';

const ChatSystem: React.FC = () => {
  const { activeChats } = useChatStore();

  return (
    <div className="fixed bottom-0 right-0 z-[100] pointer-events-none">
      <div className="pointer-events-auto">
        <ChatFloatingButton />
        <MessageList />
      </div>

      <div className="fixed bottom-0 right-0 sm:right-24 flex flex-col-reverse sm:flex-row-reverse items-end gap-4 px-4 pointer-events-none">
        <AnimatePresence>
          {activeChats.map((conv) => (
            <div key={conv.id} className="pointer-events-auto">
              <ChatWindow conversation={conv} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatSystem;
