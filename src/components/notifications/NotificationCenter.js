// src/components/notifications/NotificationCenter.js
import React, { useContext, useState } from 'react';
import { ExpenseContext } from '../../context/ExpenseContext';
import './Notifications.css';

const NotificationCenter = () => {
  const { alerts, markAlertAsRead } = useContext(ExpenseContext);
  const [isOpen, setIsOpen] = useState(false);
  
  // Make sure alerts is always an array, even if it's undefined or null
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const unreadAlerts = safeAlerts.filter(alert => !alert.read);
  
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  // Handle clicking outside to close dropdown
  const handleOutsideClick = (e) => {
    if (isOpen && !e.target.closest('.notification-center')) {
      setIsOpen(false);
    }
  };

  // Add event listener when component mounts
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="notification-center">
      <button 
        className={`notification-toggle ${unreadAlerts.length > 0 ? 'has-alerts' : ''}`}
        onClick={toggleNotifications}
        aria-label="Notifications"
      >
        <i className="notification-icon">🔔</i>
        {unreadAlerts.length > 0 && (
          <span className="notification-badge">{unreadAlerts.length}</span>
        )}
      </button>
      
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadAlerts.length > 0 && (
              <button 
                className="dismiss-all-btn"
                onClick={() => {
                  unreadAlerts.forEach(alert => markAlertAsRead(alert.id));
                  setIsOpen(false);
                }}
              >
                Dismiss All
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {unreadAlerts.length > 0 ? (
              <ul>
                {unreadAlerts.map(alert => (
                  <li key={alert.id} className="notification-item unread">
                    <div className="notification-content">
                      <p className="notification-message">{alert.message}</p>
                      <span className="notification-date">
                        {new Date(alert.date).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      className="dismiss-btn"
                      onClick={() => markAlertAsRead(alert.id)}
                    >
                      Dismiss
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-notifications">
                No new notifications
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;