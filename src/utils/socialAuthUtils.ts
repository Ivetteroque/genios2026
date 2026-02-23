// Social authentication utility functions - SIMULATED VERSION

export interface SocialUserInfo {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  provider: 'google' | 'facebook' | 'apple';
}

// Mock user data for simulation
const mockUsers = {
  google: {
    id: 'google_123456789',
    name: 'María González',
    email: 'maria.gonzalez@gmail.com',
    profileImage: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    provider: 'google' as const
  },
  facebook: {
    id: 'facebook_987654321',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@facebook.com',
    profileImage: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    provider: 'facebook' as const
  },
  apple: {
    id: 'apple_456789123',
    name: 'Ana Rodríguez',
    email: 'ana.rodriguez@icloud.com',
    profileImage: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
    provider: 'apple' as const
  }
};

// Simulate authentication delay
const simulateAuthDelay = (ms: number = 2000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Simulated Google OAuth login
export const loginWithGoogle = async (): Promise<SocialUserInfo> => {
  console.log('🔄 Simulando autenticación con Google...');
  
  // Simulate authentication process
  await simulateAuthDelay(1500);
  
  // Simulate user consent dialog
  const userConsent = window.confirm(
    '🔐 Simulación de Google OAuth\n\n' +
    'Google te está pidiendo permisos para:\n' +
    '• Acceder a tu información básica de perfil\n' +
    '• Ver tu dirección de correo electrónico\n\n' +
    '¿Deseas continuar?'
  );
  
  if (!userConsent) {
    throw new Error('Google authentication was cancelled by user');
  }
  
  console.log('✅ Autenticación con Google exitosa');
  return mockUsers.google;
};

// Simulated Facebook OAuth login
export const loginWithFacebook = async (): Promise<SocialUserInfo> => {
  console.log('🔄 Simulando autenticación con Facebook...');
  
  // Simulate authentication process
  await simulateAuthDelay(1800);
  
  // Simulate user consent dialog
  const userConsent = window.confirm(
    '🔐 Simulación de Facebook Login\n\n' +
    'Facebook te está pidiendo permisos para:\n' +
    '• Acceder a tu información pública de perfil\n' +
    '• Ver tu dirección de correo electrónico\n\n' +
    '¿Deseas continuar?'
  );
  
  if (!userConsent) {
    throw new Error('Facebook authentication was cancelled by user');
  }
  
  console.log('✅ Autenticación con Facebook exitosa');
  return mockUsers.facebook;
};

// Simulated Apple OAuth login
export const loginWithApple = async (): Promise<SocialUserInfo> => {
  console.log('🔄 Simulando autenticación con Apple...');
  
  // Simulate authentication process
  await simulateAuthDelay(2200);
  
  // Simulate user consent dialog
  const userConsent = window.confirm(
    '🔐 Simulación de Sign in with Apple\n\n' +
    'Apple te está pidiendo permisos para:\n' +
    '• Compartir tu nombre\n' +
    '• Compartir tu dirección de correo (puede ser privada)\n\n' +
    '¿Deseas continuar?'
  );
  
  if (!userConsent) {
    throw new Error('Apple authentication was cancelled by user');
  }
  
  console.log('✅ Autenticación con Apple exitosa');
  return mockUsers.apple;
};

// Generic social login handler
export const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple'): Promise<SocialUserInfo> => {
  console.log(`🚀 Iniciando autenticación social con ${provider.toUpperCase()}`);
  
  try {
    let userInfo: SocialUserInfo;
    
    switch (provider) {
      case 'google':
        userInfo = await loginWithGoogle();
        break;
      case 'facebook':
        userInfo = await loginWithFacebook();
        break;
      case 'apple':
        userInfo = await loginWithApple();
        break;
      default:
        throw new Error(`Proveedor no soportado: ${provider}`);
    }
    
    console.log(`🎉 Autenticación exitosa con ${provider}:`, userInfo);
    return userInfo;
    
  } catch (error) {
    console.error(`❌ Error en autenticación con ${provider}:`, error);
    throw error;
  }
};

