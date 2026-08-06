// Authentication utility functions

import { isValidEmail, isValidPhone, isValidDNI, simulateApiDelay, getFirstName } from './commonUtils';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  // `role` is the user's ACTIVE VIEW MODE, not a fixed identity. Everyone is a
  // client (can browse/hire); being a Genio is an additive capability (`isGenius`)
  // granted once the user completes the Genio profile wizard. Dual users toggle
  // `role` from the header to switch between the client and genio panels.
  role: 'client' | 'genius';
  // True when this account has a genius_profile in the DB (i.e. it can act as a
  // Genio). Derived at login from Supabase; a plain client has this false.
  isGenius?: boolean;
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

// Sync a client user to Supabase (fire-and-forget, best-effort).
//
// We deliberately do NOT use .upsert(): Postgres translates upsert into
// `INSERT ... ON CONFLICT DO UPDATE`, which requires a SELECT RLS policy on the
// table (even when no conflict occurs). client_profiles has no SELECT policy by
// design (privacy — admin reads via service role), so upsert always fails with
// 42501. Instead we INSERT, and if the row already exists (unique violation) we
// fall back to an UPDATE — both allowed by the existing policies.
//
// The table has TWO unique constraints: id (PK) and email. We key the fallback
// UPDATE on EMAIL, not id: email is the stable identity across logins, whereas a
// user's app id can differ from the row that already exists (e.g. a row created
// under an older id scheme). Updating by id in that case matches 0 rows and
// silently drops profile edits, so email is the robust key here.
const syncClientProfile = async (user: User): Promise<void> => {
  if (user.role !== 'client') return;

  const nowIso = new Date().toISOString();
  const row = {
    id: user.id,
    email: user.email,
    full_name: user.name,
    phone: user.phone ?? '',
    dni: user.dni ?? '',
    profile_image: user.profileImage ?? '',
    location: user.location ?? null,
    login_method: user.loginMethod,
    last_seen_at: nowIso,
    updated_at: nowIso,
  };

  const { error } = await supabase.from('client_profiles').insert(row);
  if (!error) return;

  // 23505 = unique_violation → a row with this id OR email already exists.
  // Update it by email (the stable key), leaving the immutable id/email as-is.
  if (error.code === '23505') {
    const { id: _id, email: _email, ...updates } = row;
    const { error: updateError } = await supabase
      .from('client_profiles')
      .update(updates)
      .eq('email', user.email);
    if (updateError) console.error('client_profiles update error:', updateError);
  } else {
    console.error('client_profiles insert error:', error);
  }
};

// Set current user
export const setCurrentUser = (user: User): void => {
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('isAuthenticated', 'true');
  syncClientProfile(user);
  // Dispatch custom event to notify components of auth state change
  window.dispatchEvent(new Event('authStateChanged'));
};

// Logout user
export const logout = async (): Promise<void> => {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('isAuthenticated');

  // Also end any Supabase Auth session (Google OAuth) and WAIT for it to finish.
  // We must clear the persisted Supabase session BEFORE redirecting, otherwise
  // SocialAuthBridge would still see a live session on the next page load and
  // silently log the user back in. scope: 'local' clears local storage without
  // a network round-trip, so it can't hang the logout.
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (err) {
    console.error('Supabase signOut error:', err);
  }

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

// Switch the current user's active view mode (client <-> genio). Only meaningful
// for users who are also genios; the caller is responsible for gating on isGenius.
export const setActiveMode = (mode: 'client' | 'genius'): void => {
  const user = getCurrentUser();
  if (!user || user.role === mode) return;
  setCurrentUser({ ...user, role: mode });
};