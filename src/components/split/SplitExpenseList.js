// src/components/split/SplitExpenseList.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { SplitExpenseContext } from '../../context/SplitExpenseContext';
import { getSplitSummary } from '../../models/SplitExpenseModel';
import './SplitExpense.css';

const SplitExpenseList = () => {
  const { getAllSplitExpenses, loading: contextLoading } = useContext(SplitExpenseContext);
  
  const [splitExpenses, setSplitExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, settled
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load split expenses with error handling
  useEffect(() => {
    try {
      const expenses = getAllSplitExpenses();
      console.log(`Loaded ${expenses.length} split expenses`);
      
      // Add summary data to each expense for filtering and display
      const expensesWithSummary = expenses.map(expense => {
        try {
          return {
            ...expense,
            summary: getSplitSummary(expense)
          };
        } catch (err) {
          console.error('Error calculating summary for expense:', err, expense);
          return {
            ...expense,
            summary: {
              paidAmount: 0,
              pendingAmount: expense.totalAmount || 0,
              participantCount: expense.participants?.length || 0,
              paidCount: 0
            }
          };
        }
      });
      
      setSplitExpenses(expensesWithSummary);
    } catch (err) {
      console.error('Error loading split expenses:', err);
      setSplitExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [getAllSplitExpenses]);
  
  // Filter split expenses with improved error handling
  const filteredExpenses = splitExpenses
    .filter(expense => {
      // Filter by status
      if (filter === 'pending') {
        return expense.status === 'pending' || expense.status === 'partial';
      } else if (filter === 'settled') {
        return expense.status === 'settled';
      }
      return true;
    })
    .filter(expense => {
      // Filter by search query (with null checks)
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        (expense.description && expense.description.toLowerCase().includes(query)) ||
        (expense.category && expense.category.toLowerCase().includes(query)) ||
        (expense.participants && Array.isArray(expense.participants) && expense.participants.some(p => 
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.email && p.email.toLowerCase().includes(query))
        ))
      );
    })
    .sort((a, b) => {
      // Sort by date (newest first) with proper error handling
      try {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      } catch (err) {
        console.error('Error sorting expenses by date:', err);
        return 0; // Keep original order if date comparison fails
      }
    });
  
  // Format currency with validation
  const formatCurrency = (amount) => {
    const parsedAmount = parseFloat(amount);
    return isNaN(parsedAmount) ? '$0.00' : `$${parsedAmount.toFixed(2)}`;
  };
  
  // Format date with validation
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
      return dateString || 'N/A';
    }
  };
  
  // Calculate progress percentage safely
  const calculateProgress = (expense) => {
    if (!expense.summary) return 0;
    
    const { paidAmount, totalAmount } = expense.summary;
    if (!totalAmount || totalAmount === 0) return 0;
    
    return Math.min(100, (paidAmount / expense.totalAmount) * 100);
  };
  
  // Loading state
  if (loading || contextLoading) {
    return <div className="loading">Loading split expenses...</div>;
  }
  
  return (
    <div className="split-expense-list-container">
      <div className="split-expense-header">
        <h1>Split Expenses</h1>
        <Link to="/split/new" className="create-split-btn">
          Create New Split
        </Link>
      </div>
      
      <div className="split-expense-filters">
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={filter === 'settled' ? 'active' : ''}
            onClick={() => setFilter('settled')}
          >
            Settled
          </button>
        </div>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="Search split expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {filteredExpenses.length === 0 ? (
        <div className="no-splits-message">
          <p>
            {searchQuery || filter !== 'all' 
              ? 'No split expenses found matching your criteria.' 
              : 'No split expenses found.'}
          </p>
          <Link to="/split/new" className="create-split-btn">
            Create your first split expense
          </Link>
        </div>
      ) : (
        <div className="split-expenses-grid">
          {filteredExpenses.map(expense => (
            <Link 
              to={`/split/details/${expense.id}`} 
              className="split-expense-card" 
              key={expense.id}
            >
              <div className="split-card-header">
                <h3 className="split-title">{expense.description || 'Unnamed Split'}</h3>
                <span className={`split-status status-${expense.status || 'pending'}`}>
                  {expense.status === 'pending' ? 'Pending' : 
                   expense.status === 'partial' ? 'Partially Paid' : 'Settled'}
                </span>
              </div>
              
              <div className="split-card-meta">
                <div className="split-category">{expense.category || 'Uncategorized'}</div>
                <div className="split-date">{formatDate(expense.date)}</div>
              </div>
              
              <div className="split-card-amount">
                <div className="total-amount">{formatCurrency(expense.totalAmount)}</div>
              </div>
              
              <div className="split-card-participants">
                <div className="participants-count">
                  {expense.participants?.length || 0} {expense.participants?.length === 1 ? 'person' : 'people'}
                </div>
                
                {expense.summary && (
                  <div className="payment-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${calculateProgress(expense)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="progress-text">
                      {expense.summary.paidCount} of {expense.summary.participantCount} paid
                    </div>
                  </div>
                )}
                
                <div className="participant-avatars">
                  {expense.participants && expense.participants.slice(0, 3).map((participant, index) => (
                    <div
                      key={participant.id || index}
                      className={`participant-avatar ${participant.status === 'paid' ? 'paid' : ''}`}
                      title={participant.name || 'Participant'}
                    >
                      {(participant.name || '?').charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {expense.participants && expense.participants.length > 3 && (
                    <div className="participant-avatar more">
                      +{expense.participants.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SplitExpenseList;