// Improved IncomeForm.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExpenseContext } from '../context/ExpenseContext';
import './IncomeForm.css';

const IncomeForm = () => {
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: ''
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addIncome, incomeCategories } = useContext(ExpenseContext);
  const navigate = useNavigate();
  
  // Make sure we have valid category options
  const safeCategories = Array.isArray(incomeCategories) ? incomeCategories : [];
  
  // Reset form error when user makes changes
  useEffect(() => {
    if (error) setError('');
  }, [formData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Validate form
      if (!formData.source) {
        setError('Please select a source');
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid amount greater than zero');
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.date) {
        setError('Please select a date');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Submitting income data:', formData);
      
      // Prepare data for submission
      const incomeData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      
      // Try to add the income
      const result = await addIncome(incomeData);
      console.log('Income add result:', result);
      
      if (result) {
        // Success - navigate to history
        navigate('/history');
      } else {
        setError('Failed to add income. Please try again.');
      }
    } catch (error) {
      console.error('Error adding income:', error);
      setError(`Failed to add income: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="income-form-container">
      <h1>Add New Income</h1>
      
      {error && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          backgroundColor: '#ffe8e8', 
          color: '#d32f2f',
          borderRadius: '4px' 
        }}>
          {error}
        </div>
      )}
      
      <form className="income-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="source">Source*</label>
          <select
            id="source"
            name="source"
            value={formData.source}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          >
            <option value="">Select a source</option>
            {safeCategories.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-btn" 
            onClick={() => navigate('/history')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Income'}
          </button>
        </div>
      </form>
      
      {/* Debug info - Remove in production */}
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <details>
          <summary>Debug Info</summary>
          <pre>
            {JSON.stringify({
              formData,
              categories: safeCategories,
              isSubmitting
            }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default IncomeForm;