import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExpenseContext } from '../context/ExpenseContext';
import './TransactionHistory.css';

const TransactionHistory = () => {
  const { expenses, deleteExpense, incomes, deleteIncome } = useContext(ExpenseContext);
  const [activeTab, setActiveTab] = useState('expenses');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Make sure we have valid data
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeIncomes = Array.isArray(incomes) ? incomes : [];
  
  const expenseCategories = [
    'Food', 'Housing', 'Transportation', 'Entertainment', 
    'Utilities', 'Healthcare', 'Shopping', 'Personal Care', 'Education', 'Other'
  ];
  
  const incomeSources = [
    'Salary', 'Freelance', 'Investment', 'Gift', 
    'Business', 'Side Hustle', 'Rental', 'Other'
  ];
  
  // Handle delete with confirmation
  const handleDelete = (id, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      if (type === 'expense') {
        deleteExpense(id);
      } else {
        deleteIncome(id);
      }
    }
  };
  
  const filteredExpenses = safeExpenses
    .filter(expense => 
      (expense.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (expense.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .filter(expense => 
      filterCategory ? expense.category === filterCategory : true
    )
    .sort((a, b) => {
      // Safe sorting with validation
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });
  
  const filteredIncomes = safeIncomes
    .filter(income => 
      (income.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (income.source?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .filter(income => 
      filterCategory ? income.source === filterCategory : true
    )
    .sort((a, b) => {
      // Safe sorting with validation
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });
  
  // Format currency values safely
  const formatCurrency = (value) => {
    const amount = parseFloat(value);
    return isNaN(amount) ? '$0.00' : `$${amount.toFixed(2)}`;
  };
  
  return (
    <div className="transaction-history">
      <h1>Transaction History</h1>
      
      <div className="action-buttons">
        <Link to="/add" className="add-btn expense-btn">Add Expense</Link>
        <Link to="/add-income" className="add-btn income-btn">Add Income</Link>
        <Link to="/export" className="add-btn export-btn">Export Data</Link>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          Expenses
        </button>
        <button 
          className={`tab ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveTab('income')}
        >
          Income
        </button>
      </div>
      
      <div className="filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="category-filter">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">{activeTab === 'expenses' ? 'All Categories' : 'All Sources'}</option>
            {(activeTab === 'expenses' ? expenseCategories : incomeSources).map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
      
      {activeTab === 'expenses' && (
        filteredExpenses.length > 0 ? (
          <table className="transactions-table expenses-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => (
                <tr key={expense.id}>
                  <td>{expense.date || 'N/A'}</td>
                  <td>{expense.category || 'Uncategorized'}</td>
                  <td>{expense.description || '-'}</td>
                  <td className="amount">{formatCurrency(expense.amount)}</td>
                  <td>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(expense.id, 'expense')}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-results">No expenses found.</p>
        )
      )}
      
      {activeTab === 'income' && (
        filteredIncomes.length > 0 ? (
          <table className="transactions-table income-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncomes.map(income => (
                <tr key={income.id}>
                  <td>{income.date || 'N/A'}</td>
                  <td>{income.source || 'Uncategorized'}</td>
                  <td>{income.description || '-'}</td>
                  <td className="amount income-amount">{formatCurrency(income.amount)}</td>
                  <td>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(income.id, 'income')}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-results">No income entries found.</p>
        )
      )}
      
      <div className="export-section">
        <p>Want to analyze your financial data in detail? <Link to="/export">Export all your data</Link> to Excel.</p>
      </div>
    </div>
  );
};

export default TransactionHistory;