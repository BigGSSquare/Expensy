// src/services/EmailService.js
import emailjs from 'emailjs-com';

// Your EmailJS credentials
const EMAILJS_PUBLIC_KEY = 'Y9vk-uKO6YgZSnmUd';
const EMAILJS_SERVICE_ID = 'service_o5hntt8';
const EMAILJS_TEMPLATE_ID = 'template_8zyy8br';
const EMAILJS_SPLIT_TEMPLATE_ID = 'template_74mjphe';

// Initialize EmailJS with better error handling and logging
try {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  console.log('📧 EmailJS initialized successfully');
} catch (error) {
  console.error('📧 Failed to initialize EmailJS:', error);
}

/**
 * Sends a split expense notification email to a participant
 * @param {object} participant - The participant object containing email and name
 * @param {object} splitExpense - The split expense details
 * @param {object} creator - The user who created the split expense
 * @param {boolean} isReminder - Whether this is a reminder email
 * @returns {Promise<object>} - Result of the email sending operation
 */
export const sendSplitExpenseEmail = async (participant, splitExpense, creator, isReminder = false, customParams = null) => {
  // Basic validation
  if (!participant || !participant.email) {
    console.error('📧 Cannot send email: Participant email is missing');
    return { success: false, message: 'Participant email is missing' };
  }

  console.log(`📧 Sending ${isReminder ? 'reminder' : 'notification'} to: ${participant.email}`);
  
  // Use custom params if provided, otherwise build default params
  const templateParams = customParams || {
    to_email: participant.email,
    to_name: participant.name || 'Participant', 
    creator_name: creator?.name || 'Someone',
    from_email: creator?.email || '',
    expense_description: splitExpense.description || 'Split expense',
    expense_amount: (splitExpense.totalAmount || 0).toFixed(2),
    share_amount: (participant.shareAmount || 0).toFixed(2),
    expense_date: new Date(splitExpense.date || new Date()).toLocaleDateString(),
    expense_category: splitExpense.category || 'Uncategorized',
    reply_to: creator?.email || '',
    from_name: creator?.name || 'Expensy',
    is_reminder: isReminder
  };
  
  console.log('📧 Email parameters:', JSON.stringify(templateParams, null, 2));
  
  try {
    // Send email using EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_SPLIT_TEMPLATE_ID,
      templateParams
    );
    
    console.log('📧 Email sent successfully!', response);
    return {
      success: true,
      message: 'Email sent successfully',
      response: response
    };
  } catch (error) {
    console.error('📧 Error sending email:', error);
    
    // Provide detailed error information
    let errorMessage = 'Failed to send email';
    if (error.text) errorMessage += `: ${error.text}`;
    
    return {
      success: false,
      message: errorMessage,
      error: error
    };
  }
};

/**
 * Send a test split expense email to verify the configuration
 * @param {object} user - The user object containing email and name
 * @returns {Promise<object>} - Result of the email sending operation
 */
export const sendTestSplitEmail = async (user) => {
  if (!user || !user.email) {
    console.error('📧 Cannot send test email: User email is missing');
    return { success: false, message: 'User email is missing' };
  }
  
  // Create a test participant (using the user's info)
  const participant = {
    name: user.name || user.email.split('@')[0],
    email: user.email,
    shareAmount: 25.00
  };
  
  // Create a test split expense
  const testSplitExpense = {
    description: 'Test Split Expense',
    totalAmount: 100.00,
    date: new Date().toISOString(),
    category: 'Dining'
  };
  
  return sendSplitExpenseEmail(
    participant,
    testSplitExpense,
    { name: 'Test Creator', email: 'creator@example.com' }
  );
};

/**
 * Send a budget alert email when a user exceeds their budget
 * @param {object} user - The user object containing email and name
 * @param {string} category - The budget category that was exceeded
 * @param {number} budget - The budget amount
 * @param {number} spent - The amount spent
 * @returns {Promise<object>} - Result of the email sending operation
 */
export const sendBudgetAlertEmail = async (user, category, budget, spent) => {
  // Input validation
  if (!user || !user.email) {
    console.error('📧 Cannot send email: User email is missing');
    return { success: false, message: 'User email is missing' };
  }

  console.log(`📧 Preparing to send budget alert email to ${user.email} for ${category}`);
  console.log(`📧 Budget: $${budget.toFixed(2)}, Spent: $${spent.toFixed(2)}`);
  
  // Prepare email parameters with better fallbacks
  const templateParams = {
    to_email: user.email,
    to_name: user.name || user.email.split('@')[0],
    category: category || 'Unknown Category',
    budget: budget ? budget.toFixed(2) : '0.00',
    spent: spent ? spent.toFixed(2) : '0.00',
    over_amount: spent && budget ? (spent - budget).toFixed(2) : '0.00',
    reply_to: user.email,
    from_name: 'Expensy Budget Alert',
    // Add additional parameters to help with debugging
    timestamp: new Date().toISOString(),
    subject: `Budget Alert: You've exceeded your ${category} budget`
  };
  
  console.log('📧 Email parameters:', JSON.stringify(templateParams, null, 2));
  
  try {
    console.log(`📧 Sending email using service: ${EMAILJS_SERVICE_ID}, template: ${EMAILJS_TEMPLATE_ID}`);
    
    // Send email using EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    
    console.log('📧 Email sent successfully!', response);
    return {
      success: true,
      message: 'Email sent successfully',
      response: response
    };
  } catch (error) {
    console.error('📧 Error sending email:', error);
    
    // More detailed error reporting
    let errorDetails = 'Unknown error';
    if (error.text) errorDetails = error.text;
    else if (error.message) errorDetails = error.message;
    
    // Log additional diagnostic information
    console.error('📧 EmailJS parameters:', {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY ? 'Configured' : 'Missing'
    });
    
    return {
      success: false,
      message: `Failed to send email: ${errorDetails}`,
      error: error
    };
  }
};

/**
 * Send a test email to verify the configuration
 * @param {object} user - The user object containing email and name
 * @returns {Promise<object>} - Result of the email sending operation
 */
export const sendTestEmail = async (user) => {
  if (!user || !user.email) {
    console.error('📧 Cannot send test email: User email is missing');
    return { success: false, message: 'User email is missing' };
  }
  
  console.log(`📧 Sending test email to ${user.email}`);
  
  return sendBudgetAlertEmail(
    user,
    'Test Category',
    100.00,
    150.00
  );
};