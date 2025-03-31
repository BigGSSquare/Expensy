// src/services/ReceiptScanningService.js

/**
 * Service for handling receipt scanning functionality
 * This service mocks a server-side OCR processing approach
 */

/**
 * Processes a receipt image and extracts relevant expense data
 * 
 * @param {File|Blob} imageFile - The receipt image file to process
 * @returns {Promise<Object>} - Extracted receipt data or error information
 */
export const scanReceiptImage = async (imageFile) => {
  if (!imageFile) {
    return { 
      success: false, 
      error: 'No image file provided' 
    };
  }
  
  // Check if file is a valid image type
  const validImageTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
  if (!validImageTypes.includes(imageFile.type)) {
    return {
      success: false,
      error: 'Invalid file format. Please upload a JPEG or PNG image.'
    };
  }
  
  try {
    // Create form data that would normally be sent to a server
    const formData = new FormData();
    formData.append('receipt', imageFile);
    
    // In a real implementation, this would make an API call to a server
    // for OCR processing. We'll simulate the server response here.
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate a temporary URL for the uploaded image
    const imageUrl = URL.createObjectURL(imageFile);
    
    // Mock a successful response with extracted data
    const extractedData = simulateOCRResponse(imageUrl);
    
    return {
      success: true,
      ...extractedData,
      imageUrl
    };
  } catch (error) {
    console.error('Error scanning receipt:', error);
    return {
      success: false,
      error: error.message || 'Failed to process receipt. Please try again.'
    };
  }
};

/**
 * Helper function to simulate OCR API response
 * In production, this would be replaced by the actual API call
 * 
 * @param {string} imageUrl - URL to the receipt image
 * @returns {Object} - Simulated extracted data
 */
const simulateOCRResponse = (imageUrl) => {
  // Generate a random amount between $5 and $150
  const amount = (Math.random() * 145 + 5).toFixed(2);
  
  // Generate a random date within the last 30 days
  const today = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const receiptDate = new Date(today);
  receiptDate.setDate(today.getDate() - daysAgo);
  const dateString = receiptDate.toISOString().split('T')[0];
  
  // Select a random merchant from common options
  const merchants = [
    'Whole Foods Market', 'Target', 'Amazon', 'Starbucks',
    'Chevron', 'Walgreens', 'CVS Pharmacy', 'Home Depot',
    'Trader Joe\'s', 'Best Buy', 'Subway', 'Shell',
    'Walmart', 'Kroger', 'McDonald\'s', 'Costco'
  ];
  const merchantName = merchants[Math.floor(Math.random() * merchants.length)];
  
  // Map merchant to appropriate category
  const categoryMap = {
    'Whole Foods Market': 'Food',
    'Target': 'Shopping',
    'Amazon': 'Shopping',
    'Starbucks': 'Food',
    'Chevron': 'Transportation',
    'Walgreens': 'Healthcare',
    'CVS Pharmacy': 'Healthcare',
    'Home Depot': 'Housing',
    'Trader Joe\'s': 'Food',
    'Best Buy': 'Shopping',
    'Subway': 'Food',
    'Shell': 'Transportation',
    'Walmart': 'Shopping',
    'Kroger': 'Food',
    'McDonald\'s': 'Food',
    'Costco': 'Shopping'
  };
  
  const category = categoryMap[merchantName] || 'Other';
  
  return {
    merchantName,
    amount,
    date: dateString,
    category,
    confidence: 0.92, // Simulated confidence score
    description: merchantName  // Use merchant name as description
  };
};

/**
 * Parse and validate receipt data returned from the OCR service
 * 
 * @param {Object} ocrData - Raw data from the OCR service
 * @returns {Object} - Normalized receipt data
 */
export const parseReceiptData = (ocrData) => {
  if (!ocrData || !ocrData.success) {
    return null;
  }
  
  // Extract and validate amount
  let amount = parseFloat(ocrData.amount);
  if (isNaN(amount) || amount <= 0) {
    amount = 0;
  }
  
  // Validate date
  let receiptDate = ocrData.date;
  if (!receiptDate || !isValidDate(receiptDate)) {
    receiptDate = new Date().toISOString().slice(0, 10);
  }
  
  // Normalize merchant name
  const merchantName = ocrData.merchantName || 'Unknown Vendor';
  
  return {
    amount,
    date: receiptDate,
    description: merchantName,
    category: ocrData.category || 'Other',
    imageUrl: ocrData.imageUrl || null,
    notes: ocrData.notes || ''
  };
};

/**
 * Helper function to validate date string
 * 
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - Whether the date is valid
 */
const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  // Try to create a date object and check if it's valid
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};