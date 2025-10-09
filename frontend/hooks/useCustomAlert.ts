import { useState } from 'react';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info';
  icon?: string;
  verticalButtons?: boolean;
}

export function useCustomAlert() {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertOptions>({
    title: '',
    message: '',
    buttons: [{ text: 'OK' }],
    type: 'info',
    verticalButtons: false,
  });

  const showAlert = (config: AlertOptions) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  const alert = {
    show: showAlert,
    hide: hideAlert,
    visible: alertVisible,
    config: alertConfig,
  };

  return alert;
}
