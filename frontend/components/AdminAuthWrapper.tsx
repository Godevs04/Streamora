import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useColors } from '../hooks/useColors';
import { useAdminAuthStore } from '../store/useAdminAuthStore';
import AdminAuthSetup from './AdminAuthSetup';
import AdminAuthLogin from './AdminAuthLogin';
import AdminAuthForgot from './AdminAuthForgot';

interface AdminAuthWrapperProps {
  children: React.ReactNode;
}

export default function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const colors = useColors();
  const styles = createStyles(colors);

  const { isAuthenticated, hasSetup, authEnabled, checkAdminSetup } = useAdminAuthStore();

  useEffect(() => {
    // Initialize auth setup check
    const initializeAuth = async () => {
      setIsLoading(true);
      await checkAdminSetup();
      setIsLoading(false);
    };

    initializeAuth();
  }, []); // Only run once on mount

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      // Hide all auth screens when authenticated
      setShowSetup(false);
      setShowLogin(false);
      setShowForgot(false);
    } else if (authEnabled && hasSetup) {
      // Show login if auth is enabled and setup is complete
      setShowLogin(true);
      setShowSetup(false);
      setShowForgot(false);
    } else if (authEnabled && !hasSetup) {
      // Show setup if auth is enabled but not set up
      setShowSetup(true);
      setShowLogin(false);
      setShowForgot(false);
    }
  }, [isAuthenticated, hasSetup, authEnabled]);

  const handleSetupComplete = () => {
    setShowSetup(false);
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
  };

  const handleForgotSuccess = () => {
    console.log('handleForgotSuccess called - hiding forgot, showing login');
    setShowForgot(false);
    setShowLogin(true); // Go to login after successful reset
    console.log('Navigation state updated');
  };

  const handleCancel = () => {
    setShowSetup(false);
    setShowLogin(false);
    setShowForgot(false);
  };

  const handleForgot = () => {
    setShowLogin(false);
    setShowForgot(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show children if authenticated or auth is disabled
  if (isAuthenticated || !authEnabled) {
    return <>{children}</>;
  }

  // Show appropriate auth screen
  return (
    <>
      {showSetup && (
        <AdminAuthSetup
          visible={showSetup}
          onComplete={handleSetupComplete}
          onCancel={handleCancel}
        />
      )}
      
      {showLogin && (
        <AdminAuthLogin
          visible={showLogin}
          onSuccess={handleLoginSuccess}
          onCancel={handleCancel}
          onForgot={handleForgot}
        />
      )}
      
      {showForgot && (
        <AdminAuthForgot
          visible={showForgot}
          onSuccess={handleForgotSuccess}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
});
