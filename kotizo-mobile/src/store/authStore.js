import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { ENDPOINTS } from '../constants/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        set({ user: JSON.parse(userStr), isAuthenticated: true });
      }
    } catch {}
    set({ isLoading: false });
  },

  connexion: async (email, password) => {
    const res = await api.post(ENDPOINTS.connexion, { email, password });
    const { access, refresh, user } = res.data;
    await AsyncStorage.setItem('access_token', access);
    await AsyncStorage.setItem('refresh_token', refresh);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
    return user;
  },

  deconnexion: async () => {
    try {
      const refresh = await AsyncStorage.getItem('refresh_token');
      await api.post(ENDPOINTS.deconnexion, { refresh });
    } catch {}
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
    set({ user: null, isAuthenticated: false });
  },

  updateUser: async () => {
    try {
      const res = await api.get(ENDPOINTS.moi);
      await AsyncStorage.setItem('user', JSON.stringify(res.data));
      set({ user: res.data });
    } catch {}
  },
}));

export default useAuthStore;