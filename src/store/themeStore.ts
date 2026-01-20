import { create } from 'zustand';

export interface ThemeState {
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor: string;
    backgroundColor: string;
    accentColor: string;
    textColor: string;
    isAutoTheme: boolean;

    setTheme: (colors: Partial<Omit<ThemeState, 'setTheme' | 'toggleAutoTheme' | 'resetTheme'>>) => void;
    toggleAutoTheme: () => void;
    resetTheme: () => void;
}

const DEFAULT_THEME = {
    primaryColor: '#3b82f6', // blue-500
    secondaryColor: '#64748b', // slate-500
    tertiaryColor: '#94a3b8', // slate-400
    backgroundColor: '#ffffff', // white
    accentColor: '#f59e0b', // amber-500
    textColor: '#0f172a', // slate-900
};

export const useThemeStore = create<ThemeState>((set) => ({
    ...DEFAULT_THEME,
    isAutoTheme: true,

    setTheme: (colors) => set((state) => ({ ...state, ...colors })),

    toggleAutoTheme: () => set((state) => ({ isAutoTheme: !state.isAutoTheme })),

    resetTheme: () => set((state) => ({ ...DEFAULT_THEME, isAutoTheme: state.isAutoTheme })),
}));
