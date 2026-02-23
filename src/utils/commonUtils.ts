// Common utility functions used across the application

// Format date to Spanish locale
export const formatDateToSpanish = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  };
  
  return new Date(dateString).toLocaleDateString('es-ES', options || defaultOptions);
};

// Format date and time to Spanish locale
export const formatDateTimeToSpanish = (dateString: string): string => {
  return new Date(dateString).toLocaleString('es-ES');
};

// Get first name from full name
export const getFirstName = (fullName: string): string => {
  return fullName.split(' ')[0];
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone format (9 digits)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\d{9}$/;
  return phoneRegex.test(phone);
};

// Validate DNI format (8 digits)
export const isValidDNI = (dni: string): boolean => {
  const dniRegex = /^\d{8}$/;
  return dniRegex.test(dni);
};

// Generate random ID
export const generateId = (): string => {
  return Date.now().toString();
};

// Simulate API delay
export const simulateApiDelay = (ms: number = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Format currency to Peruvian Soles
export const formatCurrency = (amount: number): string => {
  return `S/ ${amount.toLocaleString('es-PE')}`;
};

// Calculate percentage
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Create URL-friendly slug
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9-]/g, '');
};

// Check if object is empty
export const isEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Generate random color from predefined palette
export const getRandomColor = (): string => {
  const colors = [
    '#A0C4FF', '#FFADAD', '#C0FDFB', '#FFD6A5', '#FDFD96', 
    '#E6E6FA', '#98FB98', '#F0E68C', '#DDA0DD', '#87CEEB'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if date is today
export const isToday = (dateString: string): boolean => {
  const today = new Date();
  const date = new Date(dateString);
  
  return today.toDateString() === date.toDateString();
};

// Check if date is within specified days
export const isWithinDays = (dateString: string, days: number): boolean => {
  const date = new Date(dateString);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return date >= cutoffDate;
};

// Get relative time (e.g., "hace 2 horas")
export const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'hace unos segundos';
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 2592000) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
  
  return formatDateToSpanish(dateString);
};