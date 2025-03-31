// src/components/settings/Settings.js
import React from 'react';
import CategoryManagement from './CategoryManagement';
import './Settings.css';

const Settings = () => {
  return (
    <div className="settings-container">
      <h1>Settings</h1>
      
      <CategoryManagement />
      
      {/* You can add more settings sections here in the future */}
    </div>
  );
};

export default Settings;