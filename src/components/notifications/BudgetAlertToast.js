// src/components/notifications/BudgetAlertToast.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ExpenseContext } from '../../context/ExpenseContext';
import './Notifications.css';

const BudgetAlertToast = ({ alert, onDismiss }) => {
  const [isDismissing, setIsDismissing] = useState(false);
  const { currentUser } = useContext(AuthContext);
  const { emailStatus } = useContext(ExpenseContext);
  const navigate = useNavigate();
  
  const emailNotificationsEnabled = currentUser?.preferences?.emailNotifications !== false;
  
  // Auto-dismiss after 10 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleDismiss();
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss(alert.id);
    }, 300); // Match the CSS animation duration
  };
  
  const viewBudgets = () => {
    navigate('/budget');
    handleDismiss();
  };
  
  const renderEmailStatus = () => {
    if (!emailNotificationsEnabled) return null;
    
    if (emailStatus.error) {
      return (
        <p className="email-notification-message email-error">
          ⚠️ Failed to send email notification: {emailStatus.error}
        </p>
      );
    }
    
    if (emailStatus.sent) {
      return (
        <p className="email-notification-message email-success">
          ✉️ An email notification has been sent to {currentUser.email}
        </p>
      );
    }
    
    return (
      <p className="email-notification-message">
        ✉️ Sending email notification to {currentUser.email}...
      </p>
    );
  };
  
  return (
    <div className={`budget-alert-toast ${isDismissing ? 'dismissing' : ''}`}>
      <button className="alert-toast-close" onClick={handleDismiss}>×</button>
      <h4 className="alert-toast-title">
        <i>⚠️</i> Budget Alert
      </h4>
      <p className="alert-toast-message">{alert.message}</p>
      
      {emailNotificationsEnabled && renderEmailStatus()}
      
      <div className="alert-toast-actions">
        <button className="alert-toast-btn view-btn" onClick={viewBudgets}>
          View Budgets
        </button>
        <button className="alert-toast-btn dismiss-btn" onClick={handleDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default BudgetAlertToast;