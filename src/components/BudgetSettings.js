import React, { useContext, useState, useEffect } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import { AuthContext } from '../context/AuthContext';
import './BudgetSettings.css';

const BudgetSettings = () => {
  const { budgets, updateBudget, deleteBudget, expenses, expenseCategories } = useContext(ExpenseContext);
  const { currentUser, updateProfile } = useContext(AuthContext);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [categoryUsage, setCategoryUsage] = useState({});
  const [emailAlerts, setEmailAlerts] = useState(
    currentUser?.preferences?.emailNotifications !== false
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Make sure we have valid data
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeCategories = Array.isArray(expenseCategories) ? expenseCategories : [];
  const safeBudgets = budgets && typeof budgets === 'object' ? budgets : {};
  
  // Calculate current month's spending by category
  useEffect(() => {
    // Early return if dependencies are missing
    if (!safeExpenses || !safeCategories || !safeBudgets) return;
    
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const usage = {};
      
      safeCategories.forEach(category => {
        if (safeBudgets[category]) {
          try {
            const monthlyExpenses = safeExpenses.filter(expense => {
              if (!expense || !expense.date) return false;
              
              try {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === currentMonth && 
                      expenseDate.getFullYear() === currentYear &&
                      expense.category === category;
              } catch (e) {
                console.error('Invalid date format:', expense.date);
                return false;
              }
            });
            
            const totalSpent = monthlyExpenses.reduce((sum, expense) => {
              const amount = parseFloat(expense.amount);
              return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            
            const budget = parseFloat(safeBudgets[category]);
            
            if (!isNaN(budget)) {
              usage[category] = {
                spent: totalSpent,
                budget: budget,
                percentage: budget > 0 ? (totalSpent / budget) * 100 : 0,
                remaining: budget - totalSpent
              };
            }
          } catch (error) {
            console.error(`Error calculating usage for category ${category}:`, error);
          }
        }
      });
      
      setCategoryUsage(usage);
    } catch (error) {
      console.error('Error calculating category usage:', error);
      setCategoryUsage({});
    }
  }, [safeExpenses, safeBudgets, safeCategories]);
  
  // Handle email alerts preference change
  const handleEmailAlertsChange = (e) => {
    try {
      const isChecked = e.target.checked;
      setEmailAlerts(isChecked);
      
      // Update user preferences
      if (currentUser) {
        const preferences = {
          ...(currentUser.preferences || {}),
          emailNotifications: isChecked
        };
        
        updateProfile({ preferences });
      }
    } catch (error) {
      console.error('Error updating email preferences:', error);
      setError('Failed to update email preferences. Please try again.');
    }
  };
  
  // Handle form submission for adding new budget
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Validate form inputs
      if (!newCategory) {
        setError('Please select a category');
        return;
      }
      
      if (!newAmount) {
        setError('Please enter a budget amount');
        return;
      }
      
      const parsedAmount = parseFloat(newAmount);
      
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        setError('Please enter a valid positive number');
        return;
      }
      
      console.log(`Attempting to update budget for ${newCategory}: $${parsedAmount}`);
      
      // Update budget with await since it's async
      const result = await updateBudget(newCategory, parsedAmount);
      
      if (result) {
        setSuccess(`Budget for ${newCategory} set successfully!`);
        setNewCategory('');
        setNewAmount('');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError('Failed to set budget. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting budget:', error);
      setError(`An error occurred: ${error.message || 'Please try again.'}`);
    }
  };
  
  // Handle updating existing budget
  const handleUpdate = (category, amount) => {
    setError('');
    setSuccess('');
    
    try {
      const currentAmount = parseFloat(amount).toFixed(2);
      const newAmount = prompt(`Enter new budget for ${category}:`, currentAmount);
      
      if (newAmount === null) return; // User cancelled
      
      const parsedAmount = parseFloat(newAmount);
      
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        alert('Please enter a valid positive number');
        return;
      }
      
      // Update budget
      const result = updateBudget(category, parsedAmount);
      
      if (result) {
        setSuccess(`Budget for ${category} updated successfully!`);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError('Failed to update budget. Please try again.');
      }
    } catch (error) {
      console.error('Error updating budget:', error);
      setError('An error occurred. Please try again.');
    }
  };
  
  // Delete a budget
  const handleDelete = (category) => {
    setError('');
    setSuccess('');
    
    try {
      if (window.confirm(`Are you sure you want to delete the budget for ${category}?`)) {
        const result = deleteBudget(category);
        
        if (result) {
          setSuccess(`Budget for ${category} deleted successfully!`);
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccess('');
          }, 3000);
        } else {
          setError('Failed to delete budget. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error deleting budget:', error);
      setError('An error occurred. Please try again.');
    }
  };
  
  // Helper function to determine progress bar color
  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#ff4d4f'; // Red
    if (percentage >= 80) return '#faad14'; // Yellow/Amber
    return '#52c41a'; // Green
  };
  
  return (
    <div className="budget-settings">
      <h1>Budget Settings</h1>
      
      {/* Error and success messages */}
      {error && (
        <div className="error-message" style={{
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
          color: '#ff4d4f',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message" style={{
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f',
          color: '#52c41a',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {success}
        </div>
      )}
      
      <div className="notification-settings">
        <h2>Alert Settings</h2>
        <p>Configure how you want to be notified when you exceed your budget limits.</p>
        
        <div className="alert-options">
          <label className="email-alert-option">
            <input 
              type="checkbox" 
              checked={emailAlerts} 
              onChange={handleEmailAlertsChange} 
            />
            <div className="alert-option-info">
              <span className="alert-option-title">Email Alerts</span>
              <span className="alert-option-desc">Send an email notification when you exceed a budget</span>
            </div>
          </label>
        </div>
      </div>
      
      <div className="current-budgets">
        <h2>Current Budgets</h2>
        {Object.keys(safeBudgets).length > 0 ? (
          <table className="budgets-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Monthly Budget</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(safeBudgets).map(([category, amount]) => {
                const usage = categoryUsage[category] || { 
                  spent: 0, 
                  budget: parseFloat(amount) || 0, 
                  percentage: 0,
                  remaining: parseFloat(amount) || 0
                };
                
                return (
                  <tr key={category}>
                    <td>{category}</td>
                    <td>${parseFloat(amount).toFixed(2)}</td>
                    <td>${usage.spent.toFixed(2)}</td>
                    <td 
                      className={usage.remaining < 0 ? 'negative-balance' : ''}
                    >
                      ${Math.abs(usage.remaining).toFixed(2)}
                      {usage.remaining < 0 && ' over budget'}
                    </td>
                    <td>
                      <div className="progress-container">
                        <div 
                          className="progress-bar"
                          style={{ 
                            width: `${Math.min(usage.percentage || 0, 100)}%`, 
                            backgroundColor: getProgressColor(usage.percentage || 0) 
                          }}
                        ></div>
                        <span className="progress-text">{(usage.percentage || 0).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="edit-btn"
                          onClick={() => handleUpdate(category, amount)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn"
                          style={{ backgroundColor: '#ff4d4f', color: 'white' }}
                          onClick={() => handleDelete(category)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No budgets set yet. Add your first budget below.</p>
        )}
      </div>
      
      <div className="add-budget">
        <h2>Add New Budget</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {safeCategories
                  .filter(category => !safeBudgets[category])
                  .map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="amount">Monthly Budget</label>
              <input
                type="number"
                id="amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                min="1"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
            
            <button type="submit" className="add-btn">Add Budget</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetSettings;