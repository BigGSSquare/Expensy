// src/components/split/SplitContacts.js
import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SplitExpenseContext } from '../../context/SplitExpenseContext';
import './SplitExpense.css';

const SplitContacts = () => {
  const { getAllContacts, addContact, deleteContact } = useContext(SplitExpenseContext);
  
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newContact, setNewContact] = useState({ name: '', email: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load contacts
  useEffect(() => {
    try {
      const contactsList = getAllContacts();
      console.log('Loaded contacts:', contactsList.length);
      setContacts(contactsList);
    } catch (err) {
      console.error('Error loading contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [getAllContacts]);
  
  // Handle adding a new contact with improved error handling
  const handleAddContact = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!newContact.name.trim()) {
      setError('Contact name is required');
      return;
    }
    
    // Simple email validation
    const isValidEmail = (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !email || email.trim() === '' || re.test(email);
    };
    
    if (newContact.email && !isValidEmail(newContact.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      console.log('Adding new contact:', newContact);
      
      // Call the context method with proper error handling
      const result = await addContact(newContact.name, newContact.email);
      
      if (result) {
        setNewContact({ name: '', email: '' });
        // Refresh contacts list
        setContacts(getAllContacts());
        setSuccess('Contact added successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError('Failed to add contact. The contact may already exist.');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      setError('An error occurred while adding the contact. Please try again.');
    }
  };
  
  // Handle deleting a contact with confirmation
  const handleDeleteContact = async (contactId) => {
    if (!contactId) {
      setError('Invalid contact ID');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        console.log('Deleting contact:', contactId);
        
        const result = await deleteContact(contactId);
        
        if (result) {
          // Refresh contacts list
          setContacts(getAllContacts());
          setSuccess('Contact deleted successfully');
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccess('');
          }, 3000);
        } else {
          setError('Failed to delete contact');
        }
      } catch (error) {
        console.error('Error deleting contact:', error);
        setError('An error occurred while deleting the contact. Please try again.');
      }
    }
  };
  
  // Filter contacts by search query (case-insensitive)
  const filteredContacts = contacts
    .filter(contact => {
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        (contact.name && contact.name.toLowerCase().includes(query)) ||
        (contact.email && contact.email.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || '')); // Sort alphabetically by name
  
  // Loading state
  if (loading) {
    return <div className="loading">Loading contacts...</div>;
  }
  
  return (
    <div className="split-contacts-container">
      <div className="split-contacts-header">
        <h1>Split Expense Contacts</h1>
        <Link to="/split" className="back-to-splits-btn">
          Back to Split Expenses
        </Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="add-contact-section">
        <h2>Add New Contact</h2>
        <form onSubmit={handleAddContact} className="add-contact-form">
          <div className="form-group">
            <label htmlFor="contactName">Name*</label>
            <input
              type="text"
              id="contactName"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              placeholder="Contact name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="contactEmail">Email</label>
            <input
              type="email"
              id="contactEmail"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              placeholder="Contact email (optional)"
            />
          </div>
          
          <button type="submit" className="add-contact-btn">
            Add Contact
          </button>
        </form>
      </div>
      
      <div className="contacts-list-section">
        <div className="contacts-header">
          <h2>Your Contacts ({filteredContacts.length})</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {filteredContacts.length === 0 ? (
          <div className="no-contacts-message">
            {searchQuery ? 
              <p>No contacts found matching your search.</p> : 
              <p>No contacts found. Add your first contact above.</p>
            }
          </div>
        ) : (
          <div className="contacts-grid">
            {filteredContacts.map(contact => (
              <div className="contact-card" key={contact.id}>
                <div className="contact-avatar">
                  {contact.name ? contact.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="contact-info">
                  <h3 className="contact-name">{contact.name || 'Unnamed Contact'}</h3>
                  <p className="contact-email">{contact.email || 'No email provided'}</p>
                </div>
                <button
                  className="delete-contact-btn"
                  onClick={() => handleDeleteContact(contact.id)}
                  aria-label={`Delete ${contact.name}`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitContacts;