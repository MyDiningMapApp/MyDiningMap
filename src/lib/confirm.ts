import { Alert, Platform } from 'react-native';

/** Megerősítő kérdés (iOS: rendszer-párbeszédablak, web: böngésző confirm). */
export function confirm(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
  destructive = true,
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Mégse', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

/** Hibaüzenet megjelenítése. */
export function showError(message: string) {
  if (Platform.OS === 'web') {
    window.alert(message);
    return;
  }
  Alert.alert('Hiba', message);
}
