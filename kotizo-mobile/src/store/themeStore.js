import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors } from '../constants/colors';

const useThemeStore = create((set) => ({
  isDark: true,
  colors: darkColors,

  init: async () => {
    try {
      const saved = await AsyncStorage.getItem('theme');
      const isDark = saved !== 'light';
      set({ isDark, colors: isDark ? darkColors : lightColors });
    } catch {}
  },

  toggle: async () => {
    const store = useThemeStore.getState();
    const newIsDark = !store.isDark;
    await AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    set({ isDark: newIsDark, colors: newIsDark ? darkColors : lightColors });
  },
}));

export default useThemeStore;