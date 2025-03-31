// src/components/notifications/AlertsProvider.js
import React, { useContext, useState, useEffect } from 'react';
import { ExpenseContext } from '../../context/ExpenseContext';
import BudgetAlertToast from './BudgetAlertToast';

const AlertsProvider = () => {
  const { alerts, markAlertAsRead } = useContext(ExpenseContext);
  const [visibleAlerts, setVisibleAlerts] = useState([]);
  
  // Handle new unread alerts
  useEffect(() => {
    const unreadAlerts = alerts.filter(alert => !alert.read);
    setVisibleAlerts(unreadAlerts);
  }, [alerts]);
  
  const handleDismiss = (id) => {
    markAlertAsRead(id);
    setVisibleAlerts(visibleAlerts.filter(alert => alert.id !== id));
  };
  
  if (visibleAlerts.length === 0) {
    return null;
  }
  
  // Show only the most recent alert as a toast
  const latestAlert = visibleAlerts[visibleAlerts.length - 1];
  
  return (
    <div className="alerts-container">
      <BudgetAlertToast 
        alert={latestAlert}
        onDismiss={handleDismiss}
      />
    </div>
  );
};

export default AlertsProvider;