// src/components/notifications/EmailNotificationStatus.js
import React, { useState, useEffect } from 'react';
import './EmailNotificationStatus.css';

const EmailNotificationStatus = ({ emailSent = false, error = null }) => {
  const [visible, setVisible] = useState(!!emailSent || !!error);
  
  useEffect(() => {
    if (emailSent || error) {
      setVisible(true);
      
      // Auto-hide after 5 seconds
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [emailSent, error]);
  
  if (!visible) return null;
  
  return (
    <div className={`email-notification ${error ? 'error' : 'success'}`}>
      <div className="email-icon">
        {error ? '✕' : '✓'}
      </div>
      <div className="email-message">
        {error 
          ? <>Error sending budget alert email: {error}</>
          : <>Budget alert email sent successfully!</>
        }
      </div>
      <button 
        className="email-close-btn"
        onClick={() => setVisible(false)}
      >
        ×
      </button>
    </div>
  );
};

export default EmailNotificationStatus;