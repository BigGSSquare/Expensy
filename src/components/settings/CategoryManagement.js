// src/components/settings/CategoryManagement.js
import React, { useState, useContext } from 'react';
import { ExpenseContext } from '../../context/ExpenseContext';
import './CategoryManagement.css';

const CategoryManagement = () => {
  const { 
    expenses, incomes,
    expenseCategories, incomeCategories,
    addExpenseCategory, deleteExpenseCategory, editExpenseCategory,
    addIncomeCategory, deleteIncomeCategory, editIncomeCategory
  } = useContext(ExpenseContext);
  
  const [activeTab, setActiveTab] = useState('expenses');
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const handleAddCategory = async () => {
    setError('');
    setSuccess('');
    
    // Add debug info
    console.log("Current active tab:", activeTab);
    console.log("Current expense categories:", expenseCategories);
    console.log("Current income categories:", incomeCategories);
    console.log("New category being added:", newCategory);
    
    // Validation
    if (!newCategory.trim()) {
      setError('Category name cannot be empty');
      return;
    }
    
    try {
      let result = false;
      if (activeTab === 'expenses') {
        console.log("Attempting to add expense category:", newCategory.trim());
        
        if (expenseCategories.includes(newCategory.trim())) {
          setError('This category already exists');
          console.log("Category already exists in expense categories");
          return;
        }
        
        console.log("Calling addExpenseCategory function...");
        result = await addExpenseCategory(newCategory.trim());
        console.log("Result from addExpenseCategory:", result);
      } else {
        // Income category code (seems to be working)
        if (incomeCategories.includes(newCategory.trim())) {
          setError('This category already exists');
          return;
        }
        result = await addIncomeCategory(newCategory.trim());
      }
      
      if (result) {
        setNewCategory('');
        setSuccess(`${activeTab === 'expenses' ? 'Expense' : 'Income'} category added successfully`);
        
        // Log updated categories after successful addition
        if (activeTab === 'expenses') {
          console.log("Updated expense categories should be:", [...expenseCategories, newCategory.trim()]);
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError('Failed to add category');
        console.error(`Failed to add ${activeTab} category:`, newCategory.trim());
      }
    } catch (error) {
      console.error(`Error adding ${activeTab} category:`, error);
      setError(`Failed to add category: ${error.message || 'Unknown error'}`);
    }
  };
  
  const handleDeleteCategory = (category) => {
    setError('');
    setSuccess('');
    
    // Check if category is in use
    let isCategoryInUse = false;
    
    if (activeTab === 'expenses') {
      isCategoryInUse = expenses.some(expense => expense.category === category);
      
      if (isCategoryInUse) {
        setError(`Cannot delete "${category}" because it's used in existing expenses`);
        return;
      }
      
      // Prevent deleting the "Other" category as it's a fallback
      if (category === 'Other') {
        setError('The "Other" category cannot be deleted as it serves as a fallback');
        return;
      }
    } else {
      isCategoryInUse = incomes.some(income => income.source === category);
      
      if (isCategoryInUse) {
        setError(`Cannot delete "${category}" because it's used in existing income entries`);
        return;
      }
      
      // Prevent deleting the "Other" category as it's a fallback
      if (category === 'Other') {
        setError('The "Other" category cannot be deleted as it serves as a fallback');
        return;
      }
    }
    
    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete the "${category}" category?`)) {
      let result = false;
      
      if (activeTab === 'expenses') {
        result = deleteExpenseCategory(category);
      } else {
        result = deleteIncomeCategory(category);
      }
      
      if (result) {
        setSuccess('Category deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setError('Failed to delete category');
      }
    }
  };
  
  const handleEditCategory = (oldCategory) => {
    setError('');
    setSuccess('');
    
    // Check if category is in use
    let isCategoryInUse = false;
    
    if (activeTab === 'expenses') {
      isCategoryInUse = expenses.some(expense => expense.category === oldCategory);
      
      if (isCategoryInUse) {
        setError(`Cannot edit "${oldCategory}" because it's used in existing expenses`);
        return;
      }
      
      // Prevent editing the "Other" category
      if (oldCategory === 'Other') {
        setError('The "Other" category cannot be edited as it serves as a fallback');
        return;
      }
    } else {
      isCategoryInUse = incomes.some(income => income.source === oldCategory);
      
      if (isCategoryInUse) {
        setError(`Cannot edit "${oldCategory}" because it's used in existing income entries`);
        return;
      }
      
      // Prevent editing the "Other" category
      if (oldCategory === 'Other') {
        setError('The "Other" category cannot be edited as it serves as a fallback');
        return;
      }
    }
    
    // Prompt for new name
    const newName = prompt(`Enter new name for "${oldCategory}":`, oldCategory);
    
    if (!newName || newName.trim() === '') {
      return; // User cancelled or entered empty name
    }
    
    if (activeTab === 'expenses') {
      if (expenseCategories.includes(newName.trim()) && newName.trim() !== oldCategory) {
        setError('A category with this name already exists');
        return;
      }
      
      const result = editExpenseCategory(oldCategory, newName.trim());
      
      if (result) {
        setSuccess('Category updated successfully');
      } else {
        setError('Failed to update category');
      }
    } else {
      if (incomeCategories.includes(newName.trim()) && newName.trim() !== oldCategory) {
        setError('A category with this name already exists');
        return;
      }
      
      const result = editIncomeCategory(oldCategory, newName.trim());
      
      if (result) {
        setSuccess('Category updated successfully');
      } else {
        setError('Failed to update category');
      }
    }
    
    // Clear success message after 3 seconds
    if (success) {
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    }
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setNewCategory('');
    setError('');
    setSuccess('');
  };
  
  const currentCategories = activeTab === 'expenses' ? expenseCategories : incomeCategories;
  
  return (
    <div className="category-management">
      <h2>Manage Categories</h2>
      <p className="category-description">
        Customize your {activeTab === 'expenses' ? 'expense' : 'income'} categories to better organize your finances.
      </p>
      
      <div className="category-tabs">
        <button 
          className={`category-tab ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => handleTabChange('expenses')}
        >
          Expense Categories
        </button>
        <button 
          className={`category-tab ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => handleTabChange('income')}
        >
          Income Categories
        </button>
      </div>
      
      {error && <div className="category-error">{error}</div>}
      {success && <div className="category-success">{success}</div>}
      
      <div className="add-category">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder={`New ${activeTab === 'expenses' ? 'expense' : 'income'} category name`}
        />
        <button onClick={handleAddCategory}>Add Category</button>
      </div>
      
      <div className="categories-list">
        <h3>Your {activeTab === 'expenses' ? 'Expense' : 'Income'} Categories</h3>
        {currentCategories.length > 0 ? (
          currentCategories.map(category => (
            <div key={category} className="category-item">
              <span className="category-name">{category}</span>
              <div className="category-actions">
                <button 
                  className="edit-category"
                  onClick={() => handleEditCategory(category)}
                  disabled={category === 'Other'}
                >
                  Edit
                </button>
                <button 
                  className="delete-category"
                  onClick={() => handleDeleteCategory(category)}
                  disabled={category === 'Other'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-categories">No categories found.</p>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;