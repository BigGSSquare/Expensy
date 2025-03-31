// src/components/auth/Register.js with added debugging
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const { register, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // If already logged in, redirect to dashboard
  if (currentUser) {
    navigate('/', { replace: true });
    return null;
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDebugInfo('Starting registration process...');
    
    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setDebugInfo('Validation passed, attempting to register...');
      console.log('Attempting to register user with email:', email);
      
      const success = await register(name, email, password);
      
      if (success) {
        console.log('Registration successful, user info:', {
          name: name,
          email: email
        });
        setDebugInfo('Registration successful! Redirecting...');
        navigate('/');
      } else {
        setError('Registration failed. Email may already be in use.');
        setDebugInfo('Registration returned false');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(`Registration error: ${err.message || 'Unknown error'}`);
      setDebugInfo(`Caught exception: ${err.message || 'Unknown error'}`);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create an Account</h1>
        <p className="auth-subtitle">Join Expensy to manage your finances</p>
        
        {error && <div className="auth-error">{error}</div>}
        {debugInfo && <div style={{padding: '10px', background: '#f0f0f0', marginBottom: '10px', fontSize: '12px'}}>{debugInfo}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <button type="submit" className="auth-button">Sign Up</button>
        </form>
        
        <div className="auth-links">
          <p>Already have an account? <Link to="/login">Log In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;