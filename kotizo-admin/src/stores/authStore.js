import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('admin_user') || 'null'),
  token: localStorage.getItem('admin_token') || null,
  isAuthenticated: !!localStorage.getItem('admin_token'),

  login: async (email, password) => {
    const res = await api.post('/auth/connexion/', { email, password });
    const { access, refresh, user } = res.data;
    if (!user.is_staff) throw new Error('Acces refuse. Compte admin requis.');
    localStorage.setItem('admin_token', access);
    localStorage.setItem('admin_refresh', refresh);
    localStorage.setItem('admin_user', JSON.stringify(user));
    set({ user, token: access, isAuthenticated: true });
    return user;
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh');
    localStorage.removeItem('admin_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export default useAuthStore;