// src/components/EmailTestComponent.js
import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { sendTestEmail } from '../services/EmailService';

const EmailTestComponent = () => {
  const { currentUser } = useContext(AuthContext);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailedLog, setDetailedLog] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  
  const sendEmail = async () => {
    if (!currentUser || !currentUser.email) {
      setStatus('Error: No user email found');
      return;
    }
    
    setLoading(true);
    setStatus('Sending test email...');
    setDetailedLog('');
    
    try {
      // Capture console.log output
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      
      let logs = [];
      
      console.log = (...args) => {
        originalConsoleLog(...args);
        logs.push(['log', ...args]);
      };
      
      console.error = (...args) => {
        originalConsoleError(...args);
        logs.push(['error', ...args]);
      };
      
      // Use the EmailService for sending
      const result = await sendTestEmail(currentUser);
      
      // Restore console functions
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      
      // Format logs for display
      const formattedLogs = logs.map(entry => {
        const [type, ...messages] = entry;
        const timestamp = new Date().toLocaleTimeString();
        
        // Try to format objects and arrays nicely
        const formattedMessages = messages.map(msg => {
          if (typeof msg === 'object' && msg !== null) {
            try {
              return JSON.stringify(msg, null, 2);
            } catch {
              return String(msg);
            }
          }
          return String(msg);
        }).join(' ');
        
        return `[${timestamp}] ${type === 'error' ? '❌' : '📧'} ${formattedMessages}`;
      }).join('\n');
      
      setDetailedLog(formattedLogs);
      
      if (result.success) {
        setStatus(`Success! Email sent to ${currentUser.email}`);
      } else {
        setStatus(`Error: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      setStatus(`Error: ${error.message || 'Unknown error'}`);
      setDetailedLog(`Exception: ${error.stack || error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ 
      margin: '20px',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9' 
    }}>
      <h3>Email Test Tool</h3>
      <p><strong>Current user:</strong> {currentUser ? currentUser.name || 'User' : 'Not logged in'}</p>
      <p><strong>Email address:</strong> {currentUser ? currentUser.email || 'No email found' : 'N/A'}</p>
      
      <button 
        onClick={sendEmail}
        disabled={!currentUser || loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3f51b5',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: currentUser && !loading ? 'pointer' : 'not-allowed',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Sending...' : 'Send Test Email'}
      </button>
      
      {status && (
        <div style={{ 
          marginTop: '15px',
          padding: '10px',
          backgroundColor: status.includes('Error') ? '#ffebee' : '#e8f5e9',
          borderRadius: '4px'
        }}>
          {status}
        </div>
      )}
      
      {detailedLog && (
        <div style={{ marginTop: '15px' }}>
          <button 
            onClick={() => setShowDetails(!showDetails)} 
            style={{
              border: 'none',
              background: 'none',
              color: '#3f51b5',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
          </button>
          
          {showDetails && (
            <pre style={{ 
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px',
              fontSize: '12px',
              whiteSpace: 'pre-wrap'
            }}>
              {detailedLog}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailTestComponent;