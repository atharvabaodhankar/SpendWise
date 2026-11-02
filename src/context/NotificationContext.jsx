import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import Notification from '../components/Notification';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((type, message, options = {}) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      message,
      ...options
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showSuccess = useCallback((message, options) => addNotification('success', message, options), [addNotification]);
  const showError = useCallback((message, options) => addNotification('error', message, options), [addNotification]);
  const showWarning = useCallback((message, options) => addNotification('warning', message, options), [addNotification]);
  const showInfo = useCallback((message, options) => addNotification('info', message, options), [addNotification]);

  const value = useMemo(() => ({
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification
  }), [showSuccess, showError, showWarning, showInfo, removeNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map(notification => (
          <div key={notification.id} className="pointer-events-auto">
            <Notification
              type={notification.type}
              message={notification.message}
              onClose={() => removeNotification(notification.id)}
              autoClose={notification.autoClose !== false}
              duration={notification.duration || 5000}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
