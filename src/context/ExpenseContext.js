// src/context/ExpenseContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { sendBudgetAlertEmail } from '../services/EmailService';
import { scanReceiptImage, parseReceiptData } from '../services/ReceiptScanningService';
// Add Firebase imports
import { db, storage } from '../config/firebase';
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
  setDoc,
  limit 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailStatus, setEmailStatus] = useState({ sent: false, error: null });
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);
  // Add new state for receipt scanning
  const [receiptScanStatus, setReceiptScanStatus] = useState({ 
    scanning: false, 
    error: null, 
    data: null 
  });
  // Track receipt scan history
  const [receiptScans, setReceiptScans] = useState([]);
  
  const { currentUser } = useContext(AuthContext);
  
  // Default categories if none are found
  const DEFAULT_EXPENSE_CATEGORIES = [
    'Food', 'Housing', 'Transportation', 'Entertainment', 
    'Utilities', 'Healthcare', 'Shopping', 'Personal Care', 'Education', 'Other'
  ];
  
  const DEFAULT_INCOME_CATEGORIES = [
    'Salary', 'Freelance', 'Investment', 'Gift', 
    'Business', 'Side Hustle', 'Rental', 'Other'
  ];
  
  // Load expenses from Firestore
  useEffect(() => {
    if (!currentUser) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Query Firestore for expenses
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('userId', '==', currentUser.uid)
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(expensesQuery, (snapshot) => {
      const expensesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExpenses(expensesList);
      setLoading(false);
    }, (error) => {
      console.error("Error getting expenses:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Load incomes from Firestore
  useEffect(() => {
    if (!currentUser) {
      setIncomes([]);
      return;
    }
    
    // Query Firestore for incomes
    const incomesQuery = query(
      collection(db, 'incomes'),
      where('userId', '==', currentUser.uid)
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(incomesQuery, (snapshot) => {
      const incomesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setIncomes(incomesList);
    }, (error) => {
      console.error("Error getting incomes:", error);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Clear email status after some time
  useEffect(() => {
    if (emailStatus.sent || emailStatus.error) {
      const timer = setTimeout(() => {
        setEmailStatus({ sent: false, error: null });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [emailStatus]);
  
  // Clear receipt scan data after processing
  useEffect(() => {
    if (receiptScanStatus.data && !receiptScanStatus.scanning) {
      const timer = setTimeout(() => {
        setReceiptScanStatus(prevState => ({
          ...prevState, 
          data: null
        }));
      }, 30000); // Give user 30 seconds to review before clearing
      
      return () => clearTimeout(timer);
    }
  }, [receiptScanStatus]);
  
  // Add a new expense with validation
  // Updated addExpense function for ExpenseContext.js
  // Fix in ExpenseContext.js
  const addExpense = async (expense) => {
    if (!currentUser) {
      console.error('Cannot add expense: No authenticated user');
      return false;
    }
    
    try {
      // Ensure expense has all required fields
      const newExpense = {
        category: expense.category || 'Other',
        amount: parseFloat(expense.amount) || 0,
        date: expense.date || new Date().toISOString().slice(0, 10),
        description: expense.description || '',
        userId: currentUser.uid, // Make sure this is always set
        createdAt: new Date().toISOString(),
        // Additional fields
        isSplit: expense.isSplit || false,
        userShare: expense.userShare || parseFloat(expense.amount) || 0,
      };
      
      // Log for debugging
      console.log('Adding expense to Firestore:', newExpense);
      
      // Add to Firestore with error handling
      try {
        const docRef = await addDoc(collection(db, 'expenses'), newExpense);
        console.log('Expense added with ID:', docRef.id);
        await checkBudgetAlerts(newExpense);
        return docRef.id;
      } catch (firestoreError) {
        console.error('Firestore error adding expense:', firestoreError);
        return false;
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      return false;
    }
  };

  // In ExpenseContext.js - scanReceipt function

  const scanReceipt = async (imageFile) => {
    if (!currentUser) {
      setReceiptScanStatus({
        scanning: false,
        error: 'User not logged in',
        data: null
      });
      return { success: false, error: 'User not logged in' };
    }
    
    if (!imageFile) {
      setReceiptScanStatus({
        scanning: false,
        error: 'No image provided',
        data: null
      });
      return { success: false, error: 'No image provided' };
    }
    
    try {
      // Set scanning status first
      setReceiptScanStatus({
        scanning: true,
        error: null,
        data: null
      });
      
      console.log('Processing receipt image:', imageFile.name);
      
      // Call the receipt scanning service
      // This service simulates server-side OCR processing
      const result = await scanReceiptImage(imageFile);
      
      if (result.success) {
        // For consistency with your original code
        const extractedData = parseReceiptData(result);
        
        // Update receipt scan status with extracted data
        setReceiptScanStatus({
          scanning: false,
          error: null,
          data: {
            amount: extractedData.amount.toString(),
            description: extractedData.description,
            category: extractedData.category,
            date: extractedData.date,
            fromReceipt: true,
            receiptImageUrl: result.imageUrl,
            notes: `Scanned receipt from ${extractedData.description}`
          }
        });
        
        return {
          success: true,
          data: extractedData
        };
      } else {
        // Scanning failed
        setReceiptScanStatus({
          scanning: false,
          error: result.error || 'Receipt scanning failed',
          data: null
        });
        
        return {
          success: false,
          error: result.error || 'Receipt scanning failed'
        };
      }
    } catch (error) {
      console.error('Error in receipt scanning:', error);
      
      setReceiptScanStatus({
        scanning: false,
        error: error.message || 'Error processing receipt',
        data: null
      });
      
      return {
        success: false,
        error: error.message || 'Error processing receipt'
      };
    }
  };
  
  // Function to add the expense from a scanned receipt
  const addExpenseFromReceipt = async (expenseData, modifications = {}) => {
    if (!currentUser) return false;
    
    try {
      // Combine scanned data with any user modifications
      const finalExpenseData = {
        ...expenseData,
        ...modifications,
        fromReceipt: true
      };
      
      // Use the existing addExpense function
      const result = await addExpense(finalExpenseData);
      
      if (result && finalExpenseData.receiptScanId) {
        // Update the scan record status in Firestore
        const scanRef = doc(db, 'receiptScans', String(finalExpenseData.receiptScanId));
        await updateDoc(scanRef, { status: 'applied' });
        
        // Clear the scanned data after successful addition
        setReceiptScanStatus(prevState => ({
          ...prevState,
          data: null
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error adding expense from receipt:', error);
      return false;
    }
  };
  
  // Function to reject a scanned receipt
  const rejectScannedReceipt = async (scanId) => {
    if (!scanId) return false;
    
    try {
      // Update the scan record status in Firestore
      const scanRef = doc(db, 'receiptScans', String(scanId));
      await updateDoc(scanRef, { status: 'rejected' });
      
      // Clear any pending scan data with this ID
      if (receiptScanStatus.data?.receiptScanId === scanId) {
        setReceiptScanStatus({
          scanning: false,
          error: null,
          data: null
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error rejecting scanned receipt:', error);
      return false;
    }
  };
  
  // Helper function to map vendor names to appropriate categories
  const mapVendorToCategory = (vendorName) => {
    const vendorNameLower = vendorName.toLowerCase();
    
    // Simple mapping logic - can be expanded based on common vendors
    if (!vendorName) return 'Other';
    
    const categoryMappings = {
      'restaurant': 'Food',
      'café': 'Food',
      'cafe': 'Food',
      'grocery': 'Food',
      'supermarket': 'Food',
      'market': 'Food',
      'gas': 'Transportation',
      'fuel': 'Transportation',
      'uber': 'Transportation',
      'lyft': 'Transportation',
      'taxi': 'Transportation',
      'pharmacy': 'Healthcare',
      'drug': 'Healthcare',
      'doctor': 'Healthcare',
      'clinic': 'Healthcare',
      'hospital': 'Healthcare',
      'rent': 'Housing',
      'mortgage': 'Housing',
      'netflix': 'Entertainment',
      'spotify': 'Entertainment',
      'cinema': 'Entertainment',
      'movie': 'Entertainment',
      'theater': 'Entertainment',
      'amazon': 'Shopping',
      'walmart': 'Shopping',
      'target': 'Shopping',
      'utility': 'Utilities',
      'electric': 'Utilities',
      'water': 'Utilities',
      'gas bill': 'Utilities',
      'phone': 'Utilities',
      'internet': 'Utilities',
      'school': 'Education',
      'college': 'Education',
      'university': 'Education',
      'tuition': 'Education',
      'book': 'Education',
      'haircut': 'Personal Care',
      'salon': 'Personal Care',
      'spa': 'Personal Care',
      'gym': 'Personal Care'
    };
    
    for (const [keyword, category] of Object.entries(categoryMappings)) {
      if (vendorNameLower.includes(keyword)) {
        return category;
      }
    }
    
    return 'Other';
  };
  
  // Add a new income with validation
  const addIncome = async (income) => {
    if (!currentUser) {
      console.error('Cannot add income: No authenticated user');
      return false;
    }
    
    try {
      // Log for debugging
      console.log('Adding income with data:', income);
      
      // Validate income data
      if (!income.source) {
        console.error('Missing source in income');
        return false;
      }
      
      const amount = parseFloat(income.amount);
      if (isNaN(amount) || amount <= 0) {
        console.error('Invalid income amount:', income.amount);
        return false;
      }
      
      // Create new income object
      const newIncome = {
        source: income.source,
        amount: amount,
        date: income.date || new Date().toISOString().slice(0, 10),
        description: income.description || '',
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      };
      
      console.log('Prepared income object for Firestore:', newIncome);
      
      // Add to Firestore with explicit error handling
      try {
        const docRef = await addDoc(collection(db, 'incomes'), newIncome);
        console.log('Income added successfully with ID:', docRef.id);
        return docRef.id;
      } catch (firestoreError) {
        console.error('Firestore error adding income:', firestoreError);
        throw firestoreError; // Rethrow to be caught by outer try/catch
      }
    } catch (error) {
      console.error('Error adding income:', error);
      return false;
    }
  };
  
  // Delete an expense
  const deleteExpense = async (id) => {
    if (!currentUser || !id) return false;
    
    try {
      // Get the expense before deleting it (to check for receipt info)
      const expenseRef = doc(db, 'expenses', id);
      const expenseSnap = await getDoc(expenseRef);
      
      if (expenseSnap.exists()) {
        const expenseData = expenseSnap.data();
        
        // Delete the expense document
        await deleteDoc(expenseRef);
        
        // If this was a receipt-based expense, update the scan record
        if (expenseData.receiptScanId) {
          const scanRef = doc(db, 'receiptScans', String(expenseData.receiptScanId));
          const scanSnap = await getDoc(scanRef);
          
          if (scanSnap.exists()) {
            await updateDoc(scanRef, { status: 'rejected' });
          }
        }
      } else {
        // Document not found
        console.error('Expense not found');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  };
  
  // Delete an income
  const deleteIncome = async (id) => {
    if (!currentUser || !id) return false;
    
    try {
      await deleteDoc(doc(db, 'incomes', id));
      return true;
    } catch (error) {
      console.error('Error deleting income:', error);
      return false;
    }
  };
  
  // Update budget settings
  const updateBudget = async (category, amount) => {
    if (!currentUser || !category || category.trim() === '') {
      console.error('Budget update failed: Missing user or category');
      return false;
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      console.error('Budget update failed: Invalid amount');
      return false;
    }
    
    try {
      console.log(`Updating budget for ${category} to $${parsedAmount}`);
      
      // Create reference to the budgets document
      const budgetRef = doc(db, 'users', currentUser.uid, 'settings', 'budgets');
      
      // Check if the document exists
      const budgetDoc = await getDoc(budgetRef);
      
      if (budgetDoc.exists()) {
        console.log('Budget document exists, updating');
        // Use updateDoc for existing documents
        await updateDoc(budgetRef, {
          [category]: parsedAmount
        });
      } else {
        console.log('Budget document does not exist, creating new');
        // Use setDoc for new documents
        await setDoc(budgetRef, {
          [category]: parsedAmount
        });
      }
      
      // Update local state
      console.log('Updating local budget state');
      setBudgets(prevBudgets => ({
        ...prevBudgets,
        [category]: parsedAmount
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating budget:', error);
      console.error('Error details:', error.code, error.message);
      return false;
    }
  };
  
  // Delete a budget
  const deleteBudget = async (category) => {
    if (!currentUser || !category) return false;
    
    try {
      const budgetRef = doc(db, 'users', currentUser.uid, 'settings', 'budgets');
      const budgetDoc = await getDoc(budgetRef);
      
      if (budgetDoc.exists()) {
        const currentBudgets = budgetDoc.data();
        
        // Remove the category from the budgets
        if (currentBudgets[category] !== undefined) {
          delete currentBudgets[category];
          
          // Update Firestore
          await setDoc(budgetRef, currentBudgets);
          
          // Update local state
          setBudgets(currentBudgets);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting budget:', error);
      return false;
    }
  };
  
  // Check if adding this expense exceeds the budget
  const checkBudgetAlerts = async (newExpense, allExpenses = expenses) => {
    if (!currentUser) {
      console.log('No user logged in, skipping budget check');
      return;
    } 
    if (!newExpense || !newExpense.category) {
      console.log('No expense or category provided, skipping budget check');
      return;
    }
    
    const { category } = newExpense;
    console.log(`Checking budget alert for category: ${category}`);
    
    // Include the new expense in the calculation
    const newExpenseAmount = parseFloat(newExpense.amount) || 0;
    
    // Get budgets from Firestore
    try {
      // Get budget data from Firestore
      const budgetRef = doc(db, 'users', currentUser.uid, 'settings', 'budgets');
      const budgetDoc = await getDoc(budgetRef);
      
      if (!budgetDoc.exists()) {
        console.log('No budgets found for user, skipping alert check');
        return;
      }
      
      const budgets = budgetDoc.data();
      console.log('Retrieved budget data:', budgets);
      
      // Check if there's a budget for this category
      if (budgets[category]) {
        console.log(`Found budget for ${category}: $${budgets[category]}`);
        
        // Get current month expenses for this category
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Filter expenses for current month and category
        const monthlyExpenses = allExpenses.filter(expense => {
          if (!expense.date) return false;
          
          try {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                  expenseDate.getFullYear() === currentYear &&
                  expense.category === category &&
                  expense.userId === currentUser.uid;
          } catch (e) {
            console.error('Invalid date format:', expense.date);
            return false;
          }
        });
        
        // Calculate total spent including current expense
        let totalSpent = monthlyExpenses.reduce((sum, expense) => {
          const amount = parseFloat(expense.amount);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
        // Add the new expense amount if it's not already included
        if (newExpense.id === undefined) {
          totalSpent += newExpenseAmount;
        }
        
        const budgetAmount = parseFloat(budgets[category]);
        
        console.log(`Category: ${category}, Budget: $${budgetAmount}, Spent: $${totalSpent}`);
        
        if (!isNaN(budgetAmount) && totalSpent > budgetAmount) {
          console.log(`Budget exceeded for ${category}. Creating alert and sending email.`);
          
          // Create new alert
          const newAlert = {
            message: `Budget alert: You've exceeded your ${category} budget of $${budgetAmount.toFixed(2)}`,
            category: category,
            read: false,
            date: new Date().toISOString(),
            userId: currentUser.uid,
            amountSpent: totalSpent,
            budgetAmount: budgetAmount,
            overAmount: totalSpent - budgetAmount
          };
          
          try {
            // Add to Firestore
            const alertRef = await addDoc(collection(db, 'alerts'), newAlert);
            console.log('Alert created with ID:', alertRef.id);
            
            // Send email alert if user has enabled email notifications
            if (currentUser?.preferences?.emailNotifications !== false) {
              if (currentUser.email) {
                console.log(`Sending budget alert email to ${currentUser.email}`);
                try {
                  const result = await sendBudgetAlertEmail(
                    currentUser,
                    category,
                    budgetAmount,
                    totalSpent
                  );
                  
                  console.log('Email result:', result);
                  
                  setEmailStatus({ 
                    sent: result.success, 
                    error: result.success ? null : result.message 
                  });
                } catch (emailError) {
                  console.error('Error sending email:', emailError);
                  setEmailStatus({ 
                    sent: false, 
                    error: emailError.message || 'Error sending email'
                  });
                }
              } else {
                console.log('No email address found for user');
                setEmailStatus({ 
                  sent: false, 
                  error: "No email address found for user"
                });
              }
            } else {
              console.log('Email notifications disabled for user');
            }
          } catch (alertError) {
            console.error('Error creating alert:', alertError);
          }
        } else {
          console.log(`Budget not exceeded for ${category}. No alert needed.`);
        }
      } else {
        console.log(`No budget set for category: ${category}`);
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error);
      console.error('Error details:', error.code, error.message);
    }
  };
  
  // Mark an alert as read
  const markAlertAsRead = async (id) => {
    if (!currentUser || !id) return false;
    
    try {
      const alertRef = doc(db, 'alerts', id);
      await updateDoc(alertRef, { read: true });
      return true;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      return false;
    }
  };
  
  // Delete an alert
  const deleteAlert = async (id) => {
    if (!currentUser || !id) return false;
    
    try {
      await deleteDoc(doc(db, 'alerts', id));
      return true;
    } catch (error) {
      console.error('Error deleting alert:', error);
      return false;
    }
  };
  
  // Add a new expense category
  const addExpenseCategory = async (category) => {
    console.log("addExpenseCategory called with:", category);
    
    if (!currentUser || !category || category.trim() === '') {
      console.log("Invalid inputs for addExpenseCategory");
      return false;
    }
    
    try {
      const categoriesRef = doc(db, 'users', currentUser.uid, 'settings', 'expenseCategories');
      console.log("Firestore reference path:", categoriesRef.path);
      
      const categoriesDoc = await getDoc(categoriesRef);
      console.log("Document exists:", categoriesDoc.exists());
      
      let updatedCategories;
      
      if (categoriesDoc.exists()) {
        const currentCategories = categoriesDoc.data().categories || [];
        console.log("Current categories:", currentCategories);
        
        // Check if category already exists
        if (currentCategories.includes(category)) {
          console.log("Category already exists");
          return false;
        }
        
        updatedCategories = [...currentCategories, category];
      } else {
        console.log("Creating new document with default categories");
        updatedCategories = [...DEFAULT_EXPENSE_CATEGORIES, category];
      }
      
      console.log("Updating Firestore with:", updatedCategories);
      
      // Update Firestore
      await setDoc(categoriesRef, { categories: updatedCategories });
      
      // Update local state
      console.log("Updating local state");
      setExpenseCategories(updatedCategories);
      
      console.log("Category added successfully");
      return true;
    } catch (error) {
      console.error('Error adding expense category:', error);
      return false;
    }
  };
  
  // Delete an expense category
  const deleteExpenseCategory = async (category) => {
    if (!currentUser || !category) return false;
    
    try {
      // Don't delete if there are expenses using this category
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', currentUser.uid),
        where('category', '==', category),
        limit(1)
      );
      
      const expensesSnap = await getDocs(expensesQuery);
      
      if (!expensesSnap.empty) {
        return { success: false, reason: 'Category in use by existing expenses' };
      }
      
      // Get current categories
      const categoriesRef = doc(db, 'users', currentUser.uid, 'settings', 'expenseCategories');
      const categoriesDoc = await getDoc(categoriesRef);
      
      if (categoriesDoc.exists()) {
        const currentCategories = categoriesDoc.data().categories || [];
        const updatedCategories = currentCategories.filter(cat => cat !== category);
        
        // Update Firestore
        await setDoc(categoriesRef, { categories: updatedCategories });
        
        // Update local state
        setExpenseCategories(updatedCategories);
      }
      
      // Also remove any budgets for this category
      const budgetRef = doc(db, 'users', currentUser.uid, 'settings', 'budgets');
      const budgetDoc = await getDoc(budgetRef);
      
      if (budgetDoc.exists()) {
        const currentBudgets = budgetDoc.data();
        
        if (currentBudgets[category] !== undefined) {
          delete currentBudgets[category];
          
          // Update Firestore
          await setDoc(budgetRef, currentBudgets);
          
          // Update local state
          setBudgets(currentBudgets);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting expense category:', error);
      return { success: false, reason: error.message };
    }
  };
  
  // Edit an expense category
  const editExpenseCategory = async (oldCategory, newCategory) => {
    if (!currentUser || !oldCategory || !newCategory || newCategory.trim() === '') return false;
    
    try {
      // Don't allow editing the "Other" category
      if (oldCategory === 'Other') return false;
      
      // Get current categories
      const categoriesRef = doc(db, 'users', currentUser.uid, 'settings', 'expenseCategories');
      const categoriesDoc = await getDoc(categoriesRef);
      
      if (!categoriesDoc.exists()) return false;
      
      const currentCategories = categoriesDoc.data().categories || [];
      
      // Check if the new category name already exists
      if (currentCategories.includes(newCategory) && newCategory !== oldCategory) return false;
      
      // Check if the category is in use
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', currentUser.uid),
        where('category', '==', oldCategory),
        limit(1)
      );
      
      const expensesSnap = await getDocs(expensesQuery);
      
      if (!expensesSnap.empty) return false;
      
      // Update categories
      const updatedCategories = currentCategories.map(cat => 
        cat === oldCategory ? newCategory : cat
      );
      
      // Update Firestore
      await setDoc(categoriesRef, { categories: updatedCategories });
      
      // Update local state
      setExpenseCategories(updatedCategories);
      
      // Update any budget for this category
      const budgetRef = doc(db, 'users', currentUser.uid, 'settings', 'budgets');
      const budgetDoc = await getDoc(budgetRef);
      
      if (budgetDoc.exists()) {
        const currentBudgets = budgetDoc.data();
        
        if (currentBudgets[oldCategory] !== undefined) {
          const budgetAmount = currentBudgets[oldCategory];
          delete currentBudgets[oldCategory];
          currentBudgets[newCategory] = budgetAmount;
          
          // Update Firestore
          await setDoc(budgetRef, currentBudgets);
          
          // Update local state
          setBudgets(currentBudgets);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error editing expense category:', error);
      return false;
    }
  };
  
  // Add a new income category
  const addIncomeCategory = async (category) => {
    if (!currentUser || !category || category.trim() === '') return false;
    
    try {
      const categoriesRef = doc(db, 'users', currentUser.uid, 'settings', 'incomeCategories');
      const categoriesDoc = await getDoc(categoriesRef);
      
      let updatedCategories;
      
      if (categoriesDoc.exists()) {
        const currentCategories = categoriesDoc.data().categories || [];
        
        // Check if category already exists
        if (currentCategories.includes(category)) {
          return false;
        }
        
        updatedCategories = [...currentCategories, category];
      } else {
        updatedCategories = [...DEFAULT_INCOME_CATEGORIES, category];
      }
      
      // Update Firestore
      await setDoc(categoriesRef, { categories: updatedCategories });
      
      // Update local state
      setIncomeCategories(updatedCategories);
      return true;
    } catch (error) {
      console.error('Error adding income category:', error);
      return false;
    }
  };
  
  // Delete an income category
  const deleteIncomeCategory = async (category) => {
    if (!currentUser || !category) return false;
    
    try {
      // Don't delete if there are incomes using this category
      const incomesQuery = query(
        collection(db, 'incomes'),
        where('userId', '==', currentUser.uid),
        where('source', '==', category),
        limit(1)
      );
      
      const incomesSnap = await getDocs(incomesQuery);
      
      if (!incomesSnap.empty) {
        return { success: false, reason: 'Category in use by existing incomes' };
      }
      
      // Get current categories
      const categoriesRef = doc(db, 'users', currentUser.uid, 'settings', 'incomeCategories');
      const categoriesDoc = await getDoc(categoriesRef);
      
      if (categoriesDoc.exists()) {
        const currentCategories = categoriesDoc.data().categories || [];
        const updatedCategories = currentCategories.filter(cat => cat !== category);
        
        // Update Firestore
        await setDoc(categoriesRef, { categories: updatedCategories });
        
        // Update local state
        setIncomeCategories(updatedCategories);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting income category:', error);
      return { success: false, reason: error.message };
    }
  };
  
  // Edit an income category
  const editIncomeCategory = async (oldCategory, newCategory) => {
    if (!currentUser || !oldCategory || !newCategory || newCategory.trim() === '') return false;
    
    try {
      // Don't allow editing the "Other" category
      if (oldCategory === 'Other') return false;
      
      // Get current categories
      const categoriesRef = doc(db, 'users', currentUser.uid, 'settings', 'incomeCategories');
      const categoriesDoc = await getDoc(categoriesRef);
      
      if (!categoriesDoc.exists()) return false;
      
      const currentCategories = categoriesDoc.data().categories || [];
      
      // Check if the new category name already exists
      if (currentCategories.includes(newCategory) && newCategory !== oldCategory) return false;
      
      // Check if the category is in use
      const incomesQuery = query(
        collection(db, 'incomes'),
        where('userId', '==', currentUser.uid),
        where('source', '==', oldCategory),
        limit(1)
      );
      
      const incomesSnap = await getDocs(incomesQuery);
      
      if (!incomesSnap.empty) return false;
      
      // Update categories
      const updatedCategories = currentCategories.map(cat => 
        cat === oldCategory ? newCategory : cat
      );
      
      // Update Firestore
      await setDoc(categoriesRef, { categories: updatedCategories });
      
      // Update local state
      setIncomeCategories(updatedCategories);
      
      return true;
    } catch (error) {
      console.error('Error editing income category:', error);
      return false;
    }
  };
  
  // Get expenses for a specific month
  const getMonthlyExpenses = (month, year) => {
    if (!currentUser) return [];
    
    const targetDate = new Date(year, month);
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    
    return expenses.filter(expense => {
      if (!expense.date) return false;
      
      try {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === targetMonth && 
              expenseDate.getFullYear() === targetYear &&
              expense.userId === currentUser.uid;
      } catch (e) {
        return false;
      }
    });
  };
  
  // Get incomes for a specific month
  const getMonthlyIncomes = (month, year) => {
    if (!currentUser) return [];
    
    const targetDate = new Date(year, month);
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    
    return incomes.filter(income => {
      if (!income.date) return false;
      
      try {
        const incomeDate = new Date(income.date);
        return incomeDate.getMonth() === targetMonth && 
              incomeDate.getFullYear() === targetYear &&
              income.userId === currentUser.uid;
      } catch (e) {
        return false;
      }
    });
  };
  
  // Get historical receipt scans
  const getReceiptScans = async () => {
    if (!currentUser) return [];
    
    try {
      const scansQuery = query(
        collection(db, 'receiptScans'),
        where('userId', '==', currentUser.uid)
      );
      
      const scansSnap = await getDocs(scansQuery);
      
      return scansSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting receipt scans:', error);
      return [];
    }
  };
  
  // Update an existing expense
  const updateExpense = async (id, updatedData) => {
    if (!currentUser || !id) return false;
    
    try {
      const expenseRef = doc(db, 'expenses', id);
      await updateDoc(expenseRef, updatedData);
      return true;
    } catch (error) {
      console.error('Error updating expense:', error);
      return false;
    }
  };
  
  // Update an existing income
  const updateIncome = async (id, updatedData) => {
    if (!currentUser || !id) return false;
    
    try {
      const incomeRef = doc(db, 'incomes', id);
      await updateDoc(incomeRef, updatedData);
      return true;
    } catch (error) {
      console.error('Error updating income:', error);
      return false;
    }
  };
  
  // Export data for backups
  const exportData = async () => {
    if (!currentUser) return null;
    
    try {
      // Get all current user data
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', currentUser.uid)
      );
      
      const incomesQuery = query(
        collection(db, 'incomes'),
        where('userId', '==', currentUser.uid)
      );
      
      const scansQuery = query(
        collection(db, 'receiptScans'),
        where('userId', '==', currentUser.uid)
      );
      
      const [expensesSnap, incomesSnap, scansSnap, categoriesSnap, budgetsSnap] = await Promise.all([
        getDocs(expensesQuery),
        getDocs(incomesQuery),
        getDocs(scansQuery),
        getDoc(doc(db, 'users', currentUser.uid, 'settings', 'expenseCategories')),
        getDoc(doc(db, 'users', currentUser.uid, 'settings', 'budgets'))
      ]);
      
      const exportData = {
        expenses: expensesSnap.docs.map(doc => ({id: doc.id, ...doc.data()})),
        incomes: incomesSnap.docs.map(doc => ({id: doc.id, ...doc.data()})),
        receiptScans: scansSnap.docs.map(doc => ({id: doc.id, ...doc.data()})),
        expenseCategories: categoriesSnap.exists() ? categoriesSnap.data().categories : DEFAULT_EXPENSE_CATEGORIES,
        incomeCategories: incomeCategories,
        budgets: budgetsSnap.exists() ? budgetsSnap.data() : {},
        exportDate: new Date().toISOString(),
        userId: currentUser.uid
      };
      
      return exportData;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  };
  
  // Import data from backups
  const importData = async (data) => {
    if (!currentUser || !data) return false;
    
    try {
      // Validate data structure
      if (!data.expenses || !data.incomes || !data.budgets || 
          !data.expenseCategories || !data.incomeCategories) {
        console.error('Invalid import data structure');
        return false;
      }
      
      // Begin batch operations
      const batch = db.batch();
      
      // Update expense categories
      const expenseCategoriesRef = doc(db, 'users', currentUser.uid, 'settings', 'expenseCategories');
      batch.set(expenseCategoriesRef, { categories: data.expenseCategories });
      
      // Update income categories
      const incomeCategoriesRef = doc(db, 'users', currentUser.uid, 'settings', 'incomeCategories');
      batch.set(incomeCategoriesRef, { categories: data.incomeCategories });
      
      // Update budgets
      const budgetsRef = doc(db, 'users', currentUser.uid, 'settings', 'budgets');
      batch.set(budgetsRef, data.budgets);
      
      // Commit the batch
      await batch.commit();
      
      // Update local state
      setExpenseCategories(data.expenseCategories);
      setIncomeCategories(data.incomeCategories);
      setBudgets(data.budgets);
      
      // Handle expense and income imports separately (may be too many for a single batch)
      for (const expense of data.expenses) {
        try {
          const { id, ...expenseData } = expense;
          expenseData.userId = currentUser.uid; // Ensure correct user ID
          await addDoc(collection(db, 'expenses'), expenseData);
        } catch (e) {
          console.error('Error importing expense:', e);
          // Continue with other imports
        }
      }
      
      for (const income of data.incomes) {
        try {
          const { id, ...incomeData } = income;
          incomeData.userId = currentUser.uid; // Ensure correct user ID
          await addDoc(collection(db, 'incomes'), incomeData);
        } catch (e) {
          console.error('Error importing income:', e);
          // Continue with other imports
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  };
  
  // Get spending insights
  const getSpendingInsights = async (months = 3) => {
    if (!currentUser || months < 1) return null;
    
    try {
      const currentDate = new Date();
      const insights = {
        topCategories: [],
        monthlyTotals: [],
        yearlyComparison: {},
        receiptUsage: {
          total: 0,
          percentage: 0
        }
      };
      
      // Get relevant expenses from Firestore
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      
      // Format for Firestore query
      const startDateString = startDate.toISOString();
      
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', currentUser.uid),
        where('date', '>=', startDateString)
      );
      
      const expensesSnap = await getDocs(expensesQuery);
      
      const relevantExpenses = expensesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate top spending categories
      const categoryTotals = {};
      relevantExpenses.forEach(expense => {
        const { category, amount } = expense;
        if (!category) return;
        
        categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(amount || 0);
      });
      
      insights.topCategories = Object.entries(categoryTotals)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // Get top 5
      
      // Calculate monthly totals
      const monthlyData = {};
      relevantExpenses.forEach(expense => {
        if (!expense.date) return;
        
        const expenseDate = new Date(expense.date);
        const monthYear = `${expenseDate.getFullYear()}-${expenseDate.getMonth()+1}`;
        
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            month: expenseDate.getMonth(),
            year: expenseDate.getFullYear(),
            total: 0,
            label: expenseDate.toLocaleString('default', { month: 'short', year: 'numeric' })
          };
        }
        
        monthlyData[monthYear].total += parseFloat(expense.amount || 0);
      });
      
      insights.monthlyTotals = Object.values(monthlyData)
        .sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });
      
      // Calculate receipt usage statistics
      const receiptsCount = relevantExpenses.filter(expense => expense.fromReceipt).length;
      insights.receiptUsage = {
        total: receiptsCount,
        percentage: relevantExpenses.length > 0 
          ? (receiptsCount / relevantExpenses.length) * 100 
          : 0
      };
      
      return insights;
    } catch (error) {
      console.error('Error generating spending insights:', error);
      return null;
    }
  };
  
  // Load categories and other settings from Firestore
  useEffect(() => {
    if (!currentUser) {
      setExpenseCategories([]);
      setIncomeCategories([]);
      setBudgets({});
      return;
    }
    
    // Load categories and budgets
    const fetchSettings = async () => {
      try {
        // Get expense categories
        const expenseCategoriesRef = doc(db, 'users', currentUser.uid, 'settings', 'expenseCategories');
        const expenseCategoriesDoc = await getDoc(expenseCategoriesRef);
        
        if (expenseCategoriesDoc.exists()) {
          setExpenseCategories(expenseCategoriesDoc.data().categories || DEFAULT_EXPENSE_CATEGORIES);
        } else {
          // Create default categories if none exist
          await setDoc(expenseCategoriesRef, {
            categories: DEFAULT_EXPENSE_CATEGORIES
          });
          setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
        }
        
        // Get income categories
        const incomeCategoriesRef = doc(db, 'users', currentUser.uid, 'settings', 'incomeCategories');
        const incomeCategoriesDoc = await getDoc(incomeCategoriesRef);
        
        if (incomeCategoriesDoc.exists()) {
          setIncomeCategories(incomeCategoriesDoc.data().categories || DEFAULT_INCOME_CATEGORIES);
        } else {
          // Create default categories if none exist
          await setDoc(incomeCategoriesRef, {
            categories: DEFAULT_INCOME_CATEGORIES
          });
          setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
        }
        
        // Get budgets
        const budgetsRef = doc(db, 'users', currentUser.uid, 'settings', 'budgets');
        const budgetsDoc = await getDoc(budgetsRef);
        
        if (budgetsDoc.exists()) {
          setBudgets(budgetsDoc.data());
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
        setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
      }
    };
    
    fetchSettings();
  }, [currentUser]);
  
  // Load alerts from Firestore
  useEffect(() => {
    if (!currentUser) {
      setAlerts([]);
      return;
    }
    
    // Query Firestore for alerts
    const alertsQuery = query(
      collection(db, 'alerts'),
      where('userId', '==', currentUser.uid),
      where('read', '==', false)
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const alertsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlerts(alertsList);
    }, (error) => {
      console.error("Error getting alerts:", error);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Load receipt scans from Firestore
  useEffect(() => {
    if (!currentUser) {
      setReceiptScans([]);
      return;
    }
    
    // Query Firestore for receipt scans
    const scansQuery = query(
      collection(db, 'receiptScans'),
      where('userId', '==', currentUser.uid)
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(scansQuery, (snapshot) => {
      const scansList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReceiptScans(scansList);
    }, (error) => {
      console.error("Error getting receipt scans:", error);
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  return (
    <ExpenseContext.Provider value={{
      expenses,
      incomes,
      budgets,
      alerts,
      expenseCategories,
      incomeCategories,
      receiptScanStatus,
      receiptScans,
      emailStatus,
      loading,
      addExpense,
      addIncome,
      deleteExpense,
      deleteIncome,
      updateExpense,
      updateIncome,
      updateBudget,
      deleteBudget,
      markAlertAsRead,
      deleteAlert,
      addExpenseCategory,
      deleteExpenseCategory,
      editExpenseCategory,
      addIncomeCategory,
      deleteIncomeCategory,
      editIncomeCategory,
      scanReceipt,
      addExpenseFromReceipt,
      rejectScannedReceipt,
      getMonthlyExpenses,
      getMonthlyIncomes,
      getReceiptScans,
      exportData,
      importData,
      getSpendingInsights
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};