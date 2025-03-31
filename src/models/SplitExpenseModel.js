// src/models/SplitExpenseModel.js

/**
 * Data structure for split expenses
 * 
 * A split expense represents a single expense that is shared between multiple participants.
 * Each participant can have their own share of the expense, and their own payment status.
 */

/**
 * Creates a new split expense
 * @param {Object} expense - The base expense object
 * @param {Array} participants - Array of participants
 * @returns {Object} Split expense object
 */
export const createSplitExpense = (expense, participants) => {
    // Create a unique ID for the split expense
    const splitId = Date.now();
    
    // Calculate shares if not provided
    const calculatedParticipants = participants.map(participant => {
      // If share percentage is not specified, calculate it as equal split
      if (!participant.sharePercentage) {
        const equalShare = 100 / participants.length;
        return {
          ...participant,
          sharePercentage: equalShare,
          shareAmount: (expense.amount * equalShare) / 100
        };
      }
      // If share amount is not specified, calculate it from percentage
      if (!participant.shareAmount) {
        return {
          ...participant,
          shareAmount: (expense.amount * participant.sharePercentage) / 100
        };
      }
      return participant;
    });
    
    // Create the split expense object
    return {
      id: splitId,
      expenseId: expense.id,
      createdAt: new Date().toISOString(),
      status: 'pending', // pending, settled, partial
      totalAmount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
      userId: expense.userId, // The user who created the split
      receiptImageUrl: expense.receiptImageUrl || null,
      participants: calculatedParticipants,
      notes: expense.notes || ''
    };
  };
  
  /**
   * Participant object structure
   * @typedef {Object} Participant
   * @property {string} id - Unique identifier for the participant
   * @property {string} name - Name of the participant
   * @property {string} email - Optional email for the participant
   * @property {number} sharePercentage - Percentage of the expense this participant is responsible for
   * @property {number} shareAmount - Actual amount this participant is responsible for
   * @property {string} status - Payment status (unpaid, paid, declined)
   * @property {string} paymentMethod - How they paid (cash, transfer, etc.)
   * @property {Date} paidDate - When they paid their share
   */
  
  /**
   * Creates a new participant
   * @param {string} name - Name of the participant
   * @param {string} email - Email of the participant (optional)
   * @param {number} sharePercentage - Percentage of the expense (optional)
   * @param {number} shareAmount - Actual amount (optional)
   * @returns {Participant} Participant object
   */
  export const createParticipant = (name, email = '', sharePercentage = null, shareAmount = null) => {
    return {
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name,
      email,
      sharePercentage,
      shareAmount,
      status: 'unpaid',
      paymentMethod: null,
      paidDate: null
    };
  };
  
  /**
   * Update a participant's payment status
   * @param {Participant} participant - The participant to update
   * @param {string} status - New status (paid, unpaid, declined)
   * @param {string} paymentMethod - Method of payment
   * @returns {Participant} Updated participant
   */
  export const updateParticipantStatus = (participant, status, paymentMethod = null) => {
    return {
      ...participant,
      status,
      paymentMethod,
      paidDate: status === 'paid' ? new Date().toISOString() : participant.paidDate
    };
  };
  
  /**
   * Calculate the overall status of a split expense
   * @param {Object} splitExpense - The split expense to evaluate
   * @returns {string} Status (pending, settled, partial)
   */
  export const calculateSplitStatus = (splitExpense) => {
    if (!splitExpense || !Array.isArray(splitExpense.participants)) {
      return 'pending';
    }
    
    const paidCount = splitExpense.participants.filter(p => p.status === 'paid').length;
    
    if (paidCount === 0) {
      return 'pending';
    } else if (paidCount === splitExpense.participants.length) {
      return 'settled';
    } else {
      return 'partial';
    }
  };
  
  /**
   * Get a summary of a split expense
   * @param {Object} splitExpense - The split expense
   * @returns {Object} Summary information
   */
  export const getSplitSummary = (splitExpense) => {
    if (!splitExpense || !Array.isArray(splitExpense.participants)) {
      return {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        participantCount: 0,
        paidCount: 0,
        status: 'pending'
      };
    }
    
    const paidAmount = splitExpense.participants
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.shareAmount || 0), 0);
      
    const pendingAmount = splitExpense.participants
      .filter(p => p.status !== 'paid')
      .reduce((sum, p) => sum + (p.shareAmount || 0), 0);
      
    const paidCount = splitExpense.participants.filter(p => p.status === 'paid').length;
    
    return {
      totalAmount: splitExpense.totalAmount,
      paidAmount,
      pendingAmount,
      participantCount: splitExpense.participants.length,
      paidCount,
      status: calculateSplitStatus(splitExpense)
    };
  };