// Fix in ProtectedRoute.js
import React, { useContext, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('ProtectedRoute: Auth state', { 
      isAuthenticated: !!currentUser, 
      loading,
      userId: currentUser?.uid
    });
  }, [currentUser, loading]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="loading" style={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!currentUser) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }
  
  // Render child components if authenticated
  console.log('ProtectedRoute: User authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;