import { create } from 'zustand';
import api from '../config/api';

let authCheckController = null;

const useAuthStore = create((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  _isCheckingAuth: false,
  
  login: (userData) => set({ user: userData, isLoggedIn: true, isLoading: false }),
  
  checkAuth: async () => {
    // Prevent multiple concurrent auth checks
    if (get()._isCheckingAuth) {
      return;
    }
    
    // Cancel any previous pending request
    if (authCheckController) {
      authCheckController.abort();
    }
    
    authCheckController = new AbortController();
    set({ _isCheckingAuth: true });
    
    try {
      const res = await api.get('/api/auth/me', {
        signal: authCheckController.signal
      });
      set({ 
        user: res.data, 
        isLoggedIn: true, 
        isLoading: false, 
        _isCheckingAuth: false 
      });
      authCheckController = null;
    } catch (error) {
      // If the request was cancelled, still end loading so the UI doesn't hang
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        set({ _isCheckingAuth: false, isLoading: false });
        authCheckController = null;
        return;
      }

      console.debug('Auth check failed:', error.response?.status || error.message);
      set({ 
        user: null, 
        isLoggedIn: false, 
        isLoading: false, 
        _isCheckingAuth: false 
      });
      authCheckController = null;
    }
  },
  
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
      set({ user: null, isLoggedIn: false });
    } catch (error) {
      console.error('Logout failed', error);
      // Clear state anyway
      set({ user: null, isLoggedIn: false });
    }
  },
}));

export default useAuthStore;

