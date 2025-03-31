import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExpenseContext } from '../context/ExpenseContext';
import { AuthContext } from '../context/AuthContext'; // Added AuthContext import
import './ExpenseForm.css';

const ExpenseForm = () => {
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: ''
  });
  
  const [errorMessage, setErrorMessage] = useState(''); // Added state for error messages
  const [isSubmitting, setIsSubmitting] = useState(false); // Added loading state
  
  const { addExpense, expenseCategories } = useContext(ExpenseContext);
  const { currentUser } = useContext(AuthContext); // Added to check authentication status
  const navigate = useNavigate();
  
  // Check if user is authenticated
  useEffect(() => {
    console.log("Auth state in ExpenseForm:", { isLoggedIn: !!currentUser, user: currentUser });
    
    if (!currentUser) {
      console.warn("User not authenticated, expense actions will fail");
    }
  }, [currentUser]);
  
  // Check if expense categories are loaded
  useEffect(() => {
    console.log("Available expense categories:", expenseCategories);
  }, [expenseCategories]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Check authentication first
    if (!currentUser) {
      setErrorMessage('You must be logged in to add expenses');
      return;
    }
    
    // Validate form
    if (!formData.category) {
      setErrorMessage('Please select a category');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrorMessage('Please enter a valid amount greater than zero');
      return;
    }
    
    if (!formData.date) {
      setErrorMessage('Please select a date');
      return;
    }
    
    try {
      console.log("Submitting expense data:", formData);
      setIsSubmitting(true);
      
      // Format data properly before submission
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount), // Ensure amount is a number
        date: formData.date,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      };
      
      const result = await addExpense(expenseData);
      console.log("Result from addExpense:", result);
      
      if (result) {
        console.log("Expense added successfully with ID:", result);
        navigate('/');
      } else {
        setErrorMessage('Failed to add expense. Please try again.');
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      setErrorMessage(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="expense-form-container">
      <h1>Add New Expense</h1>
      
      {errorMessage && (
        <div style={{ 
          backgroundColor: '#fff2f0', 
          color: '#ff4d4f', 
          padding: '12px', 
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {errorMessage}
        </div>
      )}
      
      <form className="expense-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="category">Category*</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            {Array.isArray(expenseCategories) && expenseCategories.length > 0 ? (
              expenseCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))
            ) : (
              <option value="Other">Other</option>
            )}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="amount">Amount*</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            placeholder="0.00"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="date">Date*</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional description"
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn" 
            onClick={() => navigate('/')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Expense'}
          </button>
        </div>
      </form>
      
      {/* Dev debug info - remove in production */}
      {process.env.NODE_ENV !== 'production' && (
        <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', fontSize: '12px' }}>
          <details>
            <summary>Debug Info</summary>
            <pre>
              Auth state: {JSON.stringify({ isLoggedIn: !!currentUser, uid: currentUser?.uid }, null, 2)}
              Form data: {JSON.stringify(formData, null, 2)}
              Categories: {JSON.stringify(expenseCategories, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default ExpenseForm;