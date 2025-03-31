// src/components/Navigation.js
import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationCenter from './notifications/NotificationCenter';
import './Navigation.css';

const Navigation = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log("Attempting to log out");
      const success = await logout();
      
      if (success) {
        console.log("Logout successful");
        navigate('/login');
      } else {
        console.error("Logout returned false");
        alert("Failed to log out. Please try again.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert(`Logout failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="app-nav">
      <div className="app-title">
        <h1>Expensy</h1>
      </div>
      
      {currentUser ? (
        <>
          <ul className="nav-links">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/add" className={({ isActive }) => isActive ? 'active' : ''}>
                Add Expense
              </NavLink>
            </li>
            <li>
              <NavLink to="/history" className={({ isActive }) => isActive ? 'active' : ''}>
                History
              </NavLink>
            </li>
            <li>
              <NavLink to="/budget" className={({ isActive }) => isActive ? 'active' : ''}>
                Budget
              </NavLink>
            </li>
            <li>
              <NavLink to="/split" className={({ isActive }) => isActive ? 'active' : ''}>
                Split Expenses
              </NavLink>
            </li>
            <li>
              <NavLink to="/export" className={({ isActive }) => isActive ? 'active' : ''}>
                Export
              </NavLink>
            </li>
          </ul>
          
          <div className="nav-actions">
            <NotificationCenter />
            
            <div className="user-menu">
              <div className="user-info">
                <span>Hello, {currentUser.name || 'User'}</span>
                <div className="dropdown-content">
                  <NavLink to="/profile">Profile</NavLink>
                  <NavLink to="/settings">Settings</NavLink>
                  <NavLink to="/split/contacts">Split Contacts</NavLink>
                  <NavLink to="/export">Export Data</NavLink>
                  <button 
                    onClick={handleLogout} 
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <ul className="nav-links">
          <li>
            <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>
              Log In
            </NavLink>
          </li>
          <li>
            <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : ''}>
              Sign Up
            </NavLink>
          </li>
        </ul>
      )}
    </nav>
  );
};

export default Navigation;