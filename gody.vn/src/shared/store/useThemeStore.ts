import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const applyTheme = (theme: 'light' | 'dark') => {
  const root = window.document.documentElement;
  console.log('[Theme] Applying:', theme);
  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light', // Default initial state
      
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          applyTheme(newTheme);
          return { theme: newTheme };
        });
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // This runs when the store is loaded from localStorage
        return (hydratedState: ThemeState | undefined, error: unknown) => {
          if (!error && hydratedState) {
            console.log('[Theme] Hydrated:', hydratedState.theme);
            applyTheme(hydratedState.theme);
          } else {
            // Default to system preference if no saved theme
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            applyTheme(systemTheme);
          }
        };
      }
    }
  )
);
