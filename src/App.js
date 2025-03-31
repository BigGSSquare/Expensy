import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import IncomeForm from './components/IncomeForm';
import Navigation from './components/Navigation';
import BudgetSettings from './components/BudgetSettings';
import TransactionHistory from './components/TransactionHistory';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/auth/Profile';
import Settings from './components/settings/Settings';
import AlertsProvider from './components/notifications/AlertsProvider';
import { ExpenseProvider } from './context/ExpenseContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ReceiptScanner from './components/ReceiptScanner';
import './App.css';
import SplitExpenseList from './components/split/SplitExpenseList';
import SplitExpenseForm from './components/split/SplitExpenseForm';
import SplitExpenseDetails from './components/split/SplitExpenseDetails';
import SplitContacts from './components/split/SplitContacts';
import { SplitExpenseProvider } from './context/SplitExpenseContext';
import ExportData from './components/ExportData'; // Import the new export component

function App() {
  return (
    <AuthProvider>
      <ExpenseProvider>
        <SplitExpenseProvider>
          <Router>
            <div className="app-container">
              <Navigation />
              <AlertsProvider />
              <main className="main-content">
                <Routes>
                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected Routes */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/add" element={
                    <ProtectedRoute>
                      <ExpenseForm />
                    </ProtectedRoute>
                  } />
                  <Route path="/add-income" element={
                    <ProtectedRoute>
                      <IncomeForm />
                    </ProtectedRoute>
                  } />
                  <Route path="/budget" element={
                    <ProtectedRoute>
                      <BudgetSettings />
                    </ProtectedRoute>
                  } />
                  <Route path="/history" element={
                    <ProtectedRoute>
                      <TransactionHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/scan-receipt" element={
                    <ProtectedRoute>
                      <ReceiptScanner />
                    </ProtectedRoute>
                  } />
                  {/* New Export Route */}
                  <Route path="/export" element={
                    <ProtectedRoute>
                      <ExportData />
                    </ProtectedRoute>
                  } />

                  {/* Split Expense Routes */}
                  <Route path="/split" element={
                    <ProtectedRoute>
                      <SplitExpenseList />
                    </ProtectedRoute>
                  } />
                  <Route path="/split/new" element={
                    <ProtectedRoute>
                      <SplitExpenseForm />
                    </ProtectedRoute>
                  } />
                  <Route path="/split/details/:id" element={
                    <ProtectedRoute>
                      <SplitExpenseDetails />
                    </ProtectedRoute>
                  } />
                  <Route path="/split/contacts" element={
                    <ProtectedRoute>
                      <SplitContacts />
                    </ProtectedRoute>
                  } />

                
                  {/* Fallback route - redirect to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </Router>
        </SplitExpenseProvider>
      </ExpenseProvider>
    </AuthProvider>
  );
}

export default App;