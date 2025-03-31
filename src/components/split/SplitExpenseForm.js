// src/components/split/SplitExpenseForm.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExpenseContext } from '../../context/ExpenseContext';
import { SplitExpenseContext } from '../../context/SplitExpenseContext';
import { AuthContext } from '../../context/AuthContext';
import './SplitExpense.css';

const SplitExpenseForm = () => {
  const { currentUser } = useContext(AuthContext);
  const { expenseCategories } = useContext(ExpenseContext);
  const { 
    createNewSplitExpense, 
    getAllContacts,
    createParticipant 
  } = useContext(SplitExpenseContext);
  
  const navigate = useNavigate();
  
  // Make sure we have valid categories
  const safeCategories = Array.isArray(expenseCategories) ? expenseCategories : [];
  
  // Basic expense form state
  const [expenseData, setExpenseData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    notes: ''
  });
  
  // Participants state
  const [participants, setParticipants] = useState([]);
  const [splitMethod, setSplitMethod] = useState('equal'); // equal, percentage, amount
  const [error, setError] = useState('');
  const [contacts, setContacts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state
  
  // New participant form state
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    sharePercentage: '',
    shareAmount: ''
  });
  
  // Add current user as a participant by default
  useEffect(() => {
    if (currentUser && participants.length === 0) {
      console.log("Adding current user as participant:", currentUser.name || 'Me');
      
      // Add the current user as the first participant
      const currentUserParticipant = createParticipant(
        currentUser.name || 'Me',
        currentUser.email || '',
        null, // Share percentage will be calculated later
        null  // Share amount will be calculated later
      );
      
      setParticipants([currentUserParticipant]);
    }
    
    // Load contacts
    const loadedContacts = getAllContacts();
    console.log("Loaded contacts:", loadedContacts.length);
    setContacts(loadedContacts);
  }, [currentUser, getAllContacts, createParticipant, participants.length]);
  
  // Update shares when participants or split method changes
  useEffect(() => {
    if (participants.length > 0 && expenseData.amount) {
      updateShares();
    }
  }, [participants.length, expenseData.amount, splitMethod]);
  
  // Handle expense form changes
  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseData({
      ...expenseData,
      [name]: value
    });
    
    // If amount changed, update participant shares
    if (name === 'amount' && value && participants.length > 0) {
      updateShares();
    }
  };
  
  // Handle new participant form changes
  const handleNewParticipantChange = (e) => {
    const { name, value } = e.target;
    setNewParticipant({
      ...newParticipant,
      [name]: value
    });
  };
  
  // Add a new participant
  const handleAddParticipant = () => {
    if (!newParticipant.name.trim()) {
      setError('Participant name is required');
      return;
    }
    
    // Check if participant with same name already exists
    const participantExists = participants.some(
      p => p.name.toLowerCase() === newParticipant.name.trim().toLowerCase()
    );
    
    if (participantExists) {
      setError('A participant with this name already exists');
      return;
    }
    
    // Create new participant
    const participant = createParticipant(
      newParticipant.name.trim(),
      newParticipant.email.trim(),
      splitMethod === 'percentage' ? parseFloat(newParticipant.sharePercentage) || null : null,
      splitMethod === 'amount' ? parseFloat(newParticipant.shareAmount) || null : null
    );
    
    // Add to participants list
    setParticipants([...participants, participant]);
    
    // Reset form
    setNewParticipant({
      name: '',
      email: '',
      sharePercentage: '',
      shareAmount: ''
    });
    
    // Clear any error messages
    setError('');
    
    // Update shares
    updateShares([...participants, participant]);
  };
  
  // Remove a participant
  const handleRemoveParticipant = (participantId) => {
    const updatedParticipants = participants.filter(p => p.id !== participantId);
    setParticipants(updatedParticipants);
    updateShares(updatedParticipants);
    
    // Clear any error messages
    setError('');
  };
  
  // Add a contact as a participant
  const handleAddContact = (contact) => {
    // Check if contact is already added
    if (participants.some(p => 
      (p.email && contact.email && p.email.toLowerCase() === contact.email.toLowerCase()) ||
      p.name.toLowerCase() === contact.name.toLowerCase()
    )) {
      setError('This contact is already added as a participant');
      return;
    }
    
    // Create participant from contact
    const participant = createParticipant(
      contact.name,
      contact.email
    );
    
    // Add to participants list
    setParticipants([...participants, participant]);
    
    // Clear any error messages
    setError('');
    
    // Update shares
    updateShares([...participants, participant]);
  };
  
  // Update participant shares based on split method
  const updateShares = (participantsList = participants) => {
    if (!expenseData.amount || isNaN(parseFloat(expenseData.amount))) {
      return;
    }
    
    const amount = parseFloat(expenseData.amount);
    let updatedParticipants = [...participantsList];
    
    if (splitMethod === 'equal') {
      // Equal split
      const share = amount / participantsList.length;
      updatedParticipants = participantsList.map(p => ({
        ...p,
        sharePercentage: 100 / participantsList.length,
        shareAmount: share
      }));
    } else if (splitMethod === 'percentage') {
      // Custom percentage split
      // First, calculate percentage for those without explicit percentage
      const totalAssignedPercentage = participantsList.reduce(
        (sum, p) => sum + (p.sharePercentage || 0), 
        0
      );
      
      const unassignedCount = participantsList.filter(p => !p.sharePercentage).length;
      
      if (unassignedCount > 0 && totalAssignedPercentage < 100) {
        const remainingPercentage = 100 - totalAssignedPercentage;
        const defaultPercentage = remainingPercentage / unassignedCount;
        
        updatedParticipants = participantsList.map(p => {
          if (!p.sharePercentage) {
            return {
              ...p,
              sharePercentage: defaultPercentage,
              shareAmount: (amount * defaultPercentage) / 100
            };
          }
          return {
            ...p,
            shareAmount: (amount * p.sharePercentage) / 100
          };
        });
      } else {
        updatedParticipants = participantsList.map(p => ({
          ...p,
          shareAmount: (amount * (p.sharePercentage || 0)) / 100
        }));
      }
    } else if (splitMethod === 'amount') {
      // Custom amount split
      // First, calculate total assigned amount
      const totalAssignedAmount = participantsList.reduce(
        (sum, p) => sum + (p.shareAmount || 0), 
        0
      );
      
      const unassignedCount = participantsList.filter(p => !p.shareAmount).length;
      
      if (unassignedCount > 0 && totalAssignedAmount < amount) {
        const remainingAmount = amount - totalAssignedAmount;
        const defaultAmount = remainingAmount / unassignedCount;
        
        updatedParticipants = participantsList.map(p => {
          if (!p.shareAmount) {
            return {
              ...p,
              shareAmount: defaultAmount,
              sharePercentage: (defaultAmount / amount) * 100
            };
          }
          return {
            ...p,
            sharePercentage: (p.shareAmount / amount) * 100
          };
        });
      } else {
        updatedParticipants = participantsList.map(p => ({
          ...p,
          sharePercentage: ((p.shareAmount || 0) / amount) * 100
        }));
      }
    }
    
    setParticipants(updatedParticipants);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Validation
      if (!expenseData.category) {
        setError('Please select a category');
        setIsSubmitting(false);
        return;
      }
      
      if (!expenseData.amount || isNaN(parseFloat(expenseData.amount)) || parseFloat(expenseData.amount) <= 0) {
        setError('Please enter a valid amount');
        setIsSubmitting(false);
        return;
      }
      
      if (!expenseData.date) {
        setError('Please select a date');
        setIsSubmitting(false);
        return;
      }
      
      if (!expenseData.description) {
        setError('Please enter a description');
        setIsSubmitting(false);
        return;
      }
      
      if (participants.length < 2) {
        setError('Please add at least one more participant to split the expense');
        setIsSubmitting(false);
        return;
      }
      
      // Verify total shares add up to the expense amount
      const totalShareAmount = participants.reduce((sum, p) => sum + (p.shareAmount || 0), 0);
      const expenseAmount = parseFloat(expenseData.amount);
      
      // Allow for small floating point differences
      if (Math.abs(totalShareAmount - expenseAmount) > 0.01) {
        setError(`The total of all shares (${totalShareAmount.toFixed(2)}) does not match the expense amount (${expenseAmount.toFixed(2)})`);
        setIsSubmitting(false);
        return;
      }
      
      console.log('Creating split expense with data:', {
        expenseData,
        participants
      });
      
      // Create the split expense
      const result = await createNewSplitExpense(
        {
          ...expenseData,
          amount: parseFloat(expenseData.amount)
        },
        participants
      );
      
      if (result) {
        console.log('Split expense created successfully:', result);
        // Navigate to split expense details
        navigate(`/split/details/${result.id}`);
      } else {
        setError('Failed to create split expense. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error creating split expense:', error);
      setError(`An error occurred: ${error.message || 'Please try again'}`);
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="split-expense-form-container">
      <h1>Split an Expense</h1>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
      
      <form className="split-expense-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Basic Expense Details</h2>
          
          <div className="form-group">
            <label htmlFor="category">Category*</label>
            <select
              id="category"
              name="category"
              value={expenseData.category}
              onChange={handleExpenseChange}
              required
              disabled={isSubmitting}
            >
              <option value="">Select a category</option>
              {safeCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Total Amount*</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={expenseData.amount}
              onChange={handleExpenseChange}
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
              value={expenseData.date}
              onChange={handleExpenseChange}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description*</label>
            <input
              type="text"
              id="description"
              name="description"
              value={expenseData.description}
              onChange={handleExpenseChange}
              placeholder="E.g., Dinner at Luigi's"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={expenseData.notes}
              onChange={handleExpenseChange}
              placeholder="Any additional details"
              rows="3"
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <div className="form-section">
          <h2>Split Details</h2>
          
          <div className="split-method-selector">
            <label>Split Method:</label>
            <div className="split-method-options">
              <button 
                type="button" 
                className={splitMethod === 'equal' ? 'active' : ''}
                onClick={() => setSplitMethod('equal')}
                disabled={isSubmitting}
              >
                Equal Split
              </button>
              <button 
                type="button" 
                className={splitMethod === 'percentage' ? 'active' : ''}
                onClick={() => setSplitMethod('percentage')}
                disabled={isSubmitting}
              >
                By Percentage
              </button>
              <button 
                type="button" 
                className={splitMethod === 'amount' ? 'active' : ''}
                onClick={() => setSplitMethod('amount')}
                disabled={isSubmitting}
              >
                By Amount
              </button>
            </div>
          </div>
          
          <div className="participants-list">
            <h3>Participants</h3>
            {participants.length === 0 ? (
              <p className="no-participants">No participants added yet</p>
            ) : (
              <div className="participants-table">
                <div className="participants-header">
                  <span>Name</span>
                  <span>Email</span>
                  {splitMethod === 'percentage' && <span>Percentage</span>}
                  {splitMethod === 'amount' && <span>Amount</span>}
                  <span>Share Amount</span>
                  <span>Actions</span>
                </div>
                
                {participants.map((participant, index) => (
                  <div className="participant-row" key={participant.id}>
                    <span>{participant.name}</span>
                    <span>{participant.email || '-'}</span>
                    
                    {splitMethod === 'percentage' && (
                      <span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={participant.sharePercentage || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            const updatedParticipants = [...participants];
                            updatedParticipants[index] = {
                              ...participant,
                              sharePercentage: value,
                              shareAmount: value ? (parseFloat(expenseData.amount) * value) / 100 : 0
                            };
                            setParticipants(updatedParticipants);
                          }}
                          disabled={isSubmitting}
                        />
                        %
                      </span>
                    )}
                    
                    {splitMethod === 'amount' && (
                      <span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={participant.shareAmount || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            const updatedParticipants = [...participants];
                            updatedParticipants[index] = {
                              ...participant,
                              shareAmount: value,
                              sharePercentage: value && expenseData.amount ? 
                                (value / parseFloat(expenseData.amount)) * 100 : 0
                            };
                            setParticipants(updatedParticipants);
                          }}
                          disabled={isSubmitting}
                        />
                      </span>
                    )}
                    
                    <span>
                      ${participant.shareAmount ? participant.shareAmount.toFixed(2) : '0.00'}
                    </span>
                    
                    <span>
                      {/* Don't allow removing the first participant (current user) */}
                      {index > 0 && (
                        <button
                          type="button"
                          className="remove-participant-btn"
                          onClick={() => handleRemoveParticipant(participant.id)}
                          disabled={isSubmitting}
                        >
                          Remove
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="add-participant-form">
            <h3>Add Participant</h3>
            <div className="participant-form-row">
              <div className="form-group">
                <label htmlFor="participantName">Name*</label>
                <input
                  type="text"
                  id="participantName"
                  name="name"
                  value={newParticipant.name}
                  onChange={handleNewParticipantChange}
                  placeholder="Participant name"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="participantEmail">Email</label>
                <input
                  type="email"
                  id="participantEmail"
                  name="email"
                  value={newParticipant.email}
                  onChange={handleNewParticipantChange}
                  placeholder="Optional"
                  disabled={isSubmitting}
                />
              </div>
              
              {splitMethod === 'percentage' && (
                <div className="form-group">
                  <label htmlFor="participantPercentage">Percentage</label>
                  <input
                    type="number"
                    id="participantPercentage"
                    name="sharePercentage"
                    value={newParticipant.sharePercentage}
                    onChange={handleNewParticipantChange}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
              )}
              
              {splitMethod === 'amount' && (
                <div className="form-group">
                  <label htmlFor="participantAmount">Amount</label>
                  <input
                    type="number"
                    id="participantAmount"
                    name="shareAmount"
                    value={newParticipant.shareAmount}
                    onChange={handleNewParticipantChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>
              )}
              
              <button
                type="button"
                className="add-participant-btn"
                onClick={handleAddParticipant}
                disabled={isSubmitting}
              >
                Add
              </button>
            </div>
          </div>
          
          {contacts.length > 0 && (
            <div className="contacts-section">
              <h3>Add from Contacts</h3>
              <div className="contacts-list">
                {contacts.map(contact => (
                  <div key={contact.id} className="contact-item">
                    <div className="contact-info">
                      <div className="contact-name">{contact.name}</div>
                      <div className="contact-email">{contact.email || 'No email'}</div>
                    </div>
                    <button
                      type="button"
                      className="add-contact-btn"
                      onClick={() => handleAddContact(contact)}
                      disabled={isSubmitting}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate('/split')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Split Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SplitExpenseForm;