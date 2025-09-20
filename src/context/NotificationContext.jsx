import { createContext, useContext, useState } from 'react';
import Notification from '../components/Notification';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, message, options = {}) => {
    const id = Date.now();
    const notification = {
      id,
      type,
      message,
      ...options
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (message, options) => addNotification('success', message, options);
  const showError = (message, options) => addNotification('error', message, options);
  const showWarning = (message, options) => addNotification('warning', message, options);
  const showInfo = (message, options) => addNotification('info', message, options);

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            type={notification.type}
            message={notification.message}
            onClose={() => removeNotification(notification.id)}
            autoClose={notification.autoClose !== false}
            duration={notification.duration || 5000}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}