import React, { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import LoginPromptModal from './LoginPromptModal';
import { PreviousIntent } from '../types';

interface AuthRequiredWrapperProps {
  children: (showAuthModal: (intent: PreviousIntent) => void) => React.ReactNode;
}

/**
 * A wrapper component that handles authentication requirements
 * and shows a login prompt modal when needed
 */
const AuthRequiredWrapper: React.FC<AuthRequiredWrapperProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIntent, setCurrentIntent] = useState<PreviousIntent>({ type: 'like' });

  // Function to be passed to children to show auth modal with specific intent
  const showAuthModal = (intent: PreviousIntent): boolean => {
    if (!isAuthenticated) {
      setCurrentIntent(intent);
      setModalVisible(true);
      return false; // Not authenticated
    }
    return true; // Already authenticated
  };

  return (
    <>
      {children(showAuthModal)}
      
      <LoginPromptModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        intent={currentIntent}
      />
    </>
  );
};

export default AuthRequiredWrapper;
