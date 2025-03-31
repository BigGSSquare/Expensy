import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; 
import { ExpenseContext } from '../context/ExpenseContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import BudgetAlerts from './BudgetAlerts';
import EnhancedCategoryChart from './EnhancedCategoryChart';
import ImprovedBudgetChart from './ImprovedBudgetChart';
import { MessageSquare, X, Send } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { expenses, budgets, alerts, incomes } = useContext(ExpenseContext);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [timeframe, setTimeframe] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  
  // AI Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi there! I\'m your financial assistant. Ask me anything about your expenses or budgets.' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  
  // Safely calculate current month's data
  const currentMonthData = useCallback(() => {
    // Default empty state
    const defaultData = {
      totalExpenses: 0,
      totalIncome: 0,
      balance: 0
    };
    
    // Return default if no data
    if (!Array.isArray(expenses) || !Array.isArray(incomes)) {
      return defaultData;
    }
    
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Filter expenses for current month with error handling
      const monthlyExpenses = expenses.filter(expense => {
        if (!expense || !expense.date) return false;
        
        try {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === currentMonth && 
                 expenseDate.getFullYear() === currentYear;
        } catch (e) {
          return false;
        }
      });
      
      // Filter incomes for current month with error handling
      const monthlyIncome = incomes.filter(income => {
        if (!income || !income.date) return false;
        
        try {
          const incomeDate = new Date(income.date);
          return incomeDate.getMonth() === currentMonth && 
                 incomeDate.getFullYear() === currentYear;
        } catch (e) {
          return false;
        }
      });
      
      // Calculate totals with safeguards against NaN
      const totalExpenses = monthlyExpenses.reduce((sum, expense) => {
        const amount = parseFloat(expense.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const totalIncome = monthlyIncome.reduce((sum, income) => {
        const amount = parseFloat(income.amount);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      return {
        totalExpenses,
        totalIncome,
        balance: totalIncome - totalExpenses
      };
    } catch (error) {
      console.error('Error calculating monthly data:', error);
      return defaultData;
    }
  }, [expenses, incomes]);
  
  // Safely prepare chart data
  const prepareChartData = useCallback(() => {
    if (!Array.isArray(expenses) || expenses.length === 0) {
      setChartData([]);
      return;
    }
    
    try {
      const now = new Date();
      let filteredExpenses = [];
      
      if (timeframe === 'week') {
        // Last 7 days - use a safer approach with milliseconds
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        filteredExpenses = expenses.filter(expense => {
          if (!expense || !expense.date) return false;
          
          try {
            const expenseDate = new Date(expense.date);
            return expenseDate >= lastWeek;
          } catch (error) {
            return false;
          }
        });
      } else if (timeframe === 'month') {
        // Current month
        filteredExpenses = expenses.filter(expense => {
          if (!expense || !expense.date) return false;
          
          try {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === now.getMonth() && 
                   expenseDate.getFullYear() === now.getFullYear();
          } catch (error) {
            return false;
          }
        });
      } else if (timeframe === 'year') {
        // Current year
        filteredExpenses = expenses.filter(expense => {
          if (!expense || !expense.date) return false;
          
          try {
            const expenseDate = new Date(expense.date);
            return expenseDate.getFullYear() === now.getFullYear();
          } catch (error) {
            return false;
          }
        });
      }
      
      // Group by date
      const groupedData = {};
      
      filteredExpenses.forEach(expense => {
        if (!expense || !expense.date) return;
        
        const date = expense.date;
        if (!groupedData[date]) {
          groupedData[date] = 0;
        }
        
        const amount = parseFloat(expense.amount);
        groupedData[date] += isNaN(amount) ? 0 : amount;
      });
      
      // Convert to array for recharts
      const chartDataArray = Object.keys(groupedData)
        .sort()
        .map(date => ({
          date,
          amount: groupedData[date]
        }));
        
      setChartData(chartDataArray);
    } catch (error) {
      console.error('Error preparing chart data:', error);
      setChartData([]);
    }
  }, [expenses, timeframe]);
  
  // Safely prepare category data
  const prepareCategoryData = useCallback(() => {
    if (!Array.isArray(expenses) || expenses.length === 0) {
      setCategoryData([]);
      return;
    }
    
    try {
      const now = new Date();
      let filteredExpenses = [];
      
      if (timeframe === 'week') {
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        filteredExpenses = expenses.filter(expense => {
          if (!expense || !expense.date) return false;
          
          try {
            const expenseDate = new Date(expense.date);
            return expenseDate >= lastWeek;
          } catch (error) {
            return false;
          }
        });
      } else if (timeframe === 'month') {
        filteredExpenses = expenses.filter(expense => {
          if (!expense || !expense.date) return false;
          
          try {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === now.getMonth() && 
                   expenseDate.getFullYear() === now.getFullYear();
          } catch (error) {
            return false;
          }
        });
      } else if (timeframe === 'year') {
        filteredExpenses = expenses.filter(expense => {
          if (!expense || !expense.date) return false;
          
          try {
            const expenseDate = new Date(expense.date);
            return expenseDate.getFullYear() === now.getFullYear();
          } catch (error) {
            return false;
          }
        });
      }
      
      // Group by category
      const categoryTotals = {};
      
      filteredExpenses.forEach(expense => {
        if (!expense || !expense.category) return;
        
        const { category, amount } = expense;
        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
        }
        
        const parsedAmount = parseFloat(amount);
        categoryTotals[category] += isNaN(parsedAmount) ? 0 : parsedAmount;
      });
      
      // Convert to array for recharts
      const categoryDataArray = Object.keys(categoryTotals)
        .filter(category => categoryTotals[category] > 0) // Only include categories with values
        .map(category => ({
          name: category,
          value: categoryTotals[category]
        }));
      
      setCategoryData(categoryDataArray);
    } catch (error) {
      console.error('Error preparing category data:', error);
      setCategoryData([]);
    }
  }, [expenses, timeframe]);
  
  // Initialize data on first load and when dependencies change
  useEffect(() => {
    setIsLoading(true);
    prepareChartData();
    prepareCategoryData();
    setIsLoading(false);
  }, [expenses, timeframe, incomes, budgets, prepareChartData, prepareCategoryData]);
  
  // AI Assistant functions
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Add user message
    setMessages([...messages, { type: 'user', text: newMessage }]);
    
    // Process the message and generate a response
    const response = generateAIResponse(newMessage);
    
    // Add AI response with slight delay for natural feeling
    setTimeout(() => {
      setMessages(prevMessages => [...prevMessages, { type: 'bot', text: response }]);
    }, 500);
    
    // Clear input
    setNewMessage('');
  };
  
  const generateAIResponse = (message) => {
    // Get financial data for context
    const financialData = currentMonthData();
    const { totalExpenses, totalIncome, balance } = financialData;
    
    // Check for different question types and provide relevant responses
    const msgLower = message.toLowerCase();
    
    // Balance related questions
    if (msgLower.includes('balance') || msgLower.includes('surplus') || msgLower.includes('deficit')) {
      if (balance >= 0) {
        return `Your current balance is a surplus of $${balance.toFixed(2)}. You're doing well managing your budget this month!`;
      } else {
        return `Your current balance is a deficit of $${Math.abs(balance).toFixed(2)}. You might want to reduce some expenses to balance your budget.`;
      }
    }
    
    // Income related questions
    if (msgLower.includes('income') || msgLower.includes('earn')) {
      return `Your total income this month is $${totalIncome.toFixed(2)}.`;
    }
    
    // Expense related questions
    if (msgLower.includes('spend') || msgLower.includes('expense') || msgLower.includes('cost')) {
      if (categoryData.length > 0) {
        const topCategory = categoryData.sort((a, b) => b.value - a.value)[0];
        return `Your total expenses this month are $${totalExpenses.toFixed(2)}. Your highest spending category is "${topCategory.name}" at $${topCategory.value.toFixed(2)}.`;
      } else {
        return `Your total expenses this month are $${totalExpenses.toFixed(2)}.`;
      }
    }
    
    // Budget related questions
    if (msgLower.includes('budget') || msgLower.includes('limit')) {
      if (totalExpenses > totalIncome) {
        return `You're currently over budget by $${(totalExpenses - totalIncome).toFixed(2)}. Consider cutting back on unnecessary expenses.`;
      } else {
        return `You're currently under budget by $${(totalIncome - totalExpenses).toFixed(2)}. Great job managing your finances!`;
      }
    }
    
    // Saving related questions
    if (msgLower.includes('save') || msgLower.includes('saving')) {
      const savingRate = balance > 0 ? (balance / totalIncome) * 100 : 0;
      return `Based on your current income and expenses, you're saving about ${savingRate.toFixed(1)}% of your income. Financial experts often recommend saving at least 20% of your income.`;
    }
    
    // Tips
    if (msgLower.includes('tip') || msgLower.includes('advice') || msgLower.includes('help')) {
      const tips = [
        "Track all your expenses, even small ones. They add up over time.",
        "Try using the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.",
        "Consider setting up automatic transfers to a savings account when you receive income.",
        "Review your subscriptions regularly to cut unnecessary recurring expenses.",
        "For major purchases, follow the 24-hour rule: wait a day before buying to avoid impulse purchases."
      ];
      return tips[Math.floor(Math.random() * tips.length)];
    }
    
    // Default responses
    const defaultResponses = [
      "I can help you understand your spending patterns and budget. What would you like to know?",
      "I can provide insights on your expenses, income, or budget. Feel free to ask specific questions.",
      "Would you like to know about your spending by category, your savings rate, or budget status?",
      "I'm here to help with your financial questions. Ask me about your balance, expenses, or budget."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };
  
  // Handle enter key for sending message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  // Safely render the expense line chart
  const renderExpenseLineChart = () => {
    if (!chartData || chartData.length === 0) {
      return <p>No data available for the selected timeframe</p>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(date) => {
              try {
                if (timeframe === 'year') {
                  return new Date(date).toLocaleDateString(undefined, { month: 'short' });
                }
                return new Date(date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' });
              } catch (e) {
                return date;
              }
            }}
          />
          <YAxis 
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Amount']}
            labelFormatter={(label) => {
              try {
                return new Date(label).toLocaleDateString();
              } catch (e) {
                return label;
              }
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="#8884d8" 
            activeDot={{ r: 8 }} 
            name="Expense"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Safely render the budget comparison bar chart
  const renderBudgetComparisonChart = () => {
    if (!categoryData || categoryData.length === 0 || !budgets) {
      return <p>No data available for the selected timeframe</p>;
    }

    // Map budget data with safeguards
    const budgetData = categoryData
      .filter(item => item.name && typeof item.value === 'number')
      .map(item => {
        const budgetAmount = parseFloat(budgets[item.name] || 0);
        return {
          name: item.name,
          actual: item.value,
          budget: isNaN(budgetAmount) ? 0 : budgetAmount
        };
      })
      .filter(item => item.actual > 0 || item.budget > 0); // Only include items with values

    if (budgetData.length === 0) {
      return <p>No budget data available for comparison</p>;
    }

    // Use the ImprovedBudgetChart component
    return <ImprovedBudgetChart data={budgetData} />;
  };
  
  // Calculate monthly data outside the JSX
  const monthlyData = currentMonthData();
  const totalExpenses = monthlyData.totalExpenses;
  const totalIncome = monthlyData.totalIncome;
  const balance = monthlyData.balance;
  
  // Format currency values
  const formatCurrency = (value) => {
    return `$${parseFloat(value).toFixed(2)}`;
  };
  
  // Loading indicator
  if (isLoading) {
    return (
      <div className="dashboard loading">
        <p>Loading dashboard data...</p>
      </div>
    );
  }
  
  return (
    <div className="dashboard">
      <h1>Expense Dashboard</h1>
      
      <div className="action-buttons">
        <Link to="/add" className="action-btn expense-btn">Add Expense</Link>
        <Link to="/add-income" className="action-btn income-btn">Add Income</Link>
        <Link to="/scan-receipt" className="action-btn scanner-btn">Scan Receipt</Link>
      </div>
      
      {/* Show budget alerts if any exist */}
      {Array.isArray(alerts) && alerts.filter(alert => !alert.read).length > 0 && (
        <BudgetAlerts />
      )}
      
      <div className="summary-boxes">
        <div className="summary-box income-box">
          <div className="summary-title">Monthly Income</div>
          <div className="summary-value">{formatCurrency(totalIncome)}</div>
        </div>
        
        <div className="summary-box expense-box">
          <div className="summary-title">Monthly Expenses</div>
          <div className="summary-value">{formatCurrency(totalExpenses)}</div>
        </div>
        
        <div className={`summary-box balance-box ${balance >= 0 ? 'positive' : 'negative'}`}>
          <div className="summary-title">Balance</div>
          <div className="summary-value">{formatCurrency(Math.abs(balance))}</div>
          <div className="summary-label">{balance >= 0 ? 'Surplus' : 'Deficit'}</div>
        </div>
      </div>
      
      <div className="timeframe-selector">
        <button 
          className={timeframe === 'week' ? 'active' : ''} 
          onClick={() => setTimeframe('week')}
        >
          Week
        </button>
        <button 
          className={timeframe === 'month' ? 'active' : ''} 
          onClick={() => setTimeframe('month')}
        >
          Month
        </button>
        <button 
          className={timeframe === 'year' ? 'active' : ''} 
          onClick={() => setTimeframe('year')}
        >
          Year
        </button>
      </div>
      
      <div className="chart-container">
        <h2>Spending Over Time</h2>
        {renderExpenseLineChart()}
      </div>
      
      <div className="charts-row">
        <div className="chart-container">
          {/* Replace the pie chart with the enhanced category chart */}
          {categoryData && categoryData.length > 0 ? (
            <EnhancedCategoryChart data={categoryData} title="Spending by Category" />
          ) : (
            <p>No data available for the selected timeframe</p>
          )}
        </div>
        
        <div className="chart-container">
          <h2>Budget vs. Actual</h2>
          {renderBudgetComparisonChart()}
        </div>
      </div>
      
      {/* AI Chatbot Assistant */}
      <div className={`chat-assistant ${chatOpen ? 'open' : ''}`}>
        {!chatOpen ? (
          <button 
            className="chat-toggle-btn" 
            onClick={() => setChatOpen(true)}
            aria-label="Open financial assistant"
          >
            <MessageSquare size={24} />
            <span>Financial Assistant</span>
          </button>
        ) : (
          <div className="chat-container">
            <div className="chat-header">
              <h3>Financial Assistant</h3>
              <button 
                className="chat-close-btn" 
                onClick={() => setChatOpen(false)}
                aria-label="Close financial assistant"
              >
                <X size={18} />
              </button>
            </div>
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.type}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="chat-input-container">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your finances..."
                className="chat-input"
              />
              <button 
                className="chat-send-btn"
                onClick={handleSendMessage}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;