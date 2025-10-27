import React from 'react';
import { useUIStore } from '../../stores';
import './Notifications.scss';

const Notifications = () => {
  const notifications = useUIStore((state) => state.notifications);
  const removeNotification = useUIStore((state) => state.removeNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="notifications-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
        >
          <div className="notification-icon">
            {notification.type === 'success' && '✅'}
            {notification.type === 'error' && '❌'}
            {notification.type === 'warning' && '⚠️'}
            {notification.type === 'info' && 'ℹ️'}
          </div>
          <div className="notification-message">{notification.message}</div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="notification-close"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications;

