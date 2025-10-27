import { create } from 'zustand';

/**
 * UI Store - Manages UI state and user preferences
 * 
 * Handles:
 * - View modes
 * - Sidebar state
 * - Theme preferences
 * - Notifications
 */
const useUIStore = create((set, get) => ({
  // State
  viewMode: 'split', // 'split', 'image', 'data'
  sidebarOpen: true,
  theme: 'dark',
  notifications: [],

  // Actions

  /**
   * Set view mode
   * @param {string} mode - 'split', 'image', or 'data'
   */
  setViewMode: (mode) => {
    if (['split', 'image', 'data'].includes(mode)) {
      set({ viewMode: mode });
    }
  },

  /**
   * Toggle sidebar
   */
  toggleSidebar: () => {
    set(state => ({ sidebarOpen: !state.sidebarOpen }));
  },

  /**
   * Toggle theme
   */
  toggleTheme: () => {
    set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }));
  },

  /**
   * Add notification
   * @param {object} notification - Notification data
   */
  addNotification: (notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      type: 'info', // 'info', 'success', 'warning', 'error'
      message: '',
      duration: 5000,
      ...notification
    };

    set(state => ({
      notifications: [...state.notifications, newNotification]
    }));

    // Auto-remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  /**
   * Remove notification
   * @param {number} id - Notification ID
   */
  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  /**
   * Clear all notifications
   */
  clearNotifications: () => {
    set({ notifications: [] });
  },

  /**
   * Show success notification
   */
  showSuccess: (message) => {
    get().addNotification({ type: 'success', message });
  },

  /**
   * Show error notification
   */
  showError: (message) => {
    get().addNotification({ type: 'error', message, duration: 7000 });
  },

  /**
   * Show info notification
   */
  showInfo: (message) => {
    get().addNotification({ type: 'info', message });
  },

  /**
   * Show warning notification
   */
  showWarning: (message) => {
    get().addNotification({ type: 'warning', message });
  }
}));

export default useUIStore;

