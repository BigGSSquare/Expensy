// src/components/auth/Profile.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Auth.css';

const Profile = () => {
  const { currentUser, updateProfile, changePassword, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Profile update state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  
  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  
  // Populate form with current data
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setEmailNotifications(
        currentUser.preferences?.emailNotifications !== false
      );
    }
  }, [currentUser]);
  
  // Check if user is loaded
  if (!currentUser) {
    return (
      <div className="loading">
        Loading profile data...
      </div>
    );
  }
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setIsProfileUpdating(true);
    
    if (!name || !email) {
      setProfileError('Name and email are required');
      setIsProfileUpdating(false);
      return;
    }
    
    try {
      // Include preferences in the update
      const preferences = {
        ...(currentUser?.preferences || {}),
        emailNotifications
      };
      
      const success = await updateProfile({ 
        name, 
        email,
        preferences
      });
      
      if (success) {
        setProfileMessage('Profile updated successfully');
      } else {
        setProfileError('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setProfileError(`Failed to update profile: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProfileUpdating(false);
    }
  };
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    setIsPasswordUpdating(true);
    
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('All password fields are required');
      setIsPasswordUpdating(false);
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      setIsPasswordUpdating(false);
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      setIsPasswordUpdating(false);
      return;
    }
    
    try {
      const success = await changePassword(oldPassword, newPassword);
      
      if (success) {
        setPasswordMessage('Password changed successfully');
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordError('Current password is incorrect');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError(`Failed to change password: ${error.message || 'Unknown error'}`);
    } finally {
      setIsPasswordUpdating(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      const success = await logout();
      if (success) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to log out. Please try again.');
    }
  };
  
  return (
    <div className="profile-container">
      <h1>Account Settings</h1>
      
      <div className="profile-card">
        <h2>Profile Information</h2>
        {profileMessage && <div className="auth-success">{profileMessage}</div>}
        {profileError && <div className="auth-error">{profileError}</div>}
        
        <form className="auth-form" onSubmit={handleProfileUpdate}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isProfileUpdating}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isProfileUpdating}
            />
          </div>
          
          <div className="form-group notification-preferences">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                disabled={isProfileUpdating}
              />
              Receive email notifications for budget alerts
            </label>
            <p className="preference-description">
              We'll send you an email when you exceed your budget in any category
            </p>
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isProfileUpdating}
          >
            {isProfileUpdating ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
      
      <div className="profile-card">
        <h2>Change Password</h2>
        {passwordMessage && <div className="auth-success">{passwordMessage}</div>}
        {passwordError && <div className="auth-error">{passwordError}</div>}
        
        <form className="auth-form" onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label htmlFor="oldPassword">Current Password</label>
            <input
              type="password"
              id="oldPassword"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              disabled={isPasswordUpdating}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isPasswordUpdating}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              disabled={isPasswordUpdating}
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isPasswordUpdating}
          >
            {isPasswordUpdating ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>
      
      <div className="profile-card danger-zone">
        <h2>Account Actions</h2>
        <button onClick={handleLogout} className="logout-button">Log Out</button>
      </div>
    </div>
  );
};

export default Profile;