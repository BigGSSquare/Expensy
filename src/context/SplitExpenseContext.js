// src/context/SplitExpenseContext.js
import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { ExpenseContext } from './ExpenseContext';
import { 
  createSplitExpense, 
  createParticipant, 
  updateParticipantStatus, 
  calculateSplitStatus 
} from '../models/SplitExpenseModel';
import { sendSplitExpenseEmail } from '../services/EmailService';
// Add Firebase imports
import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  getDoc,
  setDoc
} from 'firebase/firestore';

const ensureStringId = (id) => {
  if (id === null || id === undefined) return null;
  return String(id);
};

export const SplitExpenseContext = createContext();

export const SplitExpenseProvider = ({ children }) => {
  const [splitExpenses, setSplitExpenses] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailStatus, setEmailStatus] = useState({});
  
  // Add refs to track and clean up listeners
  const emailTimeoutsRef = useRef({});
  const contactsListenerRef = useRef(null);
  
  const { currentUser } = useContext(AuthContext);
  const { addExpense } = useContext(ExpenseContext);
  
  // Load data from Firestore when component mounts or user changes
  useEffect(() => {
    if (!currentUser) {
      setSplitExpenses([]);
      setContacts([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    console.log('Loading split expenses for user:', currentUser.uid);
    
    // Query Firestore for split expenses
    const splitExpensesQuery = query(
      collection(db, 'splitExpenses'),
      where('userId', '==', currentUser.uid)
    );
    
    // Set up real-time listener for split expenses
    const unsubscribe = onSnapshot(
      splitExpensesQuery, 
      (snapshot) => {
        try {
          // Process incoming data changes
          const splitExpensesList = snapshot.docs.map(doc => {
            const data = doc.data();
            // Ensure ID is always stored as a string
            return {
              id: String(doc.id),
              ...data,
              // Ensure participants have string IDs too
              participants: Array.isArray(data.participants) 
                ? data.participants.map(p => ({...p, id: String(p.id)})) 
                : data.participants
            };
          });
          
          console.log('Loaded split expenses:', splitExpensesList.length);
          setSplitExpenses(splitExpensesList);
          setLoading(false);
        } catch (error) {
          console.error("Error processing split expenses data:", error);
          setSplitExpenses([]);
          setLoading(false);
        }
      }, 
      (error) => {
        console.error("Error getting split expenses:", error.code, error.message);
        setLoading(false);
      }
    );
    
    // Load contacts
    loadContacts();
    
    return () => {
      unsubscribe();
      // Clean up contacts listener if it exists
      if (contactsListenerRef.current) {
        contactsListenerRef.current();
      }
    };
  }, [currentUser]);
  
  // Clean up email status timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts when component unmounts
      Object.values(emailTimeoutsRef.current).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      emailTimeoutsRef.current = {};
    };
  }, []);
  
  // Function to load contacts from Firestore - with improved error handling
  const loadContacts = async () => {
    if (!currentUser) {
      setContacts([]);
      return false;
    }
    
    try {
      console.log('Setting up contacts listener for user:', currentUser.uid);
      
      const contactsQuery = query(
        collection(db, 'contacts'),
        where('userId', '==', currentUser.uid)
      );
      
      // Set up real-time listener for contacts
      const unsubscribe = onSnapshot(
        contactsQuery,
        (snapshot) => {
          try {
            const contactsList = snapshot.docs.map(doc => ({
              id: String(doc.id),  // Ensure ID is stored as a string
              ...doc.data()
            }));
            
            console.log('Loaded contacts:', contactsList.length);
            setContacts(contactsList);
          } catch (error) {
            console.error('Error processing contacts data:', error);
            setContacts([]);
          }
        },
        (error) => {
          console.error('Error in contacts listener:', error);
          setContacts([]);
        }
      );
      
      // Store the unsubscribe function to clean up on unmount
      contactsListenerRef.current = unsubscribe;
      
      return true;
    } catch (error) {
      console.error('Error setting up contacts listener:', error);
      setContacts([]);
      return false;
    }
  };
  
  /**
   * Create a new split expense with improved error handling
   * @param {Object} expenseData - Expense data (amount, category, etc.)
   * @param {Array} participants - Array of participants
   * @returns {Object} New split expense or null if failed
   */
  const createNewSplitExpense = async (expenseData, participants) => {
    if (!currentUser) {
      console.error('Cannot create split expense: No authenticated user');
      return null;
    }
    
    try {
      console.log('Creating new split expense with:', { 
        expenseDetails: expenseData,
        participantCount: participants.length
      });
      
      // Ensure participants have string IDs and valid data
      const validatedParticipants = participants.map(p => ({
        ...p,
        id: String(p.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
        shareAmount: parseFloat(p.shareAmount) || 0,
        sharePercentage: parseFloat(p.sharePercentage) || 0,
        status: p.status || 'unpaid'
      }));
      
      // Find the creator's participant object to determine their share
      const creatorParticipant = validatedParticipants.find(p => 
        (p.email && currentUser.email && p.email.toLowerCase() === currentUser.email.toLowerCase()) || 
        (p.name && currentUser.name && p.name === currentUser.name)
      );
      
      // If creator isn't found in participants, use the first participant as a fallback
      const userShare = creatorParticipant?.shareAmount || 
                       (validatedParticipants.length > 0 ? validatedParticipants[0].shareAmount : 0);
      
      // First create the base expense with proper split expense attribution
      const baseExpense = {
        ...expenseData,
        // Make sure amount is parsed as a number
        amount: parseFloat(expenseData.amount),
        // Mark this as a split expense
        isSplit: true,
        // Add the current user's share for proper budget calculations
        userShare: userShare,
        // Add the number of participants
        participantCount: validatedParticipants.length,
        // Add userId if not already set
        userId: currentUser.uid,
        // Add a descriptive note
        notes: expenseData.notes || `Split with ${validatedParticipants.length} people`,
        // Add creation date
        createdAt: new Date().toISOString()
      };
      
      console.log('Creating base expense for split:', baseExpense);
      
      // Try to add the expense
      const ensureStringId = await addExpense(baseExpense);
      
      if (!ensureStringId) {
        throw new Error('Failed to create base expense');
      }
      
      console.log('Base expense created with ID:', ensureStringId);
      
      // Create the split expense object
      const newSplitExpense = createSplitExpense(
        {
          ...expenseData,
          // The addExpense function returns the ID, but we need the full object
          id: ensureStringId,
          userId: currentUser.uid
        },
        validatedParticipants
      );
      
      console.log('Split expense object created:', newSplitExpense);
      
      // Add to Firestore
      const splitExpenseData = {
        ...newSplitExpense,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'splitExpenses'), splitExpenseData);
      console.log('Split expense added to Firestore with ID:', docRef.id);
      
      // Add the Firestore document ID
      const splitExpenseWithId = {
        ...splitExpenseData,
        id: String(docRef.id)
      };
      
      // Add any new contacts to Firestore
      const existingContactEmails = contacts
        .map(c => c.email?.toLowerCase())
        .filter(Boolean);
      
      console.log('Checking for new contacts to add...');
      
      for (const participant of validatedParticipants) {
        // Only add contacts with email addresses
        if (participant.email && 
            !existingContactEmails.includes(participant.email.toLowerCase())) {
          
          console.log('Adding new contact:', participant.name);
          
          try {
            // Create a new contact entry
            const contactData = {
              name: participant.name,
              email: participant.email,
              userId: currentUser.uid,
              createdAt: new Date().toISOString()
            };
            
            const contactRef = await addDoc(collection(db, 'contacts'), contactData);
            console.log('New contact added with ID:', contactRef.id);
            
            // Update local contacts state
            setContacts(prev => [...prev, {
              id: String(contactRef.id),
              ...contactData
            }]);
          } catch (contactError) {
            console.error('Error adding contact:', contactError);
            // Continue with split expense creation even if contact can't be added
          }
        }
      }
      
      // Send email notifications to participants (except the creator)
      const otherParticipants = validatedParticipants.filter(p => 
        p.email && currentUser.email && p.email.toLowerCase() !== currentUser.email.toLowerCase()
      );
      
      if (otherParticipants.length > 0) {
        console.log(`Sending split expense notifications to ${otherParticipants.length} participants`);
        
        // Create a queue to send emails sequentially to avoid rate limits
        const sendEmailQueue = async () => {
          for (let i = 0; i < otherParticipants.length; i++) {
            const participant = otherParticipants[i];
            const stringParticipantId = String(participant.id);
            
            try {
              // Track email status
              setEmailStatus(prev => ({
                ...prev,
                [stringParticipantId]: { sending: true }
              }));
              
              // Send the email with minimal parameters
              const result = await sendSplitExpenseEmail(
                participant, 
                splitExpenseWithId, 
                currentUser
              );
              
              console.log(`Email result for ${participant.name}:`, result);
              
              // Update email status
              setEmailStatus(prev => ({
                ...prev,
                [stringParticipantId]: { 
                  sending: false,
                  sent: result.success, 
                  error: result.success ? null : result.message 
                }
              }));
              
              // Wait a bit between emails to avoid rate limiting
              if (i < otherParticipants.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (error) {
              console.error(`Failed to send split email to ${participant.name}:`, error);
              
              // Update email status with error
              setEmailStatus(prev => ({
                ...prev,
                [stringParticipantId]: { 
                  sending: false,
                  sent: false, 
                  error: error.message || 'Unknown error' 
                }
              }));
              
              // Continue with the next participant even if this one fails
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          // Clear email status after all emails have been processed (plus a buffer)
          const timeoutId = setTimeout(() => {
            setEmailStatus({});
          }, 10000);
          
          // Store timeout ID to clear if component unmounts
          emailTimeoutsRef.current['all'] = timeoutId;
        };
        
        // Start the email queue
        sendEmailQueue();
      }
      
      return splitExpenseWithId;
    } catch (error) {
      console.error('Error creating split expense:', error);
      return null;
    }
  };
  
  /**
   * Get a split expense by ID
   * @param {string|number} id - Split expense ID
   * @returns {Object} Split expense or null if not found
   */
  const getSplitExpense = (id) => {
    if (!id) return null;
    const stringId = ensureStringId(id);
    return splitExpenses.find(expense => ensureStringId(expense.id) === stringId) || null;
  };
  
  /**
   * Update a participant's payment status with improved error handling
   * @param {string|number} splitExpenseId - Split expense ID
   * @param {string} participantId - Participant ID
   * @param {string} status - New status (paid, unpaid, declined)
   * @param {string} paymentMethod - Method of payment
   * @returns {Promise<boolean>} Success status
   */
  const updatePaymentStatus = async (splitExpenseId, participantId, status, paymentMethod) => {
    if (!currentUser) {
      console.error('Cannot update payment status: No authenticated user');
      return false;
    }
    
    // Use the helper function to ensure string IDs
    const stringExpenseId = ensureStringId(splitExpenseId);
    const stringParticipantId = ensureStringId(participantId);
    
    if (!stringExpenseId || !stringParticipantId) {
      console.error('Missing required IDs for updatePaymentStatus');
      return false;
    }
    
    try {
      console.log(`Updating payment: expense=${stringExpenseId}, participant=${stringParticipantId}`);
      
      // Find the split expense using string comparison
      const splitExpense = splitExpenses.find(expense => 
        ensureStringId(expense.id) === stringExpenseId
      );
      
      if (!splitExpense) {
        console.error(`Split expense with ID ${stringExpenseId} not found`);
        return false;
      }
      
      // Make sure participants array exists
      if (!Array.isArray(splitExpense.participants)) {
        console.error('Participants array is missing or invalid');
        return false;
      }
      
      // Check if participant exists (using string comparison)
      const participantIndex = splitExpense.participants.findIndex(p => 
        ensureStringId(p.id) === stringParticipantId
      );
      
      if (participantIndex === -1) {
        console.error(`Participant with ID ${stringParticipantId} not found`);
        return false;
      }
      
      // Create a deep copy of participants to avoid mutation issues
      const updatedParticipants = JSON.parse(JSON.stringify(splitExpense.participants));
      
      // Update the participant
      updatedParticipants[participantIndex] = {
        ...updatedParticipants[participantIndex],
        status: status,
        paymentMethod: paymentMethod || updatedParticipants[participantIndex].paymentMethod,
        paidDate: status === 'paid' ? new Date().toISOString() : updatedParticipants[participantIndex].paidDate
      };
      
      // Recalculate the overall status
      const updatedStatus = calculateSplitStatus({
        ...splitExpense,
        participants: updatedParticipants
      });
      
      console.log(`New split expense status: ${updatedStatus}`);
      
      // Update in Firestore with explicit error handling
      const splitExpenseRef = doc(db, 'splitExpenses', String(stringExpenseId));
      
      // First check that document exists
      const docSnap = await getDoc(splitExpenseRef);
      if (!docSnap.exists()) {
        console.error(`Firestore document ${stringExpenseId} does not exist`);
        return false;
      }
      
      // Then perform the update
      await updateDoc(splitExpenseRef, {
        participants: updatedParticipants,
        status: updatedStatus,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Payment status updated successfully in Firestore');
      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      console.error('Error details:', error.code, error.message);
      return false;
    }
  };
  
  /**
   * Add a new contact with improved validation and error handling
   * @param {string} name - Contact name
   * @param {string} email - Contact email
   * @returns {boolean} Success status
   */
  const addContact = async (name, email) => {
    if (!currentUser) {
      console.error('Cannot add contact: No authenticated user');
      return false;
    }
    
    if (!name || name.trim() === '') {
      console.error('Contact name is required');
      return false;
    }
    
    try {
      console.log(`Adding new contact: ${name} (${email || 'No email'})`);
      
      // Check if contact with this email already exists (case insensitive)
      if (email && email.trim() !== '') {
        const normalizedEmail = email.trim().toLowerCase();
        
        // First check against local state to avoid unnecessary Firestore query
        const existingContact = contacts.find(c => 
          c.email && c.email.toLowerCase() === normalizedEmail
        );
        
        if (existingContact) {
          console.log(`Contact with email ${email} already exists`);
          return false;
        }
        
        // Double-check with Firestore to be sure
        const existingContactsQuery = query(
          collection(db, 'contacts'),
          where('userId', '==', currentUser.uid),
          where('email', '==', email.trim())
        );
        
        const existingContacts = await getDocs(existingContactsQuery);
        if (!existingContacts.empty) {
          console.log(`Contact with email ${email} exists in Firestore but not in local state`);
          return false;
        }
      }
      
      // Create new contact object
      const newContactData = {
        name: name.trim(),
        email: email ? email.trim() : '',
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'contacts'), newContactData);
      console.log('Contact added with ID:', docRef.id);
      
      const newContact = {
        ...newContactData,
        id: String(docRef.id)
      };
      
      // Update local state
      setContacts(prevContacts => [...prevContacts, newContact]);
      
      return true;
    } catch (error) {
      console.error('Error adding contact:', error);
      return false;
    }
  };
  
  /**
   * Delete a contact
   * @param {string} contactId - Contact ID
   * @returns {boolean} Success status
   */
  const deleteContact = async (contactId) => {
    if (!currentUser || !contactId) {
      console.error('Cannot delete contact: Missing user or contact ID');
      return false;
    }
    
    try {
      const stringContactId = String(contactId);
      console.log(`Deleting contact with ID: ${stringContactId}`);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'contacts', stringContactId));
      
      // Update local state
      setContacts(prevContacts => prevContacts.filter(contact => String(contact.id) !== stringContactId));
      
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      return false;
    }
  };
  
  /**
   * Get all split expenses
   * @returns {Array} Array of split expenses
   */
  const getAllSplitExpenses = () => {
    return splitExpenses;
  };
  
  /**
   * Get all contacts
   * @returns {Array} Array of contacts
   */
  const getAllContacts = () => {
    return contacts;
  };
  
  /**
   * Delete a split expense
   * @param {string|number} splitExpenseId - Split expense ID
   * @returns {boolean} Success status
   */
  const deleteSplitExpense = async (splitExpenseId) => {
    if (!currentUser || !splitExpenseId) {
      console.error('Cannot delete split expense: Missing user or split expense ID');
      return false;
    }
    
    try {
      const stringExpenseId = String(splitExpenseId);
      console.log(`Deleting split expense with ID: ${stringExpenseId}`);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'splitExpenses', stringExpenseId));
      
      return true;
    } catch (error) {
      console.error('Error deleting split expense:', error);
      return false;
    }
  };
  
  /**
   * Remind a participant to pay
   * @param {string|number} splitExpenseId - Split expense ID
   * @param {string} participantId - Participant ID
   * @returns {boolean} Success status
   */
  const sendPaymentReminder = async (splitExpenseId, participantId) => {
    if (!currentUser || !splitExpenseId || !participantId) {
      console.error('Missing required parameters for sendPaymentReminder');
      return false;
    }
    
    try {
      // Convert IDs to strings for consistent comparison
      const stringExpenseId = String(splitExpenseId);
      const stringParticipantId = String(participantId);
      
      console.log(`Sending payment reminder for participant ${stringParticipantId}`);
      
      const splitExpense = getSplitExpense(stringExpenseId);
      if (!splitExpense) {
        console.error(`Split expense with ID ${stringExpenseId} not found`);
        return false;
      }
      
      // Find participant using string comparison
      const participant = splitExpense.participants.find(p => String(p.id) === String(participantId));;
        
      if (!participant) {
        console.error(`Participant with ID ${stringParticipantId} not found in split expense`);
        return false;
      }
      
      if (!participant.email) {
        console.error(`Participant ${stringParticipantId} has no email address`);
        return false;
      }
      
      // Update email status without accidentally overwriting other statuses
      setEmailStatus(prev => ({
        ...prev,
        [stringParticipantId]: { sending: true }
      }));
      
      // Create complete email parameters
      const emailParams = {
        to_email: participant.email,
        to_name: participant.name || 'Participant',
        creator_name: currentUser.name || 'Group member',
        expense_description: splitExpense.description || 'Split expense',
        expense_category: splitExpense.category || 'Uncategorized',
        expense_date: new Date(splitExpense.date || new Date()).toLocaleDateString(),
        expense_amount: (splitExpense.totalAmount || 0).toFixed(2),
        share_amount: (participant.shareAmount || 0).toFixed(2),
        is_reminder: true,
        reminder_message: `This is a friendly reminder that your payment of $${(participant.shareAmount || 0).toFixed(2)} for "${splitExpense.description || 'Split expense'}" is still pending.`,
        // Essential parameters for EmailJS template
        name: currentUser.name || 'Expensy',
        email: currentUser.email || '',
        reply_to: currentUser.email || '',
        subject: `Payment Reminder: ${splitExpense.description || 'Split expense'}`
      };
      
      try {
        // Send reminder email with explicit error handling
        const result = await sendSplitExpenseEmail(
          participant, 
          splitExpense, 
          currentUser, 
          true, 
          emailParams
        );
        
        console.log(`Reminder email result for ${participant.name}:`, result);
        
        // Update email status with a clean state update
        setEmailStatus(prev => ({
          ...prev,
          [stringParticipantId]: { 
            sending: false,
            sent: result.success, 
            error: result.success ? null : result.message 
          }
        }));
        
        // Log reminder in Firestore
        if (result.success) {
          try {
            const reminderLog = {
              splitExpenseId: stringExpenseId,
              participantId: stringParticipantId,
              timestamp: new Date().toISOString(),
              userId: currentUser.uid,
              success: true
            };
            
            await addDoc(collection(db, 'reminderLogs'), reminderLog);
          } catch (logError) {
            console.error('Error logging reminder:', logError);
            // Continue even if logging fails
          }
        }
        
        // Clear status after some time
        const timeoutId = setTimeout(() => {
          setEmailStatus(prev => {
            const newStatus = { ...prev };
            if (newStatus[stringParticipantId]) {
              delete newStatus[stringParticipantId];
            }
            return newStatus;
          });
        }, 10000);
        
        // Store timeout ID to clear if component unmounts
        emailTimeoutsRef.current[stringParticipantId] = timeoutId;
        
        return true;
      } catch (error) {
        console.error(`Failed to send reminder email to ${participant.name}:`, error);
        
        // Update email status with error
        setEmailStatus(prev => ({
          ...prev,
          [stringParticipantId]: { 
            sending: false,
            sent: false, 
            error: error.message || 'Failed to send email' 
          }
        }));
        
        return false;
      }
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      
      // Make sure the sending status is cleared if there's an error
      if (participantId) {
        setEmailStatus(prev => ({
          ...prev,
          [String(participantId)]: { 
            sending: false,
            sent: false, 
            error: error.message || 'Unknown error occurred' 
          }
        }));
      }
      
      return false;
    }
  };
  
  return (
    <SplitExpenseContext.Provider
      value={{
        loading,
        createNewSplitExpense,
        getSplitExpense,
        updatePaymentStatus,
        addContact,
        deleteContact,
        getAllSplitExpenses,
        getAllContacts,
        deleteSplitExpense,
        sendPaymentReminder,
        createParticipant,
        emailStatus
      }}
    >
      {children}
    </SplitExpenseContext.Provider>
  );
};

export default SplitExpenseProvider;