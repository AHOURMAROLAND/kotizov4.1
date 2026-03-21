import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = await AsyncStorage.getItem('refresh_token');
        if (!refresh) {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
          return Promise.reject(error);
        }
        const res = await axios.post(
          `${API_BASE_URL}/auth/token/refresh/`,
          { refresh },
          { headers: { 'Content-Type': 'application/json' } }
        );
        const newAccess = res.data.access;
        const newRefresh = res.data.refresh;
        await AsyncStorage.setItem('access_token', newAccess);
        if (newRefresh) await AsyncStorage.setItem('refresh_token', newRefresh);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      }
    }
    return Promise.reject(error);
  }
);

export default api;