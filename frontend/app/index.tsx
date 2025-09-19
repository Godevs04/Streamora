import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import useAuthStore from '../store/useAuthStore';
import colors from '../constants/colors';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [showRedirect, setShowRedirect] = React.useState(false);
  
  // Force redirect after 1 second regardless of loading state
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowRedirect(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading && !showRedirect) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Streamora...</Text>
      </View>
    );
  }
  
  // Always redirect to home page
  // Auth checks will be handled by the AuthRequiredWrapper components
  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
  },
});