// Check if user exists in our system
export const checkExistingUser = (email: string): any | null => {
  try {
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const foundUser = existingUsers.find((user: any) => 
      user.email.toLowerCase() === email.toLowerCase()
    );
    
    if (foundUser) {
      console.log('👤 Usuario existente encontrado:', foundUser.name);
      return foundUser;
    }
    
    console.log('🆕 Usuario nuevo, requiere selección de rol');
    return null;
  } catch (error) {
    console.error('Error al verificar usuario existente:', error);
    return null;
  }
};

// Create user from social login data
export const createUserFromSocialLogin = (userInfo: SocialUserInfo, role: 'client' | 'genius'): any => {
  const userData = {
    id: `${userInfo.provider}_${Date.now()}`,
    name: userInfo.name,
    email: userInfo.email,
    profileImage: userInfo.profileImage,
    role: role,
    provider: userInfo.provider,
    socialId: userInfo.id,
    registeredAt: new Date().toISOString(),
    isVerified: true, // Social logins are considered verified
    loginMethod: userInfo.provider,
    dni: '', // Will be filled later if needed
    phone: '' // Will be filled later if needed
  };
  
  console.log(`👤 Usuario creado desde ${userInfo.provider} como ${role}:`, userData);
  return userData;
};

// Save user to our system
export const saveUser = (user: any): void => {
  try {
    // Add to registered users
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    // Check if user already exists to avoid duplicates
    const userExists = existingUsers.some((existingUser: any) => 
      existingUser.email.toLowerCase() === user.email.toLowerCase()
    );
    
    if (!userExists) {
      existingUsers.push(user);
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
      console.log('💾 Usuario guardado en registeredUsers');
    }
    
    // Set as current user
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');
    
    console.log('🔐 Usuario establecido como actual:', user.name);
    
  } catch (error) {
    console.error('Error al guardar usuario:', error);
    throw new Error('Error al guardar los datos del usuario');
  }
};

// Simulate logout from social provider
export const logoutFromSocialProvider = (provider: 'google' | 'facebook' | 'apple'): void => {
  console.log(`🚪 Cerrando sesión de ${provider.toUpperCase()}`);
  
  // In a real implementation, this would call the provider's logout method
  // For simulation, we just log the action
  switch (provider) {
    case 'google':
      console.log('📤 Google: Revocando tokens de acceso...');
      break;
    case 'facebook':
      console.log('📤 Facebook: Cerrando sesión de Facebook...');
      break;
    case 'apple':
      console.log('📤 Apple: Invalidando sesión de Apple ID...');
      break;
  }
  
  console.log(`✅ Sesión cerrada de ${provider}`);
};

// Get provider display name
export const getProviderDisplayName = (provider: string): string => {
  const displayNames = {
    google: 'Google',
    facebook: 'Facebook',
    apple: 'Apple'
  };
  
  return displayNames[provider as keyof typeof displayNames] || provider;
};

// Check if social provider is available
export const isProviderAvailable = (provider: 'google' | 'facebook' | 'apple'): boolean => {
  // In simulation mode, all providers are available
  console.log(`✅ Proveedor ${provider} disponible (modo simulación)`);
  return true;
};

// Initialize social auth (simulation)
export const initializeSocialAuth = (): Promise<void> => {
  return new Promise((resolve) => {
    console.log('🔧 Inicializando autenticación social (modo simulación)...');
    
    // Simulate initialization delay
    setTimeout(() => {
      console.log('✅ Autenticación social inicializada');
      resolve();
    }, 500);
  });
};

// Export mock users for testing
export const getMockUsers = () => mockUsers;

// Declare global types for external libraries (not used in simulation but kept for compatibility)
declare global {
  interface Window {
    google?: any;
    FB?: any;
    AppleID?: any;
  }
}