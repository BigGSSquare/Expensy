// src/components/ReceiptScanner.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExpenseContext } from '../context/ExpenseContext';
import './ReceiptScanner.css';

const ReceiptScanner = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  
  const { scanReceipt, addExpenseFromReceipt, receiptScanStatus, expenseCategories } = useContext(ExpenseContext);
  const navigate = useNavigate();
  
  // Update form values when receipt data changes
  const [receiptData, setReceiptData] = useState({
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    category: 'Food',
    notes: ''
  });
  
  // Update local state when receiptScanStatus.data changes
  useEffect(() => {
    if (receiptScanStatus.data) {
      setReceiptData({
        amount: receiptScanStatus.data.amount || '',
        date: receiptScanStatus.data.date || new Date().toISOString().slice(0, 10),
        description: receiptScanStatus.data.description || '',
        category: receiptScanStatus.data.category || 'Food',
        notes: receiptScanStatus.data.notes || ''
      });
    }
  }, [receiptScanStatus.data]);
  
  const handleFileChange = (e) => {
    setError(''); // Clear any previous errors
    
    const file = e.target.files[0];
    if (file) {
      // Validate file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File is too large. Please select an image under 5MB.');
        return;
      }
      
      // Validate file type
      if (!file.type.match('image.*')) {
        setError('Please select an image file (JPEG, PNG).');
        return;
      }
      
      setSelectedFile(file);
      
      try {
        // Create a preview URL
        const fileUrl = URL.createObjectURL(file);
        setPreviewUrl(fileUrl);
        console.log("File selected:", file.name, file.type, file.size);
      } catch (error) {
        console.error("Error creating preview:", error);
        setError("Failed to preview the file");
      }
    }
  };
  
  const handleScan = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Call the scanReceipt function from context
      console.log('Starting receipt scan process with file:', selectedFile.name);
      const result = await scanReceipt(selectedFile);
      
      if (result && result.success) {
        // Scanning was successful
        console.log('Receipt scanned successfully:', result);
      } else {
        setError(result?.error || 'Failed to scan receipt');
        console.error('Receipt scanning failed:', result?.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error scanning receipt:', error);
      setError(error.message || 'An error occurred while scanning');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddExpense = async () => {
    if (!receiptScanStatus.data) {
      setError('No receipt data available');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Combine receiptScanStatus.data with form data
      const dataToSubmit = {
        ...receiptScanStatus.data,
        amount: receiptData.amount,
        date: receiptData.date,
        description: receiptData.description,
        category: receiptData.category,
        notes: receiptData.notes,
        fromReceipt: true,
        receiptImageUrl: previewUrl
      };
      
      console.log('Adding expense from receipt data:', dataToSubmit);
      const result = await addExpenseFromReceipt(dataToSubmit);
      
      if (result) {
        // Successfully added expense, navigate to dashboard
        navigate('/');
      } else {
        setError('Failed to add expense. Please try again.');
      }
    } catch (error) {
      console.error('Error adding expense from receipt:', error);
      setError(error.message || 'Failed to add expense');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    // Return to previous page
    navigate(-1);
  };
  
  // Get safe categories array
  const safeCategories = Array.isArray(expenseCategories) ? expenseCategories : ['Food', 'Shopping', 'Transportation', 'Other'];
  
  return (
    <div className="receipt-scanner">
      <h1>Scan Receipt</h1>
      
      <div className="scanner-container">
        {!receiptScanStatus.data ? (
          <>
            <div className="upload-area">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Receipt preview" 
                  className="receipt-preview" 
                />
              ) : (
                <div className="upload-placeholder">
                  <i className="upload-icon">📷</i>
                  <p>Upload receipt image</p>
                </div>
              )}
              
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
                id="receipt-upload"
              />
              <label htmlFor="receipt-upload" className="upload-button">
                Choose Image
              </label>
            </div>
            
            {/* Display errors */}
            {error && (
              <div className="scan-error">
                {error}
              </div>
            )}
            
            {receiptScanStatus.error && !error && (
              <div className="scan-error">
                {receiptScanStatus.error}
              </div>
            )}
            
            <div className="scan-actions">
              <button 
                className="scan-button"
                onClick={handleScan}
                disabled={!selectedFile || isLoading}
              >
                {isLoading ? 'Processing...' : 'Scan Receipt'}
              </button>
              <button 
                className="cancel-button" 
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="scan-results">
            <h2>Receipt Details</h2>
            
            {previewUrl && (
              <div style={{marginBottom: '20px', textAlign: 'center'}}>
                <img 
                  src={previewUrl} 
                  alt="Receipt preview" 
                  style={{maxWidth: '100%', maxHeight: '300px', border: '1px solid #ddd'}} 
                />
              </div>
            )}
            
            <div className="receipt-info">
              <div className="info-row">
                <label>Amount:</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={receiptData.amount} 
                  onChange={(e) => setReceiptData({...receiptData, amount: e.target.value})}
                  placeholder="Enter receipt total"
                  style={{width: '70%', padding: '8px'}}
                />
              </div>
              
              <div className="info-row">
                <label>Date:</label>
                <input 
                  type="date"
                  value={receiptData.date} 
                  onChange={(e) => setReceiptData({...receiptData, date: e.target.value})}
                  style={{width: '70%', padding: '8px'}}
                />
              </div>
              
              <div className="info-row">
                <label>Merchant:</label>
                <input 
                  type="text"
                  value={receiptData.description} 
                  onChange={(e) => setReceiptData({...receiptData, description: e.target.value})}
                  placeholder="Enter merchant name"
                  style={{width: '70%', padding: '8px'}}
                />
              </div>
              
              <div className="info-row">
                <label>Category:</label>
                <select
                  value={receiptData.category}
                  onChange={(e) => setReceiptData({...receiptData, category: e.target.value})}
                  style={{width: '70%', padding: '8px'}}
                >
                  {safeCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="info-row">
                <label>Notes:</label>
                <textarea
                  value={receiptData.notes}
                  onChange={(e) => setReceiptData({...receiptData, notes: e.target.value})}
                  placeholder="Enter any additional notes"
                  style={{width: '70%', padding: '8px', minHeight: '60px'}}
                />
              </div>
            </div>
            
            {error && (
              <div className="scan-error">
                {error}
              </div>
            )}
            
            <div className="result-actions">
              <button 
                className="add-expense-btn" 
                onClick={handleAddExpense}
                disabled={isLoading || !receiptData.amount || !receiptData.description}
              >
                {isLoading ? 'Adding...' : 'Add Expense'}
              </button>
              <button 
                className="cancel-button" 
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptScanner;