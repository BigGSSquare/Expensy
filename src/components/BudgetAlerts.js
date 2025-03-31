import React, { useContext } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import { AuthContext } from '../context/AuthContext';
import './BudgetAlerts.css';

const BudgetAlerts = () => {
  const { alerts, markAlertAsRead } = useContext(ExpenseContext);
  const { currentUser } = useContext(AuthContext);
  
  // Ensure alerts is always an array
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  
  // Filter alerts to show only unread ones
  // and ensure they belong to the current user
  const unreadAlerts = safeAlerts.filter(alert => 
    !alert.read && alert.userId === currentUser?.id
  );
  
  // Handle dismissing alerts safely
  const handleDismiss = (id) => {
    if (id && typeof markAlertAsRead === 'function') {
      markAlertAsRead(id);
    }
  };
  
  // Don't render anything if there are no unread alerts
  if (unreadAlerts.length === 0) {
    return null;
  }
  
  return (
    <div className="budget-alerts">
      <h3>Budget Alerts</h3>
      <ul className="alerts-list">
        {unreadAlerts.map(alert => (
          <li key={alert.id} className="alert-item">
            <div className="alert-content">
              <span className="alert-message">{alert.message}</span>
              <span className="alert-date">
                {new Date(alert.date).toLocaleDateString()}
              </span>
            </div>
            <button 
              className="dismiss-btn"
              onClick={() => handleDismiss(alert.id)}
              aria-label="Dismiss alert"
            >
              Dismiss
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BudgetAlerts;