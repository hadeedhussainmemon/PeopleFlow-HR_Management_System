import { create } from 'zustand';
import api from '../config/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  login: (userData) => set({ user: userData, isLoggedIn: true }),
  checkAuth: async () => {
    // Prevent multiple concurrent auth checks
    if (get()._isCheckingAuth) {
      return;
    }
    
    set({ _isCheckingAuth: true });
    
    try {
      const res = await api.get('/api/auth/me');
      set({ user: res.data, isLoggedIn: true, isLoading: false, _isCheckingAuth: false });
    } catch (error) {
      // Only log if it's not an aborted request
      if (error.code !== 'ERR_CANCELED') {
        console.debug('Auth check failed:', error.message);
      }
      set({ user: null, isLoggedIn: false, isLoading: false, _isCheckingAuth: false });
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

