// src/components/split/SplitExpenseDetails.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SplitExpenseContext } from '../../context/SplitExpenseContext';
import { AuthContext } from '../../context/AuthContext';
import { getSplitSummary } from '../../models/SplitExpenseModel';
import './SplitExpense.css';

const ensureStringId = (id) => {
  if (id === null || id === undefined) return null;
  return String(id);
};

const SplitExpenseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const { 
    getSplitExpense, 
    updatePaymentStatus, 
    deleteSplitExpense,
    sendPaymentReminder,
    emailStatus
  } = useContext(SplitExpenseContext);
  
  const [splitExpense, setSplitExpense] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Load split expense details
  useEffect(() => {
    if (!id) {
      setError('Invalid split expense ID');
      setLoading(false);
      return;
    }
    
    try {
      // Convert to string for consistent ID handling
      const stringId = String(id);
      const expense = getSplitExpense(stringId);
      console.log(`Loading split expense with ID ${stringId}:`, expense);
      
      if (expense) {
        // Verify data integrity before proceeding
        if (!expense.participants || !Array.isArray(expense.participants)) {
          console.error('Split expense has invalid participants data:', expense);
          setSplitExpense({
            ...expense,
            participants: [] // Ensure participants is at least an empty array
          });
          setError('This split expense has incomplete data');
        } else {
          setSplitExpense(expense);
        }
        
        try {
          const summaryData = getSplitSummary(expense);
          setSummary(summaryData);
        } catch (summaryError) {
          console.error('Error calculating split summary:', summaryError);
          setSummary(null);
        }
      } else {
        setError('Split expense not found');
      }
    } catch (err) {
      console.error('Error loading split expense:', err);
      setError('Error loading split expense details');
    } finally {
      setLoading(false);
    }
  }, [id, getSplitExpense]);
  
  // Update local state when expense details change
  useEffect(() => {
    if (id) {
      try {
        const stringId = String(id);
        const expense = getSplitExpense(stringId);
        if (expense) {
          setSplitExpense(expense);
          try {
            setSummary(getSplitSummary(expense));
          } catch (summaryError) {
            console.error('Error updating split summary:', summaryError);
          }
        }
      } catch (err) {
        console.error('Error updating split expense view:', err);
      }
    }
  }, [id, getSplitExpense, emailStatus]);
  
  // Handle marking a participant as paid
  const handleMarkAsPaid = async (participantId) => {
    if (!id) {
      setError('Invalid split expense ID');
      return;
    }
    
    if (!participantId) {
      setError('Invalid participant ID');
      return;
    }
    
    try {
      setLoading(true);
      
      // Use the helper function to ensure string IDs
      const stringExpenseId = ensureStringId(id);
      const stringParticipantId = ensureStringId(participantId);
      
      console.log(`Marking participant ${stringParticipantId} as paid in expense ${stringExpenseId}`);
      
      // Call the context function with string IDs
      const result = await updatePaymentStatus(
        stringExpenseId,
        stringParticipantId,
        'paid',
        'manual'
      );
      
      if (result) {
        console.log('Successfully marked participant as paid');
        // Clear any previous error
        setError('');
        
        // Refresh data by getting the latest version from context
        const updatedExpense = getSplitExpense(stringExpenseId);
        if (updatedExpense) {
          setSplitExpense(updatedExpense);
          try {
            const updatedSummary = getSplitSummary(updatedExpense);
            setSummary(updatedSummary);
          } catch (summaryError) {
            console.error('Error calculating updated summary:', summaryError);
          }
        }
      } else {
        console.error('Failed to update payment status');
        setError('Failed to update payment status. Please try again.');
      }
    } catch (err) {
      console.error('Error marking participant as paid:', err);
      setError(`An error occurred: ${err.message || 'Please try again'}`);
    } finally {
      // Always reset loading state
      setLoading(false);
    }
  };
  
  // Handle deleting the split expense
  const handleDelete = async () => {
    if (!id) {
      setError('Invalid split expense ID');
      return;
    }
    
    // Confirm before deleting
    if (window.confirm('Are you sure you want to delete this split expense?')) {
      try {
        // Convert to string for consistent ID handling
        const stringId = String(id);
        console.log(`Deleting split expense with ID ${stringId}`);
        
        const result = await deleteSplitExpense(stringId);
        
        if (result) {
          navigate('/split');
        } else {
          setError('Failed to delete split expense');
        }
      } catch (err) {
        console.error('Error deleting split expense:', err);
        setError('An error occurred while deleting the split expense');
      }
    }
  };
  
  // Handle sending a payment reminder
  const handleSendReminder = async (participantId) => {
    if (!id || !participantId) {
      setError('Invalid parameters for sending reminder');
      return;
    }
    
    try {
      // Convert IDs to strings for consistent comparison
      const stringExpenseId = String(id);
      const stringParticipantId = String(participantId);
      
      console.log(`Sending payment reminder to participant ${stringParticipantId}`);
      
      await sendPaymentReminder(stringExpenseId, stringParticipantId);
    } catch (err) {
      console.error('Error sending payment reminder:', err);
      setError('An error occurred while sending the payment reminder');
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    const parsedAmount = parseFloat(amount);
    return isNaN(parsedAmount) ? '$0.00' : `$${parsedAmount.toFixed(2)}`;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString || 'N/A';
    }
  };
  
  // Loading state
  if (loading) {
    return <div className="loading">Loading split expense details...</div>;
  }
  
  // Error state
  if (error) {
    return (
      <div className="split-expense-details-container">
        <div className="error-message">{error}</div>
        <button
          className="back-button"
          onClick={() => navigate('/split')}
        >
          Back to Split Expenses
        </button>
      </div>
    );
  }
  
  // Not found state
  if (!splitExpense) {
    return (
      <div className="split-expense-details-container">
        <div className="error-message">Split expense not found</div>
        <button
          className="back-button"
          onClick={() => navigate('/split')}
        >
          Back to Split Expenses
        </button>
      </div>
    );
  }
  
  return (
    <div className="split-expense-details-container">
      <div className="split-details-header">
        <h1>{splitExpense.description || 'Split Expense'}</h1>
        <div className="expense-meta">
          <span className="expense-category">{splitExpense.category || 'Uncategorized'}</span>
          <span className="expense-date">{formatDate(splitExpense.date)}</span>
        </div>
      </div>
      
      <div className="split-expense-card">
        <div className="split-expense-summary">
          <div className="summary-item">
            <div className="summary-label">Total Amount</div>
            <div className="summary-value">{formatCurrency(splitExpense.totalAmount)}</div>
          </div>
          
          <div className="summary-item">
            <div className="summary-label">Status</div>
            <div className={`summary-value status-${splitExpense.status || 'pending'}`}>
              {splitExpense.status === 'pending' ? 'Pending' : 
               splitExpense.status === 'partial' ? 'Partially Paid' : 'Settled'}
            </div>
          </div>
          
          {summary && (
            <>
              <div className="summary-item">
                <div className="summary-label">Paid Amount</div>
                <div className="summary-value">{formatCurrency(summary.paidAmount || 0)}</div>
              </div>
              
              <div className="summary-item">
                <div className="summary-label">Pending Amount</div>
                <div className="summary-value">{formatCurrency(summary.pendingAmount || 0)}</div>
              </div>
              
              <div className="summary-item">
                <div className="summary-label">Participants</div>
                <div className="summary-value">{summary.participantCount || 0}</div>
              </div>
            </>
          )}
        </div>
        
        {splitExpense.notes && (
          <div className="split-expense-notes">
            <h3>Notes</h3>
            <p>{splitExpense.notes}</p>
          </div>
        )}
      </div>
      
      <div className="split-participants-section">
        <h2>Participants</h2>
        <div className="participants-table">
          <div className="participants-header">
            <span>Name</span>
            <span>Email</span>
            <span>Share</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          
          {splitExpense.participants && Array.isArray(splitExpense.participants) ? (
            splitExpense.participants.map((participant) => (
              <div className="participant-row" key={participant.id || `part-${Math.random()}`}>
                <span className="participant-name">{participant.name || 'Unnamed'}</span>
                <span className="participant-email">{participant.email || '-'}</span>
                <span className="participant-share">{formatCurrency(participant.shareAmount || 0)}</span>
                <span className={`participant-status status-${participant.status || 'unpaid'}`}>
                  {participant.status === 'paid' ? 'Paid' : 'Unpaid'}
                  {participant.status === 'paid' && participant.paymentMethod && (
                    <span className="payment-method"> via {participant.paymentMethod}</span>
                  )}
                </span>
                <span className="participant-actions">
                  {participant.status !== 'paid' && (
                    <>
                      <button
                        className="mark-paid-btn"
                        onClick={() => handleMarkAsPaid(participant.id)}
                      >
                        Mark as Paid
                      </button>
                      
                      {participant.email && (
                        <button
                          className="send-reminder-btn"
                          onClick={() => handleSendReminder(participant.id)}
                          disabled={emailStatus[participant.id]?.sending}
                        >
                          {emailStatus[participant.id]?.sending
                            ? 'Sending...'
                            : 'Send Reminder'}
                        </button>
                      )}
                      
                      {/* Email status indicator */}
                      {emailStatus[participant.id] && (
                        <div className={`email-status ${emailStatus[participant.id].sent ? 'success' : 'error'}`}
                             title={emailStatus[participant.id].error}>
                          {emailStatus[participant.id].sent 
                            ? '✓ Email sent!' 
                            : `✗ ${emailStatus[participant.id].error ? 'Failed' : 'Error'}`}
                        </div>
                      )}
                    </>
                  )}
                </span>
              </div>
            ))
          ) : (
            <div className="participant-row">
              <span className="no-participants">No participant data available</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="split-expense-actions">
        <button
          className="back-button"
          onClick={() => navigate('/split')}
        >
          Back to Split Expenses
        </button>
        
        <button
          className="delete-button"
          onClick={handleDelete}
        >
          Delete Split Expense
        </button>
      </div>
    </div>
  );
};

export default SplitExpenseDetails;