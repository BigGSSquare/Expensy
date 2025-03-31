// src/context/AuthContext.js with enhanced error handling
import React, { createContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  onAuthStateChanged,
  EmailAuthProvider, // Add this import
  reauthenticateWithCredential, // Add this import
  updatePassword // Add this import
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state change listener");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? `User logged in: ${user.email}` : "No user logged in");
      
      if (user) {
        try {
          // Get additional user data from Firestore
          console.log(`Getting user data from Firestore for uid: ${user.uid}`);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            console.log("User document found in Firestore");
            // Combine auth user with Firestore data
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              name: user.displayName || '',
              ...userDoc.data()
            });
          } else {
            console.log("No user document found in Firestore, using auth data only");
            // If no additional data exists, just use auth data
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              name: user.displayName || ''
            });
          }
        } catch (error) {
          console.error("Error getting user document:", error);
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            name: user.displayName || ''
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      setLoading(false);
    });

    return () => {
      console.log("Unsubscribing from auth state changes");
      unsubscribe();
    };
  }, []);

  // Register function with improved error handling
  const register = async (name, email, password) => {
    console.log(`Starting registration for ${email}`);
    try {
      // Create user in Firebase Auth
      console.log("Calling createUserWithEmailAndPassword");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User created successfully:", user.uid);
      
      // Set display name
      console.log("Setting user display name");
      await updateFirebaseProfile(user, { displayName: name });
      
      // Create user document in Firestore
      console.log("Creating user document in Firestore");
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        created: new Date().toISOString(),
        preferences: {
          emailNotifications: true
        }
      });
      
      console.log("Registration complete for:", email);
      return true;
    } catch (error) {
      // Enhanced error logging
      console.error('Registration error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Check for specific errors
      if (error.code === 'auth/email-already-in-use') {
        console.log("Email already in use");
      } else if (error.code === 'auth/invalid-email') {
        console.log("Invalid email format");
      } else if (error.code === 'auth/operation-not-allowed') {
        console.log("Email/password accounts are not enabled");
      } else if (error.code === 'auth/weak-password') {
        console.log("Password is too weak");
      }
      
      return false;
    }
  };

  // Login function with better error handling
  const login = async (email, password) => {
    console.log(`Attempting login for ${email}`);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful for:", email);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    console.log("Attempting logout");
    try {
      await signOut(auth);
      console.log("Logout successful");
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  };

  // Update profile
  const updateProfile = async (updatedData) => {
    if (!currentUser) {
      console.log("Cannot update profile: No user logged in");
      return false;
    }
    
    try {
      console.log("Updating user profile:", updatedData);
      // Update Firestore document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, updatedData);
      
      // Update display name if included
      if (updatedData.name && auth.currentUser) {
        console.log("Updating display name");
        await updateFirebaseProfile(auth.currentUser, {
          displayName: updatedData.name
        });
      }
      
      // Update local state
      setCurrentUser(prev => ({
        ...prev,
        ...updatedData
      }));
      
      console.log("Profile update complete");
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  // Change password function
  // Add the changePassword implementation in AuthContext.js
  const changePassword = async (oldPassword, newPassword) => {
    if (!currentUser || !auth.currentUser) {
      console.log("Cannot change password: No user logged in");
      return false;
    }
    
    try {
      // Re-authenticate the user first
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        oldPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Then change the password
      await updatePassword(auth.currentUser, newPassword);
      
      console.log("Password updated successfully");
      return true;
    } catch (error) {
      console.error('Password change error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};