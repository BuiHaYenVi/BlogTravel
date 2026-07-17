import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BlogMeta {
  startDate: string;
  endDate: string;
  cost: string;
  tags: string;
  provinceSlug: string;
  locationId: string;
}

interface BlogEditorState {
  title: string;
  description: string;
  coverImage: string | null;
  coverFile: File | null;
  content: string;
  meta: BlogMeta;
  // Multi-image support
  imageFiles: File[];
  imagePreviews: string[];
  updateField: (field: string, value: any) => void;
  updateMeta: (field: string, value: string) => void;
  clearDraft: () => void;
}

const initialMeta: BlogMeta = {
  startDate: '',
  endDate: '',
  cost: '',
  tags: '',
  provinceSlug: '',
  locationId: ''
};

export const useBlogEditor = create<BlogEditorState>()(
  persist(
    (set) => ({
      title: '',
      description: '',
      coverImage: null,
      coverFile: null,
      content: '',
      meta: initialMeta,
      imageFiles: [],
      imagePreviews: [],
      updateField: (field, value) => set((state) => ({ ...state, [field]: value })),
      updateMeta: (field, value) => set((state) => ({
        ...state,
        meta: { ...state.meta, [field]: value }
      })),
      clearDraft: () => set({
        title: '',
        description: '',
        coverImage: null,
        coverFile: null,
        content: '',
        meta: initialMeta,
        imageFiles: [],
        imagePreviews: []
      })
    }),
    {
      name: 'blog-draft-storage',
      partialize: (state) => ({
        title: state.title,
        description: state.description,
        coverImage: state.coverImage,
        content: state.content,
        meta: state.meta
        // Không persist coverFile, imageFiles, imagePreviews vì File/Blob không serialize được
      })
    }
  )
);
