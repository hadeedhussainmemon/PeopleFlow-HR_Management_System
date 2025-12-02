import { create } from 'zustand';
import api from '../config/api';

const useAuthStore = create((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  login: (userData) => set({ user: userData, isLoggedIn: true }),
  checkAuth: async () => {
    try {
      const res = await api.get('/api/auth/me');
      set({ user: res.data, isLoggedIn: true, isLoading: false });
    } catch (error) {
      set({ user: null, isLoggedIn: false, isLoading: false });
    }
  },
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
      set({ user: null, isLoggedIn: false });
    } catch (error) {
      console.error('Logout failed', error);
    }
  },
}));

export default useAuthStore;

