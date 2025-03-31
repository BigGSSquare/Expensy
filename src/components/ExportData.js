// src/components/ExportData.js
import React, { useState, useContext, useEffect } from 'react';
import { ExpenseContext } from '../context/ExpenseContext';
import { AuthContext } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import './ExportData.css';

const ExportData = () => {
  const { expenses, incomes, exportData } = useContext(ExpenseContext);
  const { currentUser } = useContext(AuthContext);
  const [exportType, setExportType] = useState('all'); // 'all', 'expenses', 'income'
  const [dateRange, setDateRange] = useState('all'); // 'all', 'month', 'year', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState('');

  // Handle export button click
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportSuccess(false);
      setExportError('');

      // Get filtered data based on date range
      const filteredData = getFilteredData();

      // Create workbook with appropriate sheets
      const workbook = XLSX.utils.book_new();
      
      // Add metadata sheet
      const metadataWs = XLSX.utils.json_to_sheet([
        { key: 'Exported By', value: currentUser?.name || currentUser?.email || 'User' },
        { key: 'Export Date', value: new Date().toLocaleString() },
        { key: 'Export Type', value: getExportTypeLabel() },
        { key: 'Date Range', value: getDateRangeLabel() }
      ]);
      XLSX.utils.book_append_sheet(workbook, metadataWs, 'Export Info');

      // Add expenses sheet if needed
      if (exportType === 'all' || exportType === 'expenses') {
        if (filteredData.expenses.length > 0) {
          // Format expense data for export
          const formattedExpenses = filteredData.expenses.map(expense => ({
            'Date': formatDate(expense.date),
            'Category': expense.category || 'Uncategorized',
            'Description': expense.description || '',
            'Amount': parseFloat(expense.amount) || 0,
            'Notes': expense.notes || '',
            'Created': formatDate(expense.createdAt)
          }));
          
          const expensesWs = XLSX.utils.json_to_sheet(formattedExpenses);
          XLSX.utils.book_append_sheet(workbook, expensesWs, 'Expenses');
        } else {
          // Add empty sheet with headers
          const emptyExpensesWs = XLSX.utils.json_to_sheet([{
            'Date': '', 'Category': '', 'Description': '', 'Amount': '', 'Notes': '', 'Created': ''
          }]);
          XLSX.utils.book_append_sheet(workbook, emptyExpensesWs, 'Expenses (No Data)');
        }
      }

      // Add income sheet if needed
      if (exportType === 'all' || exportType === 'income') {
        if (filteredData.incomes.length > 0) {
          // Format income data for export
          const formattedIncomes = filteredData.incomes.map(income => ({
            'Date': formatDate(income.date),
            'Source': income.source || 'Uncategorized',
            'Description': income.description || '',
            'Amount': parseFloat(income.amount) || 0,
            'Notes': income.notes || '',
            'Created': formatDate(income.createdAt)
          }));
          
          const incomesWs = XLSX.utils.json_to_sheet(formattedIncomes);
          XLSX.utils.book_append_sheet(workbook, incomesWs, 'Income');
        } else {
          // Add empty sheet with headers
          const emptyIncomesWs = XLSX.utils.json_to_sheet([{
            'Date': '', 'Source': '', 'Description': '', 'Amount': '', 'Notes': '', 'Created': ''
          }]);
          XLSX.utils.book_append_sheet(workbook, emptyIncomesWs, 'Income (No Data)');
        }
      }

      // Add summary sheet with totals
      if (exportType === 'all') {
        // Calculate totals
        const expenseTotal = filteredData.expenses.reduce((sum, exp) => 
          sum + (parseFloat(exp.amount) || 0), 0);
        
        const incomeTotal = filteredData.incomes.reduce((sum, inc) => 
          sum + (parseFloat(inc.amount) || 0), 0);
        
        const balance = incomeTotal - expenseTotal;
        
        // Create summary data
        const summaryData = [
          { Category: 'Total Expenses', Amount: expenseTotal },
          { Category: 'Total Income', Amount: incomeTotal },
          { Category: 'Net Balance', Amount: balance }
        ];
        
        const summaryWs = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');
      }

      // Generate Excel file name
      const fileName = `FinanceData_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      // Export the workbook to Excel file and trigger download
      XLSX.writeFile(workbook, fileName);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000); // Clear success message after 3 seconds
    } catch (error) {
      console.error('Error exporting data:', error);
      setExportError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter data based on selected date range
  const getFilteredData = () => {
    // Make sure we have valid arrays
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    const safeIncomes = Array.isArray(incomes) ? incomes : [];
    
    // Get start and end dates based on selected range
    const { startDate, endDate } = getDateRange();
    
    // Filter expenses by date
    const filteredExpenses = safeExpenses.filter(expense => {
      if (!expense.date) return false;
      
      try {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      } catch (e) {
        return false;
      }
    });
    
    // Filter incomes by date
    const filteredIncomes = safeIncomes.filter(income => {
      if (!income.date) return false;
      
      try {
        const incomeDate = new Date(income.date);
        return incomeDate >= startDate && incomeDate <= endDate;
      } catch (e) {
        return false;
      }
    });
    
    return { expenses: filteredExpenses, incomes: filteredIncomes };
  };

  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date(0); // Jan 1, 1970
    let endDate = new Date(); // Today
    
    if (dateRange === 'month') {
      // Current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === 'year') {
      // Current year
      startDate = new Date(now.getFullYear(), 0, 1);
    } else if (dateRange === 'custom') {
      // Custom date range
      if (customStartDate) {
        startDate = new Date(customStartDate);
      }
      if (customEndDate) {
        endDate = new Date(customEndDate);
        // Set to end of day
        endDate.setHours(23, 59, 59, 999);
      }
    }
    
    return { startDate, endDate };
  };

  // Format date for Excel
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  // Get export type label for metadata
  const getExportTypeLabel = () => {
    switch (exportType) {
      case 'expenses': return 'Expenses Only';
      case 'income': return 'Income Only';
      default: return 'All Financial Data';
    }
  };

  // Get date range label for metadata
  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'month': return 'Current Month';
      case 'year': return 'Current Year';
      case 'custom': 
        return `Custom: ${customStartDate || 'All past'} to ${customEndDate || 'Present'}`;
      default: return 'All Time';
    }
  };

  // Count the number of items for each date range
  useEffect(() => {
    // We don't need to do anything here, just want the component to re-render
    // when the date range changes to update the data summary
  }, [dateRange, customStartDate, customEndDate]);

  return (
    <div className="export-container">
      <h2>Export Financial Data</h2>
      <p className="export-description">
        Export your financial data to an Excel file for further analysis or record-keeping.
      </p>
      
      {exportError && <div className="export-error">{exportError}</div>}
      {exportSuccess && <div className="export-success">Data exported successfully!</div>}
      
      <div className="export-options">
        <div className="option-group">
          <h3>What to Export</h3>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="exportType"
                value="all"
                checked={exportType === 'all'}
                onChange={() => setExportType('all')}
              />
              All Financial Data
            </label>
            
            <label className="radio-label">
              <input
                type="radio"
                name="exportType"
                value="expenses"
                checked={exportType === 'expenses'}
                onChange={() => setExportType('expenses')}
              />
              Expenses Only
            </label>
            
            <label className="radio-label">
              <input
                type="radio"
                name="exportType"
                value="income"
                checked={exportType === 'income'}
                onChange={() => setExportType('income')}
              />
              Income Only
            </label>
          </div>
        </div>
        
        <div className="option-group">
          <h3>Date Range</h3>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="dateRange"
                value="all"
                checked={dateRange === 'all'}
                onChange={() => setDateRange('all')}
              />
              All Time
            </label>
            
            <label className="radio-label">
              <input
                type="radio"
                name="dateRange"
                value="month"
                checked={dateRange === 'month'}
                onChange={() => setDateRange('month')}
              />
              Current Month
            </label>
            
            <label className="radio-label">
              <input
                type="radio"
                name="dateRange"
                value="year"
                checked={dateRange === 'year'}
                onChange={() => setDateRange('year')}
              />
              Current Year
            </label>
            
            <label className="radio-label">
              <input
                type="radio"
                name="dateRange"
                value="custom"
                checked={dateRange === 'custom'}
                onChange={() => setDateRange('custom')}
              />
              Custom Range
            </label>
          </div>
          
          {dateRange === 'custom' && (
            <div className="custom-date-range">
              <div className="date-input">
                <label htmlFor="startDate">Start Date:</label>
                <input
                  type="date"
                  id="startDate"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              
              <div className="date-input">
                <label htmlFor="endDate">End Date:</label>
                <input
                  type="date"
                  id="endDate"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="data-summary">
        <div className="summary-item">
          <span className="summary-label">Available Expenses:</span>
          <span className="summary-value">{Array.isArray(expenses) ? expenses.length : 0}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Available Income Entries:</span>
          <span className="summary-value">{Array.isArray(incomes) ? incomes.length : 0}</span>
        </div>
      </div>
      
      <button
        className="export-button"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? 'Exporting...' : 'Export to Excel'}
      </button>
      
      <div className="export-note">
        <p>
          <strong>Note:</strong> The exported file will be downloaded to your device and is not sent to any server.
        </p>
      </div>
    </div>
  );
};

export default ExportData;