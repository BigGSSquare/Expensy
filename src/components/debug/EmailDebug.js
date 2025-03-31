// src/components/debug/EmailDebug.js
import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { sendBudgetAlertEmail } from '../../services/EmailService';

const EmailDebug = () => {
  const { currentUser } = useContext(AuthContext);
  
  const checkUserInfo = () => {
    console.log("Current user:", currentUser);
    alert(`Current user email: ${currentUser?.email || 'No email found!'}`);
  };
  
  const testSendEmail = async () => {
    if (!currentUser || !currentUser.email) {
      alert("No user email found! Cannot send test email.");
      return;
    }
    
    try {
      const result = await sendBudgetAlertEmail(
        currentUser,
        "Test Category",
        100,
        150
      );
      
      if (result.success) {
        alert(`Test email sent successfully to ${currentUser.email}`);
      } else {
        alert(`Failed to send test email: ${result.message}`);
      }
    } catch (error) {
      alert(`Error sending test email: ${error.message}`);
    }
  };
  
  return (
    <div style={{
      margin: '20px',
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Email Debugging</h3>
      <p>Use this panel to test email functionality</p>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Current User Email:</strong> {currentUser?.email || 'Not logged in or no email found'}
      </div>
      
      <button
        onClick={checkUserInfo}
        style={{
          backgroundColor: '#3f51b5',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        Check User Info
      </button>
      
      <button
        onClick={testSendEmail}
        style={{
          backgroundColor: '#4caf50',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Send Test Email
      </button>
    </div>
  );
};

export default EmailDebug;