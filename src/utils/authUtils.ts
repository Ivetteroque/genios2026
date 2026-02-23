// Authentication utility functions

import { isValidEmail, isValidPhone, isValidDNI, simulateApiDelay, getFirstName } from './commonUtils';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'genius';
  loginMethod: 'email' | 'google' | 'facebook' | 'apple';
  isVerified: boolean;
  registeredAt: string;
  profileImage?: string;
  dni?: string;
  phone?: string;
  location?: {
    departmentId: string;
    departmentName: string;
    provinceId: string;
    provinceName: string;
    districtId: string;
    districtName: string;
    fullName: string;
  };
}

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('isAuthenticated') === 'true';
};

// Get current user data
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Set current user
export const setCurrentUser = (user: User): void => {
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('isAuthenticated', 'true');
  
  // Dispatch custom event to notify components of auth state change
  window.dispatchEvent(new Event('authStateChanged'));
};

// Logout user
export const logout = (): void => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('isAuthenticated');
  
  // Dispatch custom event to notify components of auth state change
  window.dispatchEvent(new Event('authStateChanged'));
  
  // Redirect to home page
  window.location.href = '/';
};

// Get all registered users (for demo purposes)
export const getRegisteredUsers = (): User[] => {
  const usersStr = localStorage.getItem('registeredUsers');
  if (!usersStr) return [];
  
  try {
    return JSON.parse(usersStr) as User[];
  } catch (error) {
    console.error('Error parsing registered users:', error);
    return [];
  }
};

// Add user to registered users list
export const addRegisteredUser = (user: User): void => {
  const existingUsers = getRegisteredUsers();
  existingUsers.push(user);
  localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
};

// Check if email already exists
export const emailExists = (email: string): boolean => {
  const users = getRegisteredUsers();
  return users.some(user => user.email.toLowerCase() === email.toLowerCase());
};

// Generate mock user data for social login
export const generateMockSocialUser = (provider: string): { name: string; email: string; profileImage: string } => {
  const mockData = {
    'Google': {
      name: 'María González',
      email: 'maria@gmail.com',
      profileImage: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      location: {
        departmentId: 'tacna',
        departmentName: 'Tacna',
        provinceId: 'tacna-prov',
        provinceName: 'Tacna',
        districtId: 'tacna-dist',
        districtName: 'Tacna',
        fullName: 'Tacna, Tacna, Tacna'
      }
    },
    'Facebook': {
      name: 'Carlos Mendoza',
      email: 'carlos@facebook.com',
      profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      location: {
        departmentId: 'tacna',
        departmentName: 'Tacna',
        provinceId: 'tacna-prov',
        provinceName: 'Tacna',
        districtId: 'ciudad-nueva',
        districtName: 'Ciudad Nueva',
        fullName: 'Ciudad Nueva, Tacna, Tacna'
      }
    },
    'Apple': {
      name: 'Ana Rodríguez',
      email: 'ana@icloud.com',
      profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      location: {
        departmentId: 'lima',
        departmentName: 'Lima',
        provinceId: 'lima-prov',
        provinceName: 'Lima',
        districtId: 'miraflores-lima',
        districtName: 'Miraflores',
        fullName: 'Miraflores, Lima, Lima'
      }
    }
  };

  return mockData[provider as keyof typeof mockData] || mockData.Google;
};

// Update user authentication state and notify components
export const updateAuthState = (user: User | null): void => {
  if (user) {
    setCurrentUser(user);
  } else {
    logout();
  }
};

// Update user data
export const updateUser = (userId: string, updates: Partial<User>): boolean => {
  try {
    // Update current user if it's the same user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
    }
    
    // Update in registered users list
    const registeredUsers = getRegisteredUsers();
    const userIndex = registeredUsers.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
      // Create a copy without the profileImage to avoid localStorage quota issues
      const updatedUserForStorage = { ...registeredUsers[userIndex], ...updates };
      delete updatedUserForStorage.profileImage;
      registeredUsers[userIndex] = updatedUserForStorage;
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
      
      console.log('User updated successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

// Get user role display text
export const getRoleDisplayText = (role: 'client' | 'genius'): string => {
  return role === 'genius' ? 'Genio' : 'Cliente';
};