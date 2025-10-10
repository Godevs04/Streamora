export interface AdminAuthSetup {
  method: 'pin' | 'password' | 'pattern';
  credential: string;
  confirmCredential: string;
}

export interface AdminAuthLogin {
  method: 'pin' | 'password' | 'pattern';
  credential: string;
}

export interface AdminResetOTP {
  email: string;
  otp: string;
}

export interface AdminAuthState {
  isAuthenticated: boolean;
  authMethod: 'pin' | 'password' | 'pattern' | null;
  hasSetup: boolean;
  setupComplete: boolean;
}

export interface AdminSecuritySettings {
  enableBiometric: boolean;
  sessionTimeout: number; // in minutes
  maxAttempts: number;
  lockoutDuration: number; // in minutes
}

export interface AdminAuditLog {
  id: string;
  action: string;
  timestamp: Date;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
}

export interface AdminSession {
  id: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

// Validation schemas
export const AdminAuthValidation = {
  pin: {
    minLength: 4,
    maxLength: 8,
    pattern: /^\d+$/,
    message: 'PIN must be 4-8 digits'
  },
  password: {
    minLength: 6,
    maxLength: 128,
    pattern: /^.{6,128}$/,
    message: 'Password must be 6-128 characters'
  },
  pattern: {
    minLength: 4,
    maxLength: 9,
    pattern: /^[0-8]+(-[0-8]+)*$/,
    message: 'Pattern must be 4-9 dots connected in sequence'
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  otp: {
    pattern: /^\d{6}$/,
    message: 'OTP must be 6 digits'
  }
};

// Pattern validation helpers
export const validatePattern = (pattern: string): boolean => {
  const parts = pattern.split('-');
  if (parts.length < 4 || parts.length > 9) return false;
  
  // Check if all parts are valid dot IDs (0-8)
  for (const part of parts) {
    if (!/^[0-8]$/.test(part)) return false;
  }
  
  // Check for duplicates
  const uniqueParts = new Set(parts);
  if (uniqueParts.size !== parts.length) return false;
  
  return true;
};

export const formatPattern = (pattern: string): string => {
  return pattern.split('-').map(dotId => {
    const positions = ['Top-Left', 'Top-Center', 'Top-Right', 'Middle-Left', 'Center', 'Middle-Right', 'Bottom-Left', 'Bottom-Center', 'Bottom-Right'];
    return positions[parseInt(dotId)] || `Dot-${dotId}`;
  }).join(' → ');
};
