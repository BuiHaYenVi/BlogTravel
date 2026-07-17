import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { useBlogEditor } from '../store/useBlogEditor';
import { Plus, X, Image as ImageIcon, LayoutList, Video, MessageSquare, Globe, Link as LinkIcon, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TiptapEditor: React.FC = () => {
  const { content, updateField } = useBlogEditor();
  const [isFocused, setIsFocused] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [activeInput, setActiveInput] = useState<'none' | 'instagram' | 'image' | 'video' | 'facebook' | 'link'>('none');
  const [inputValue, setInputValue] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({
        placeholder: 'Hành trình của bạn bắt đầu tại đây... (Click + để chèn đa phương tiện)',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      updateField('content', editor.getHTML());
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  // Re-sync if store gets cleared
  useEffect(() => {
    if (editor && content === '' && editor.getHTML() !== '<p></p>') {
      editor.commands.clearContent();
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue) return;

    if (activeInput === 'image' || activeInput === 'instagram') {
      editor.chain().focus().setImage({ src: inputValue }).run();
    }
    
    setInputValue('');
    setActiveInput('none');
    setShowToolbar(false);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const src = readerEvent.target?.result as string;
        editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  const onToolClick = (type: string) => {
    if (type === 'image') {
      fileInputRef.current?.click();
    } else {
      setActiveInput(type as any);
    }
  };

  return (
    <div className="min-h-[500px] relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload} 
      />
      {/* Premium Toolbar */}
      <div className="flex items-start gap-8">
        <div className="sticky top-28 z-20">
          <motion.button 
            type="button"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setShowToolbar(!showToolbar);
              if (showToolbar) setActiveInput('none');
            }}
            className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center shrink-0 cursor-pointer transition-all border-4 border-white ${showToolbar ? 'bg-slate-900 text-white' : 'bg-[#2DD4BF] text-white'}`}
          >
            {showToolbar ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </motion.button>

          <AnimatePresence>
            {showToolbar && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="absolute left-0 top-18 flex flex-col items-center gap-3 bg-white/90 backdrop-blur-xl p-3 rounded-[2rem] shadow-2xl border border-slate-100"
              >
                {[
                  { icon: <ImageIcon className="w-5 h-5" />, type: 'image', label: 'Tải ảnh lên' },
                  { icon: <Globe className="w-5 h-5" />, type: 'link_image', label: 'Link ảnh' },
                  { icon: <LayoutList className="w-5 h-5" />, type: 'album', label: 'Album' },
                  { icon: <Video className="w-5 h-5" />, type: 'video', label: 'Video' },
                  { icon: <Camera className="w-5 h-5" />, type: 'instagram', label: 'Insta' },
                ].map((item) => (
                  <motion.button
                    key={item.type}
                    whileHover={{ scale: 1.2, x: 5 }}
                    onClick={() => onToolClick(item.type)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeInput === item.type ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-teal-500 hover:bg-teal-50'}`}
                    title={item.label}
                  >
                    {item.icon}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1">
          {/* Active Input Panel (Instagram style) */}
          <AnimatePresence>
            {activeInput !== 'none' && activeInput !== 'image' && (
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="mb-8"
              >
                <form onSubmit={handleInputSubmit} className="relative">
                  <div className="absolute -top-3 left-6 bg-teal-500 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg shadow-teal-500/20">
                    {activeInput === 'instagram' ? 'Hình ảnh từ Instagram' : `Nhập URL ${activeInput}`}
                  </div>
                  <div className="flex items-center gap-4 bg-white border-2 border-slate-100 rounded-[2rem] p-3 pr-6 shadow-xl shadow-slate-200/50">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center text-slate-400">
                      <Camera className="w-6 h-6 opacity-40" />
                    </div>
                    <input 
                      autoFocus
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Dán đường dẫn (https://...) và nhấn Enter"
                      className="flex-1 bg-transparent outline-none text-base font-bold text-slate-700 placeholder-slate-200"
                    />
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`transition-all duration-500 ${showToolbar ? 'opacity-20 blur-[2px] pointer-events-none scale-[0.98]' : 'opacity-100 blur-0 scale-100'}`}>
            <EditorContent 
              editor={editor} 
              className="prose prose-xl prose-slate max-w-none w-full outline-none tiptap-editor-wrapper font-medium leading-[1.8] text-slate-600" 
            />
          </div>
        </div>
      </div>
      
      <div className="mt-20 border-t-2 border-dashed border-slate-100 pt-10 text-center">
        <button className="bg-slate-50 text-slate-400 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-pastel-orange hover:text-white transition-all inline-flex items-center gap-3 group">
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> 
          Tạo album ảnh kỷ niệm cuối bài bài viết
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .tiptap-editor-wrapper .ProseMirror { 
          outline: none;
          min-height: 400px; 
        }
        .tiptap-editor-wrapper .ProseMirror p.is-editor-empty:first-child::before { 
          content: attr(data-placeholder);
          float: left;
          color: #e2e8f0;
          pointer-events: none;
          height: 0;
          font-style: normal;
          font-weight: 900;
          letter-spacing: -0.02em;
        }
        .tiptap-editor-wrapper img { 
          border-radius: 2.5rem;
          max-width: 100%;
          height: auto;
          margin: 3rem 0;
          box-shadow: 0 30px 60px -15px rgba(0,0,0,0.15);
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tiptap-editor-wrapper img:hover {
          transform: scale(1.02);
        }
        .tiptap-editor-wrapper h2 {
          font-weight: 900;
          font-size: 2.5rem;
          margin-top: 4rem;
          margin-bottom: 1.5rem;
          color: #0f172a;
          letter-spacing: -0.05em;
        }
        .tiptap-editor-wrapper p {
          margin-bottom: 1.5rem;
        }
      `}} />
    </div>
  );
};

export default TiptapEditor;
