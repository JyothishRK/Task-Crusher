import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const initAuth = async () => {
      console.log('Initializing authentication...');
      // Add a small delay to ensure cookies are properly loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      await checkAuthStatus();
    };
    initAuth();
  }, []);









  const API_BASE_URL = 'https://task-crusher.onrender.com';

  // Generic API call function with proper cookie handling
  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      credentials: 'include', // This is crucial for sending cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      console.log(`Making API call to: ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Authentication failed (401), clearing user state');
          // Handle authentication failure
          setUser(null);
          throw new Error('Authentication failed');
        }
        throw new Error(`API call failed: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const checkAuthStatus = async () => {
    try {
      // Check authentication status via API
      const response = await apiCall('/api/users/me');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Authentication successful, user data:', data);
      // Backend sends user object directly, not wrapped in data.user
      setUser(data);
    } catch (error) {
      console.log('First auth check failed:', error.message);
      // Try one more time after a short delay
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Retrying authentication...');
        const retryResponse = await apiCall('/api/users/me');
        
        if (!retryResponse.ok) {
          throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
        }
        
        const retryData = await retryResponse.json();
        console.log('Retry authentication successful:', retryData);
        setUser(retryData);
      } catch (retryError) {
        console.log('Retry auth check also failed, user not authenticated:', retryError.message);
        // Only set user to null if we're sure they're not authenticated
        // This prevents unnecessary redirects on temporary network issues
        if (retryError.message.includes('Authentication failed') || 
            retryError.message.includes('401')) {
          setUser(null);
        } else {
          // For other errors (network issues, etc.), don't immediately fail
          // This allows the user to stay authenticated if they were previously
          console.log('Non-authentication error, keeping current user state');
          // Don't set user to null for network errors, just log them
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData) => {
    try {
      const response = await apiCall('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      setUser(data.user);
      
      // Wait a moment for the cookie to be properly set
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, user: data.user };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Sign up failed' 
      };
    }
  };

  const signIn = async (credentials) => {
    try {
      const response = await apiCall('/api/users/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      setUser(data.user);
      
      // Wait a moment for the cookie to be properly set
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, user: data.user };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Sign in failed' 
      };
    }
  };

  const signOut = async () => {
    try {
      await apiCall('/api/users/logout', { method: 'POST' });
      setUser(null);
      return { success: true };
    } catch (error) {
      // Even if logout fails on backend, clear local state
      setUser(null);
      return { success: true };
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const refreshAuth = async () => {
    console.log('Refreshing authentication...');
    await checkAuthStatus();
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateUser,
    checkAuthStatus,
    refreshAuth,
    apiCall
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
